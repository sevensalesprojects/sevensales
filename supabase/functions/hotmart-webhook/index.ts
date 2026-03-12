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

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const HOTMART_TOKEN = Deno.env.get("HOTMART_WEBHOOK_TOKEN") || "";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Optional: Verify Hotmart webhook token via header
  const hotToken = req.headers.get("x-hotmart-hottok") || "";
  if (HOTMART_TOKEN && hotToken !== HOTMART_TOKEN) {
    console.warn("⚠️ Invalid Hotmart webhook token");
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("📩 Hotmart webhook received:", JSON.stringify(body));

    const event = body.event || body.data?.purchase?.status;
    const buyerEmail = body.data?.buyer?.email;
    const buyerName = body.data?.buyer?.name;
    const productName = body.data?.product?.name || "Produto";
    const amount = body.data?.purchase?.price?.value || 0;
    const externalId = body.data?.purchase?.transaction || null;

    if (!buyerEmail) {
      await supabase.from("system_logs").insert({
        action: "hotmart_webhook_no_email",
        entity_type: "integration",
        metadata: { event, body },
      });
      return new Response(JSON.stringify({ error: "No buyer email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the project that has Hotmart integration configured
    const { data: integration } = await supabase
      .from("integrations")
      .select("project_id")
      .eq("type", "hotmart")
      .eq("status", "active")
      .limit(1)
      .single();

    const projectId = integration?.project_id;

    if (!projectId) {
      console.warn("⚠️ No active Hotmart integration found");
      await supabase.from("system_logs").insert({
        action: "hotmart_webhook_no_project",
        entity_type: "integration",
        metadata: { event, email: buyerEmail },
      });
      return new Response(JSON.stringify({ error: "No active Hotmart integration" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find or create lead by email
    let { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("project_id", projectId)
      .eq("email", buyerEmail)
      .single();

    if (!lead) {
      const { data: newLead } = await supabase
        .from("leads")
        .insert({
          name: buyerName || buyerEmail,
          email: buyerEmail,
          source: "hotmart",
          channel: "outro",
          project_id: projectId,
        })
        .select("id")
        .single();

      lead = newLead;

      await supabase.from("system_logs").insert({
        action: "lead_auto_created_hotmart",
        project_id: projectId,
        entity_type: "lead",
        entity_id: lead?.id,
        metadata: { email: buyerEmail, name: buyerName },
      });
    }

    if (!lead) {
      console.error("❌ Failed to find or create lead for:", buyerEmail);
      return new Response(JSON.stringify({ error: "Failed to process lead" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process based on event type
    if (event === "PURCHASE_APPROVED" || event === "APPROVED" || event === "purchase.approved") {
      // Create sale record
      const { data: sale } = await supabase
        .from("sales")
        .insert({
          lead_id: lead.id,
          project_id: projectId,
          product: productName,
          amount: Number(amount) || 0,
          source: "hotmart",
          status: "approved",
          external_id: externalId,
        })
        .select("id")
        .single();

      // Update lead sale_status
      await supabase
        .from("leads")
        .update({ sale_status: "sold" })
        .eq("id", lead.id);

      // Create onboarding process automatically
      await supabase.from("onboarding_process").insert({
        lead_id: lead.id,
        project_id: projectId,
        sale_id: sale?.id,
        stage: "etapa_inicial",
        status: "active",
        purchase_date: new Date().toISOString(),
      });

      await supabase.from("system_logs").insert({
        action: "hotmart_purchase_approved",
        project_id: projectId,
        entity_type: "sale",
        entity_id: sale?.id,
        metadata: { email: buyerEmail, product: productName, amount, external_id: externalId },
      });

      console.log(`✅ Hotmart purchase approved for ${buyerEmail}: ${productName}`);
    } else if (event === "PURCHASE_CANCELED" || event === "CANCELED" || event === "purchase.canceled") {
      await supabase
        .from("leads")
        .update({ sale_status: "cancelled" })
        .eq("id", lead.id);

      await supabase.from("system_logs").insert({
        action: "hotmart_purchase_canceled",
        project_id: projectId,
        entity_type: "lead",
        entity_id: lead.id,
        metadata: { email: buyerEmail, event },
      });
    } else if (event === "PURCHASE_REFUNDED" || event === "REFUNDED" || event === "purchase.refunded") {
      await supabase
        .from("sales")
        .update({ status: "refunded" })
        .eq("lead_id", lead.id)
        .eq("source", "hotmart")
        .order("created_at", { ascending: false })
        .limit(1);

      await supabase.from("system_logs").insert({
        action: "hotmart_purchase_refunded",
        project_id: projectId,
        entity_type: "lead",
        entity_id: lead.id,
        metadata: { email: buyerEmail, event },
      });
    }

    // Log webhook event
    await supabase.from("system_logs").insert({
      action: "hotmart_webhook_received",
      project_id: projectId,
      entity_type: "integration",
      metadata: { event, email: buyerEmail },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Hotmart webhook error:", error);

    await supabase.from("system_logs").insert({
      action: "hotmart_webhook_error",
      entity_type: "integration",
      metadata: { error: String(error) },
    });

    return new Response(JSON.stringify({ error: "Processing failed" }), {
      status: 200, // Always 200 to avoid retries
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
