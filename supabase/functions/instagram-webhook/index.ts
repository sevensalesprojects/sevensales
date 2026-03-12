import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ─── GET: Webhook Verification ───
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
      console.log("✅ Instagram webhook verified");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ─── POST: Receive Messages ───
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("📩 Instagram webhook received:", JSON.stringify(body));

      // 3.3 Save to webhook queue FIRST for resilience
      await supabase.from("webhook_queue").insert({
        source: "instagram",
        payload: body,
      });

      if (body.object !== "instagram") {
        return new Response("Not instagram", { status: 200, headers: corsHeaders });
      }

      // Process immediately (queue serves as backup for retries)
      for (const entry of body.entry || []) {
        for (const event of entry.messaging || []) {
          await processMessage(supabase, event);
        }
      }

      // Log webhook event
      await supabase.from("system_logs").insert({
        action: "instagram_webhook_received",
        entity_type: "integration",
        metadata: { entry_count: (body.entry || []).length },
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("❌ Instagram webhook error:", error);

      await supabase.from("system_logs").insert({
        action: "instagram_webhook_error",
        entity_type: "integration",
        metadata: { error: String(error) },
      });

      return new Response(JSON.stringify({ error: "Processing failed" }), {
        status: 200, // Always return 200 to Meta to avoid retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});

// ─── Helper: Fetch profile via conversations API ───
async function fetchInstagramProfile(
  igAccountId: string,
  senderId: string,
  accessToken: string
): Promise<{ name: string | null; username: string | null; profilePic: string | null }> {
  try {
    const convRes = await fetch(
      `https://graph.facebook.com/v19.0/${igAccountId}/conversations?user_id=${senderId}&fields=participants{name,username,profile_pic}&access_token=${accessToken}`
    );
    if (convRes.ok) {
      const convData = await convRes.json();
      const participants = convData.data?.[0]?.participants?.data || [];
      const userParticipant = participants.find(
        (p: any) => p.id !== igAccountId
      );
      if (userParticipant) {
        return {
          name: userParticipant.name || null,
          username: userParticipant.username || null,
          profilePic: userParticipant.profile_pic || null,
        };
      }
    }
  } catch {
    // Ignore profile fetch errors
  }
  return { name: null, username: null, profilePic: null };
}

async function processMessage(supabase: any, event: any) {
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const message = event.message;

  if (!senderId || !message) return;

  const messageText = message.text || "";
  const midId = message.mid || "";
  const attachmentUrl = message.attachments?.[0]?.payload?.url || null;

  // 1. Find which instagram account this belongs to
  const { data: igAccount } = await supabase
    .from("instagram_accounts")
    .select("id, project_id, instagram_user_id, access_token")
    .eq("instagram_user_id", recipientId)
    .eq("status", "active")
    .single();

  if (!igAccount) {
    console.warn("⚠️ No instagram account found for recipient:", recipientId);
    return;
  }

  const projectId = igAccount.project_id;

  // 2. Fetch profile data via conversations API
  let profileName = `Instagram ${senderId}`;
  let username: string | null = null;
  let profilePicUrl: string | null = null;

  if (igAccount.access_token) {
    const profile = await fetchInstagramProfile(
      igAccount.instagram_user_id,
      senderId,
      igAccount.access_token
    );
    if (profile.name) profileName = profile.name;
    username = profile.username;
    profilePicUrl = profile.profilePic;
  }

  // 3. Find or create lead
  let { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("project_id", projectId)
    .eq("instagram", senderId)
    .single();

  if (!lead) {
    const { data: newLead } = await supabase
      .from("leads")
      .insert({
        project_id: projectId,
        name: profileName,
        instagram: senderId,
        instagram_username: username,
        avatar_url: profilePicUrl,
        source: "instagram",
        channel: "instagram",
      })
      .select("id")
      .single();

    lead = newLead;

    await supabase.from("system_logs").insert({
      action: "lead_auto_created_instagram",
      project_id: projectId,
      entity_type: "lead",
      entity_id: lead?.id,
      metadata: { instagram_user_id: senderId, username, profile_pic: profilePicUrl },
    });
  } else {
    const updates: Record<string, string> = {};
    if (profileName && profileName !== `Instagram ${senderId}`) updates.name = profileName;
    if (username) updates.instagram_username = username;
    if (profilePicUrl) updates.avatar_url = profilePicUrl;
    if (Object.keys(updates).length > 0) {
      await supabase.from("leads").update(updates).eq("id", lead.id);
    }
  }

  if (!lead) {
    console.error("❌ Failed to find or create lead for:", senderId);
    return;
  }

  // 4. Check for duplicate message
  if (midId) {
    const { data: existing } = await supabase
      .from("messages")
      .select("id")
      .eq("instagram_message_id", midId)
      .single();

    if (existing) {
      console.log("⏭️ Duplicate message skipped:", midId);
      return;
    }
  }

  // 5. Save message
  await supabase.from("messages").insert({
    lead_id: lead.id,
    project_id: projectId,
    channel: "instagram",
    direction: "inbound",
    content: messageText || (attachmentUrl ? "[Mídia]" : "[Mensagem vazia]"),
    media_url: attachmentUrl,
    instagram_message_id: midId,
  });

  // 6. Log
  await supabase.from("system_logs").insert({
    action: "instagram_message_received",
    project_id: projectId,
    entity_type: "message",
    entity_id: lead.id,
    metadata: { sender_id: senderId, mid: midId },
  });

  // 7. Fire automations
  try {
    const { data: automations } = await supabase
      .from("automations")
      .select("id, name, action_type, action_config")
      .eq("project_id", projectId)
      .eq("trigger_type", "instagram_message_received")
      .eq("is_active", true);

    for (const auto of automations || []) {
      console.log(`⚡ Firing automation: ${auto.name} for lead ${lead.id}`);

      if (auto.action_type === "create_task" || auto.action_type === "assign_followup") {
        await supabase.from("system_logs").insert({
          action: "automation_triggered",
          project_id: projectId,
          entity_type: "automation",
          entity_id: auto.id,
          metadata: { lead_id: lead.id, automation_name: auto.name, trigger: "instagram_message_received" },
        });
      }

      if (auto.action_type === "send_message") {
        const replyText = (auto.action_config as any)?.message || "";
        if (replyText) {
          const { data: igAcc } = await supabase
            .from("instagram_accounts")
            .select("instagram_user_id, access_token")
            .eq("project_id", projectId)
            .eq("status", "active")
            .limit(1)
            .single();

          if (igAcc?.access_token) {
            try {
              const sendRes = await fetch(
                `https://graph.facebook.com/v19.0/${igAcc.instagram_user_id}/messages?access_token=${encodeURIComponent(igAcc.access_token)}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    recipient: { id: senderId },
                    message: { text: replyText },
                  }),
                }
              );
              const sendData = await sendRes.json();

              if (sendRes.ok) {
                await supabase.from("messages").insert({
                  lead_id: lead.id,
                  project_id: projectId,
                  channel: "instagram",
                  direction: "outbound",
                  content: replyText,
                  instagram_message_id: sendData.message_id || null,
                });
              }
            } catch (e) {
              console.error("❌ Auto-reply failed:", e);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("❌ Automation execution error:", e);
  }

  console.log("✅ Instagram message processed for lead:", lead.id);
}
