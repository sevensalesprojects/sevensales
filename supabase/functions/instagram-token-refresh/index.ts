import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const META_APP_ID = Deno.env.get("META_APP_ID") || "";
  const META_APP_SECRET = Deno.env.get("META_APP_SECRET") || "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Find tokens expiring within 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: accounts, error } = await supabase
      .from("instagram_accounts")
      .select("id, access_token, token_expires_at, username, project_id")
      .eq("status", "active")
      .not("token_expires_at", "is", null)
      .lt("token_expires_at", sevenDaysFromNow.toISOString());

    if (error) throw error;

    let refreshed = 0;
    let failed = 0;

    for (const account of accounts || []) {
      try {
        // Exchange for long-lived token via Meta Graph API
        const res = await fetch(
          `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${account.access_token}`,
          { method: "GET" }
        );

        // For long-lived tokens, use the refresh endpoint instead
        const refreshRes = await fetch(
          `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${account.access_token}`
        );

        const refreshData = await refreshRes.json();

        if (refreshRes.ok && refreshData.access_token) {
          const newExpiresAt = new Date();
          newExpiresAt.setSeconds(newExpiresAt.getSeconds() + (refreshData.expires_in || 5184000)); // default 60 days

          await supabase
            .from("instagram_accounts")
            .update({
              access_token: refreshData.access_token,
              token_expires_at: newExpiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", account.id);

          await supabase.from("system_logs").insert({
            action: "instagram_token_refreshed",
            project_id: account.project_id,
            entity_type: "integration",
            entity_id: account.id,
            metadata: { username: account.username, expires_at: newExpiresAt.toISOString() },
          });

          refreshed++;
          console.log(`✅ Token refreshed for @${account.username}`);
        } else {
          throw new Error(refreshData.error?.message || "Refresh failed");
        }

        // Consume first response body
        await res.text();
      } catch (e) {
        failed++;
        console.error(`❌ Token refresh failed for account ${account.id}:`, e);

        await supabase.from("system_logs").insert({
          action: "instagram_token_refresh_error",
          project_id: account.project_id,
          entity_type: "integration",
          entity_id: account.id,
          metadata: { error: String(e), username: account.username },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: (accounts || []).length, refreshed, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Token refresh job error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
