import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";

export interface DBLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  source: string | null;
  channel: string | null;
  stage_id: string | null;
  funnel_id: string | null;
  sdr_id: string | null;
  closer_id: string | null;
  value_estimate: number | null;
  response_time_minutes: number | null;
  project_id: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  sdr_name?: string;
  closer_name?: string;
}

export interface CreateLeadData {
  name: string;
  email?: string;
  phone?: string;
  instagram?: string;
  source?: string;
  channel?: string;
  stage_id?: string;
  funnel_id?: string;
  value_estimate?: number;
}

export function useLeads(funnelId?: string) {
  const { currentProject } = useProject();
  const [leads, setLeads] = useState<DBLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!currentProject) {
      setLeads([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("leads")
      .select("*")
      .eq("project_id", currentProject.id)
      .order("created_at", { ascending: false });

    if (funnelId) {
      query = query.eq("funnel_id", funnelId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching leads:", error);
      setLeads([]);
      setLoading(false);
      return;
    }

    const leadIds = (data || []).map((l) => l.id);
    let tagsMap: Record<string, string[]> = {};

    if (leadIds.length > 0) {
      const { data: leadTags } = await supabase
        .from("lead_tags")
        .select("lead_id, tag_id, tags(name)")
        .in("lead_id", leadIds);

      if (leadTags) {
        leadTags.forEach((lt: any) => {
          if (!tagsMap[lt.lead_id]) tagsMap[lt.lead_id] = [];
          if (lt.tags?.name) tagsMap[lt.lead_id].push(lt.tags.name);
        });
      }
    }

    const result: DBLead[] = (data || []).map((l) => ({
      ...l,
      tags: tagsMap[l.id] || [],
    }));

    setLeads(result);
    setLoading(false);
  }, [currentProject?.id, funnelId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLeadStage = async (leadId: string, stageId: string) => {
    const { error } = await supabase
      .from("leads")
      .update({ stage_id: stageId })
      .eq("id", leadId);

    if (!error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage_id: stageId } : l))
      );
    }
    return !error;
  };

  const createLead = async (data: CreateLeadData) => {
    if (!currentProject) return null;

    const { data: newLead, error } = await supabase
      .from("leads")
      .insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        instagram: data.instagram || null,
        source: data.source || null,
        channel: data.channel || null,
        stage_id: data.stage_id || null,
        funnel_id: data.funnel_id || null,
        value_estimate: data.value_estimate || null,
        project_id: currentProject.id,
      })
      .select()
      .single();

    if (!error && newLead) {
      await fetchLeads();
      return newLead;
    }
    return null;
  };

  const deleteLead = async (leadId: string) => {
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadId);

    if (!error) {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    }
    return !error;
  };

  return { leads, loading, refetch: fetchLeads, updateLeadStage, createLead, deleteLead };
}
