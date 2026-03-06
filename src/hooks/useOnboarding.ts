import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";

export const ONBOARDING_STAGES = [
  { id: "etapa_inicial", name: "Etapa Inicial", color: "#6366f1" },
  { id: "agendado", name: "Agendado", color: "#f59e0b" },
  { id: "call_onboarding_shopify", name: "Call Onboarding + Shopify", color: "#3b82f6" },
  { id: "call_dominio_gateway", name: "Call Domínio + Gateway", color: "#8b5cf6" },
  { id: "concluido", name: "Concluído", color: "#22c55e" },
] as const;

export type OnboardingStage = typeof ONBOARDING_STAGES[number]["id"];

export interface OnboardingProcess {
  id: string;
  lead_id: string;
  project_id: string;
  sale_id: string | null;
  stage: string;
  assigned_user: string | null;
  purchase_date: string | null;
  scheduled_call_date: string | null;
  call_link: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // Joined data
  lead_name?: string;
  lead_phone?: string;
  lead_email?: string;
  lead_tags?: string[];
  assigned_user_name?: string;
}

export interface OnboardingHistory {
  id: string;
  onboarding_id: string;
  stage_from: string | null;
  stage_to: string;
  changed_by: string | null;
  created_at: string;
  changed_by_name?: string;
}

export interface ChecklistItem {
  id: string;
  onboarding_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  position: number;
}

const DEFAULT_CHECKLIST = [
  "Enviar mensagem obrigatória no grupo",
  "Confirmar presença",
  "Realizar call",
  "Configurar Shopify",
  "Configurar domínio",
  "Configurar gateway",
];

export function useOnboarding() {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const [items, setItems] = useState<OnboardingProcess[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOnboardings = useCallback(async () => {
    if (!currentProject) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("onboarding_process")
      .select("*, leads(name, phone, email)")
      .eq("project_id", currentProject.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching onboardings:", error);
      setItems([]);
      setLoading(false);
      return;
    }

    // Fetch assigned user names
    const userIds = [...new Set((data || []).map(d => d.assigned_user).filter(Boolean))] as string[];
    let profilesMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      if (profiles) profiles.forEach(p => { profilesMap[p.user_id] = p.full_name; });
    }

    // Fetch tags
    const leadIds = (data || []).map(d => d.lead_id);
    let tagsMap: Record<string, string[]> = {};
    if (leadIds.length > 0) {
      const { data: leadTags } = await supabase
        .from("lead_tags")
        .select("lead_id, tags(name)")
        .in("lead_id", leadIds);
      if (leadTags) {
        leadTags.forEach((lt: any) => {
          if (!tagsMap[lt.lead_id]) tagsMap[lt.lead_id] = [];
          if (lt.tags?.name) tagsMap[lt.lead_id].push(lt.tags.name);
        });
      }
    }

    const result: OnboardingProcess[] = (data || []).map((d: any) => ({
      ...d,
      lead_name: d.leads?.name || "Sem nome",
      lead_phone: d.leads?.phone || null,
      lead_email: d.leads?.email || null,
      lead_tags: tagsMap[d.lead_id] || [],
      assigned_user_name: d.assigned_user ? profilesMap[d.assigned_user] || "—" : null,
    }));

    setItems(result);
    setLoading(false);
  }, [currentProject?.id]);

  useEffect(() => { fetchOnboardings(); }, [fetchOnboardings]);

  const updateStage = async (onboardingId: string, newStage: string, oldStage: string) => {
    const { error } = await supabase
      .from("onboarding_process")
      .update({ stage: newStage })
      .eq("id", onboardingId);

    if (error) return false;

    // Record history
    await supabase.from("onboarding_history").insert({
      onboarding_id: onboardingId,
      stage_from: oldStage,
      stage_to: newStage,
      changed_by: user?.id || null,
    });

    setItems(prev => prev.map(i => i.id === onboardingId ? { ...i, stage: newStage } : i));
    return true;
  };

  const updateField = async (onboardingId: string, field: string, value: any) => {
    const { error } = await supabase
      .from("onboarding_process")
      .update({ [field]: value } as any)
      .eq("id", onboardingId);

    if (!error) {
      setItems(prev => prev.map(i => i.id === onboardingId ? { ...i, [field]: value } : i));
    }
    return !error;
  };

  const createOnboarding = async (leadId: string, saleId?: string, purchaseDate?: string) => {
    if (!currentProject) return null;

    const { data, error } = await supabase
      .from("onboarding_process")
      .insert({
        lead_id: leadId,
        project_id: currentProject.id,
        sale_id: saleId || null,
        stage: "etapa_inicial",
        purchase_date: purchaseDate || new Date().toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (error || !data) return null;

    // Create default checklist
    const checklistItems = DEFAULT_CHECKLIST.map((title, i) => ({
      onboarding_id: data.id,
      title,
      position: i,
    }));

    await supabase.from("onboarding_checklist").insert(checklistItems);

    // Record history
    await supabase.from("onboarding_history").insert({
      onboarding_id: data.id,
      stage_from: null,
      stage_to: "etapa_inicial",
      changed_by: user?.id || null,
    });

    await fetchOnboardings();
    return data;
  };

  // Checklist operations
  const fetchChecklist = async (onboardingId: string): Promise<ChecklistItem[]> => {
    const { data } = await supabase
      .from("onboarding_checklist")
      .select("*")
      .eq("onboarding_id", onboardingId)
      .order("position");
    return (data || []) as ChecklistItem[];
  };

  const toggleChecklistItem = async (itemId: string, completed: boolean) => {
    const { error } = await supabase
      .from("onboarding_checklist")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? user?.id || null : null,
      })
      .eq("id", itemId);
    return !error;
  };

  // History
  const fetchHistory = async (onboardingId: string): Promise<OnboardingHistory[]> => {
    const { data } = await supabase
      .from("onboarding_history")
      .select("*")
      .eq("onboarding_id", onboardingId)
      .order("created_at", { ascending: false });
    return (data || []) as OnboardingHistory[];
  };

  return {
    items, loading, refetch: fetchOnboardings,
    updateStage, updateField, createOnboarding,
    fetchChecklist, toggleChecklistItem, fetchHistory,
  };
}
