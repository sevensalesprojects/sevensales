import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";

export interface FollowupMessage {
  id: string;
  flow_id: string;
  message_text: string;
  delay_hours: number;
  order_position: number;
}

export interface FollowupFlow {
  id: string;
  name: string;
  trigger_condition: string;
  is_active: boolean;
  project_id: string;
  created_at: string;
  messages: FollowupMessage[];
}

export interface FollowupTask {
  id: string;
  lead_id: string;
  flow_id: string;
  message_id: string;
  assigned_sdr: string;
  due_at: string;
  status: string;
  created_at: string;
  message_text?: string;
}

export function useFollowupFlows() {
  const { currentProject } = useProject();
  const [flows, setFlows] = useState<FollowupFlow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlows = useCallback(async () => {
    if (!currentProject) { setFlows([]); setLoading(false); return; }
    setLoading(true);

    const { data: flowsData } = await supabase
      .from("followup_flows")
      .select("*")
      .eq("project_id", currentProject.id)
      .order("created_at", { ascending: false }) as any;

    if (!flowsData || flowsData.length === 0) {
      setFlows([]);
      setLoading(false);
      return;
    }

    const flowIds = flowsData.map((f: any) => f.id);
    const { data: messagesData } = await supabase
      .from("followup_messages")
      .select("*")
      .in("flow_id", flowIds)
      .order("order_position", { ascending: true }) as any;

    const result = flowsData.map((flow: any) => ({
      ...flow,
      messages: (messagesData || []).filter((m: any) => m.flow_id === flow.id),
    }));

    setFlows(result);
    setLoading(false);
  }, [currentProject?.id]);

  useEffect(() => { fetchFlows(); }, [fetchFlows]);

  const createFlow = async (name: string, triggerCondition: string) => {
    if (!currentProject) return null;
    const { data, error } = await supabase
      .from("followup_flows")
      .insert({ name, trigger_condition: triggerCondition, project_id: currentProject.id } as any)
      .select()
      .single();
    if (!error) { await fetchFlows(); return data; }
    return null;
  };

  const deleteFlow = async (id: string) => {
    await supabase.from("followup_flows").delete().eq("id", id);
    await fetchFlows();
  };

  const toggleFlow = async (id: string, isActive: boolean) => {
    await supabase.from("followup_flows").update({ is_active: !isActive } as any).eq("id", id);
    setFlows(prev => prev.map(f => f.id === id ? { ...f, is_active: !isActive } : f));
  };

  const addMessage = async (flowId: string, messageText: string, delayHours: number, orderPosition: number) => {
    const { error } = await supabase
      .from("followup_messages")
      .insert({ flow_id: flowId, message_text: messageText, delay_hours: delayHours, order_position: orderPosition } as any);
    if (!error) await fetchFlows();
    return !error;
  };

  const deleteMessage = async (id: string) => {
    await supabase.from("followup_messages").delete().eq("id", id);
    await fetchFlows();
  };

  return { flows, loading, createFlow, deleteFlow, toggleFlow, addMessage, deleteMessage, refetch: fetchFlows };
}

export function useFollowupTasks(leadId?: string) {
  const [tasks, setTasks] = useState<FollowupTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!leadId) { setTasks([]); setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from("followup_tasks")
      .select("*")
      .eq("lead_id", leadId)
      .order("due_at", { ascending: true }) as any;

    if (data) {
      // Get message texts
      const messageIds = data.map((t: any) => t.message_id);
      const { data: msgs } = await supabase
        .from("followup_messages")
        .select("id, message_text")
        .in("id", messageIds) as any;

      const msgMap: Record<string, string> = {};
      (msgs || []).forEach((m: any) => { msgMap[m.id] = m.message_text; });

      setTasks(data.map((t: any) => ({ ...t, message_text: msgMap[t.message_id] || "" })));
    }
    setLoading(false);
  }, [leadId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const completeTask = async (taskId: string) => {
    await supabase.from("followup_tasks").update({ status: "completed" } as any).eq("id", taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "completed" } : t));
  };

  const skipTask = async (taskId: string) => {
    await supabase.from("followup_tasks").update({ status: "skipped" } as any).eq("id", taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "skipped" } : t));
  };

  return { tasks, loading, completeTask, skipTask, refetch: fetchTasks };
}
