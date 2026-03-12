import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";

export interface IntegrationStatus {
  type: string;
  status: string;
  label: string;
}

export interface IGTokenAlert {
  username: string | null;
  daysLeft: number;
}

export function useIntegrationHealth() {
  const { currentProject } = useProject();
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [igTokenExpiring, setIgTokenExpiring] = useState<IGTokenAlert[]>([]);

  const fetchStatuses = useCallback(async () => {
    if (!currentProject) { setStatuses([]); setLoading(false); return; }

    const [{ data: integrations }, { data: whatsappSessions }, { data: igAccounts }] = await Promise.all([
      supabase.from("integrations").select("type, status").eq("project_id", currentProject.id),
      supabase.from("whatsapp_sessions").select("status").eq("project_id", currentProject.id),
      supabase.from("instagram_accounts").select("username, token_expires_at, status").eq("project_id", currentProject.id),
    ]);

    const results: IntegrationStatus[] = [];

    // WhatsApp
    const whatsappInt = integrations?.find(i => i.type === "whatsapp");
    const anySessionConnected = whatsappSessions?.some(s => s.status === "connected");
    results.push({
      type: "whatsapp",
      status: anySessionConnected ? "connected" : whatsappInt?.status || "disconnected",
      label: "WhatsApp",
    });

    // Instagram — derive from instagram_accounts table
    const igActive = igAccounts?.filter(a => a.status === "active") || [];
    results.push({
      type: "instagram",
      status: igActive.length > 0 ? "connected" : "disconnected",
      label: "Instagram",
    });

    // Webhook (Hotmart etc)
    const webhookInt = integrations?.find(i => i.type === "hotmart" || i.type === "webhook");
    results.push({
      type: "webhook",
      status: webhookInt?.status || "disconnected",
      label: "Webhook",
    });

    // Check for expiring IG tokens (< 7 days)
    const expiring: IGTokenAlert[] = [];
    for (const acc of igAccounts || []) {
      if (!acc.token_expires_at) continue;
      const daysLeft = (new Date(acc.token_expires_at).getTime() - Date.now()) / 86400000;
      if (daysLeft < 7) {
        expiring.push({ username: acc.username, daysLeft: Math.max(0, Math.round(daysLeft)) });
      }
    }
    setIgTokenExpiring(expiring);

    setStatuses(results);
    setLoading(false);
  }, [currentProject?.id]);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  const disconnectedCount = statuses.filter(s => s.status === "disconnected").length;
  const hasAlert = disconnectedCount > 0 || igTokenExpiring.length > 0;

  return { statuses, loading, hasAlert, disconnectedCount, igTokenExpiring, igTokenExpiringSoon: igTokenExpiring.length > 0, refetch: fetchStatuses };
}
