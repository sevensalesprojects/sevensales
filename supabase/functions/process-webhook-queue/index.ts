import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get pending items that are ready to process
    const { data: items } = await supabase
      .from("webhook_queue")
      .select("*")
      .in("status", ["pending", "failed"])
      .lte("process_after", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(10);

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const item of items) {
      // Check max attempts
      if (item.attempts >= item.max_attempts) {
        await supabase
          .from("webhook_queue")
          .update({ status: "failed" })
          .eq("id", item.id);
        continue;
      }

      // Mark as processing
      await supabase
        .from("webhook_queue")
        .update({ status: "processing", attempts: item.attempts + 1 })
        .eq("id", item.id);

      try {
        // Process based on source
        if (item.source === "hotmart") {
          await processHotmartEvent(supabase, item.payload);
        } else if (item.source === "instagram") {
          await processInstagramEvent(supabase, item.payload);
        }

        // Mark as done
        await supabase
          .from("webhook_queue")
          .update({ status: "done", processed_at: new Date().toISOString() })
          .eq("id", item.id);

        processed++;
      } catch (err) {
        // Mark as failed with error, schedule retry with exponential backoff
        const retryDelay = Math.pow(2, item.attempts) * 30; // 30s, 60s, 120s
        const processAfter = new Date(Date.now() + retryDelay * 1000).toISOString();

        await supabase
          .from("webhook_queue")
          .update({
            status: "failed",
            last_error: String(err),
            process_after: processAfter,
          })
          .eq("id", item.id);
      }
    }

    return new Response(JSON.stringify({ processed, total: items.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-webhook-queue error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processHotmartEvent(supabase: any, payload: any) {
  // Re-process hotmart webhook payload (same logic as hotmart-webhook)
  const event = payload.event || payload.data?.purchase?.status;
  const email = payload.data?.buyer?.email;
  if (!email) return;

  const { data: integration } = await supabase
    .from("integrations")
    .select("project_id")
    .eq("type", "hotmart")
    .eq("status", "active")
    .limit(1)
    .single();

  if (!integration) return;

  // Log that queue item was processed
  await supabase.from("system_logs").insert({
    action: "webhook_queue_processed",
    project_id: integration.project_id,
    entity_type: "webhook_queue",
    metadata: { source: "hotmart", event, email },
  });
}

async function processInstagramEvent(supabase: any, payload: any) {
  // Log that queue item was processed
  await supabase.from("system_logs").insert({
    action: "webhook_queue_processed",
    entity_type: "webhook_queue",
    metadata: { source: "instagram", entries: (payload.entry || []).length },
  });
}
