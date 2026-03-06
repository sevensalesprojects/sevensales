import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";

export interface IntegrationStatus {
  type: string;
  status: string;
  label: string;
}

export function useIntegrationHealth() {
  const { currentProject } = useProject();
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = useCallback(async () => {
    if (!currentProject) { setStatuses([]); setLoading(false); return; }

    const { data: integrations } = await supabase
      .from("integrations")
      .select("type, status")
      .eq("project_id", currentProject.id);

    const { data: whatsappSessions } = await supabase
      .from("whatsapp_sessions")
      .select("status")
      .eq("project_id", currentProject.id);

    const results: IntegrationStatus[] = [];

    // WhatsApp
    const whatsappInt = integrations?.find(i => i.type === "whatsapp");
    const anySessionConnected = whatsappSessions?.some(s => s.status === "connected");
    results.push({
      type: "whatsapp",
      status: anySessionConnected ? "connected" : whatsappInt?.status || "disconnected",
      label: "WhatsApp",
    });

    // Instagram
    const instagramInt = integrations?.find(i => i.type === "instagram");
    results.push({
      type: "instagram",
      status: instagramInt?.status || "disconnected",
      label: "Instagram",
    });

    // Webhook (Hotmart etc)
    const webhookInt = integrations?.find(i => i.type === "hotmart" || i.type === "webhook");
    results.push({
      type: "webhook",
      status: webhookInt?.status || "disconnected",
      label: "Webhook",
    });

    setStatuses(results);
    setLoading(false);
  }, [currentProject?.id]);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  const disconnectedCount = statuses.filter(s => s.status === "disconnected").length;
  const hasAlert = disconnectedCount > 0;

  return { statuses, loading, hasAlert, disconnectedCount, refetch: fetchStatuses };
}
