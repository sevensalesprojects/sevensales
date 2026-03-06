import { supabase } from "@/integrations/supabase/client";

/**
 * Auto-create follow-up tasks when SDR sends first message to a lead.
 * Call this after sending a message to a lead.
 */
export async function triggerFollowupOnFirstMessage(leadId: string, sdrId: string, projectId: string) {
  try {
    // Check if lead already has follow-up tasks
    const { data: existingTasks } = await supabase
      .from("followup_tasks")
      .select("id")
      .eq("lead_id", leadId)
      .limit(1) as any;

    if (existingTasks && existingTasks.length > 0) return; // Already has follow-up

    // Find active flow for "lead_no_response" condition
    const { data: flows } = await supabase
      .from("followup_flows")
      .select("id, trigger_condition")
      .eq("project_id", projectId)
      .eq("is_active", true);

    if (!flows || flows.length === 0) return;

    // Use the first matching flow (lead_no_response is default)
    const flow = flows.find(f => f.trigger_condition === "lead_no_response") || flows[0];

    // Get messages for this flow
    const { data: messages } = await supabase
      .from("followup_messages")
      .select("id, delay_hours, order_position")
      .eq("flow_id", flow.id)
      .order("order_position", { ascending: true });

    if (!messages || messages.length === 0) return;

    // Create tasks with cumulative delays
    const now = new Date();
    let cumulativeHours = 0;

    for (const msg of messages) {
      cumulativeHours += msg.delay_hours;
      const dueAt = new Date(now.getTime() + cumulativeHours * 60 * 60 * 1000);

      await supabase.from("followup_tasks").insert({
        lead_id: leadId,
        flow_id: flow.id,
        message_id: msg.id,
        assigned_sdr: sdrId,
        due_at: dueAt.toISOString(),
        status: "pending",
      } as any);
    }
  } catch {
    // Silent fail
  }
}
