import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Rate Limiting Helper ───
async function checkRateLimit(
  client: any,
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count } = await client
    .from("system_logs")
    .select("id", { count: "exact", head: true })
    .eq("action", `rate_limit:${key}`)
    .gte("created_at", windowStart);

  if ((count || 0) >= maxRequests) return false;

  await client.from("system_logs").insert({
    action: `rate_limit:${key}`,
    metadata: {},
  });
  return true;
}

// ─── Project Access Validation ───
async function validateProjectAccess(
  client: any,
  userId: string,
  projectId: string
): Promise<boolean> {
  const { data: isMaster } = await client.rpc("has_role", {
    _user_id: userId,
    _role: "admin_master",
  });
  if (isMaster) return true;

  const { data } = await client
    .from("user_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .single();
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Validate user auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } =
    await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claimsData.claims.sub as string;

  try {
    const { lead_id, content, project_id } = await req.json();

    if (!lead_id || !content || !project_id) {
      return new Response(
        JSON.stringify({ error: "Missing lead_id, content, or project_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3.1 Validate project access
    const hasAccess = await validateProjectAccess(adminClient, userId, project_id);
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Forbidden: no project access" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3.2 Rate limiting: max 30 sends per minute per user
    const allowed = await checkRateLimit(adminClient, `ig-send:${userId}`, 30, 60);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Muitas requisições. Aguarde 1 minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lead's Instagram user ID
    const { data: lead } = await adminClient
      .from("leads")
      .select("instagram, project_id")
      .eq("id", lead_id)
      .single();

    if (!lead || !lead.instagram) {
      return new Response(
        JSON.stringify({ error: "Lead has no Instagram ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Instagram account + access token for this project
    const { data: igAccount } = await adminClient
      .from("instagram_accounts")
      .select("access_token, instagram_user_id")
      .eq("project_id", lead.project_id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!igAccount) {
      return new Response(
        JSON.stringify({ error: "No active Instagram account for this project" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send message via Meta Graph API
    const graphRes = await fetch(
      `https://graph.facebook.com/v19.0/${igAccount.instagram_user_id}/messages?access_token=${encodeURIComponent(igAccount.access_token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: lead.instagram },
          message: { text: content },
        }),
      }
    );

    const graphData = await graphRes.json();

    if (!graphRes.ok) {
      console.error("Meta API error:", graphData);

      await adminClient.from("system_logs").insert({
        action: "instagram_message_send_error",
        user_id: userId,
        project_id: lead.project_id,
        entity_type: "message",
        entity_id: lead_id,
        metadata: { error: graphData },
      });

      return new Response(
        JSON.stringify({ error: "Failed to send Instagram message", details: graphData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save outbound message to DB
    const { data: savedMsg } = await adminClient
      .from("messages")
      .insert({
        lead_id,
        project_id: lead.project_id,
        channel: "instagram",
        direction: "outbound",
        content,
        sender_id: userId,
        instagram_message_id: graphData.message_id || null,
      })
      .select("id")
      .single();

    // Log success
    await adminClient.from("system_logs").insert({
      action: "instagram_message_sent",
      user_id: userId,
      project_id: lead.project_id,
      entity_type: "message",
      entity_id: savedMsg?.id,
      metadata: { recipient: lead.instagram, message_id: graphData.message_id },
    });

    return new Response(
      JSON.stringify({ success: true, message_id: graphData.message_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("instagram-send error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
