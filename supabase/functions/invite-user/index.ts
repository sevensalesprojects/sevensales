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
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Validate caller is authenticated admin
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
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const callerId = claimsData.claims.sub as string;

  // Only admins can invite users
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: isAdmin } = await adminClient.rpc("is_admin", { _user_id: callerId });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden: only admins can invite users" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, full_name, phone, role, project_id } = await req.json();

    if (!email || !full_name || !role) {
      return new Response(JSON.stringify({ error: "Missing email, full_name, or role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Invite user via Supabase Auth admin API
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name, phone: phone || null },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = data.user.id;

    // Assign role
    await adminClient.from("user_roles").insert({ user_id: newUserId, role });

    // Assign to project if provided
    if (project_id) {
      await adminClient.from("user_projects").insert({ user_id: newUserId, project_id });
    }

    // Log
    await adminClient.from("system_logs").insert({
      action: "user_invited",
      user_id: callerId,
      entity_type: "user",
      entity_id: newUserId,
      metadata: { email, full_name, role, project_id },
    });

    return new Response(JSON.stringify({ success: true, user_id: newUserId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("invite-user error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
