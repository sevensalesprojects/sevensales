import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Periodically checks for overdue follow-up tasks and creates notifications
 * for the assigned SDRs. Runs every 60 seconds.
 */
export function useFollowupNotifications() {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentProject || !user) return;

    const checkOverdueTasks = async () => {
      try {
        // Find pending follow-up tasks that are overdue
        const { data: overdueTasks } = await supabase
          .from("followup_tasks")
          .select("id, lead_id, assigned_sdr, flow_id, message_id, due_at")
          .eq("status", "pending")
          .lte("due_at", new Date().toISOString()) as any;

        if (!overdueTasks || overdueTasks.length === 0) return;

        for (const task of overdueTasks) {
          // Skip if already processed in this session
          if (processedRef.current.has(task.id)) continue;

          // Get the message text for the notification
          const { data: message } = await supabase
            .from("followup_messages")
            .select("message_text")
            .eq("id", task.message_id)
            .single();

          // Get lead name
          const { data: lead } = await supabase
            .from("leads")
            .select("name, project_id")
            .eq("id", task.lead_id)
            .single();

          if (!lead) continue;

          // Check if notification already exists for this task
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("entity_id", task.id)
            .eq("type", "followup_due")
            .limit(1);

          if (existing && existing.length > 0) {
            processedRef.current.add(task.id);
            continue;
          }

          // Create notification for the assigned SDR
          await supabase.from("notifications").insert({
            user_id: task.assigned_sdr,
            project_id: lead.project_id,
            type: "followup_due",
            title: "Follow-up pendente",
            description: message?.message_text
              ? `${lead.name}: ${message.message_text.substring(0, 100)}`
              : `Follow-up pendente para ${lead.name}`,
            entity_type: "lead",
            entity_id: task.id,
          });

          processedRef.current.add(task.id);
        }
      } catch (err) {
        // Silent fail
        console.error("Follow-up notification check error:", err);
      }
    };

    // Run immediately and then every 60 seconds
    checkOverdueTasks();
    const interval = setInterval(checkOverdueTasks, 60000);

    return () => clearInterval(interval);
  }, [currentProject?.id, user?.id]);
}
