import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const usersToCreate = [
    { email: "joao@fastsales.com", full_name: "João", password: "FastSales2026!", roles: ["admin_master"] },
    { email: "micharlison@fastsales.com", full_name: "Micharlison", password: "FastSales2026!", roles: ["closer"] },
    { email: "amauri@fastsales.com", full_name: "Amauri", password: "FastSales2026!", roles: ["closer", "sdr"] },
    { email: "bruna@fastsales.com", full_name: "Bruna", password: "FastSales2026!", roles: ["sdr"] },
    { email: "adrielly@fastsales.com", full_name: "Adrielly", password: "FastSales2026!", roles: ["sdr"] },
    { email: "luana@fastsales.com", full_name: "Luana", password: "FastSales2026!", roles: ["sdr"] },
    { email: "roberta@fastsales.com", full_name: "Roberta Lamb", password: "FastSales2026!", roles: ["sdr"] },
  ];

  const results: any[] = [];

  for (const u of usersToCreate) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);
    
    let userId: string;

    if (existing) {
      userId = existing.id;
      results.push({ email: u.email, status: "already_exists", userId });
    } else {
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name },
      });

      if (error) {
        results.push({ email: u.email, status: "error", error: error.message });
        continue;
      }
      userId = newUser.user.id;
      results.push({ email: u.email, status: "created", userId });
    }

    // Assign roles
    for (const role of u.roles) {
      const { error: roleErr } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
      if (roleErr) {
        results.push({ email: u.email, role, status: "role_error", error: roleErr.message });
      }
    }
  }

  // Also ensure Josias (existing admin_master) keeps role
  // Already has admin_master from query, no action needed

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

