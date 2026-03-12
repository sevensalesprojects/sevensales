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
  stage_name?: string;
  stage_color?: string;
  funnel_name?: string;
  funnel_type?: string;
  // Extra fields
  country: string | null;
  group_number: string | null;
  group_link: string | null;
  sale_status: string | null;
  scheduling_date: string | null;
  consultation_done: boolean;
  reference_month: string | null;
  call_recording_link: string | null;
  observations: string | null;
  scheduling_summary: string | null;
  sdr_evaluation: string | null;
  qualification_score: string | null;
  sdr_observations: string | null;
  google_calendar_event_id: string | null;
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

const PAGE_SIZE = 50;

export function useLeads(funnelId?: string) {
  const { currentProject } = useProject();
  const [leads, setLeads] = useState<DBLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchLeads = useCallback(async (pageNum = 0, append = false) => {
    if (!currentProject) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      // Use leads_enriched view to get sdr_name, closer_name, stage info in one query
      let query = supabase
        .from("leads_enriched" as any)
        .select("*", { count: "exact" })
        .eq("project_id", currentProject.id)
        .order("created_at", { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (funnelId) {
        query = query.eq("funnel_id", funnelId);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) {
        console.error("Error fetching leads:", queryError);
        setError(queryError.message);
        if (!append) { setLeads([]); }
        setLoading(false);
        return;
      }

      const result: DBLead[] = (data || []).map((l: any) => ({
        ...l,
        consultation_done: l.consultation_done ?? false,
        tags: l.tags_json ? (Array.isArray(l.tags_json) ? l.tags_json : []) : [],
        sdr_name: l.sdr_name || undefined,
        closer_name: l.closer_name || undefined,
        stage_name: l.stage_name || undefined,
        stage_color: l.stage_color || undefined,
        funnel_name: l.funnel_name || undefined,
        funnel_type: l.funnel_type || undefined,
      }));

      if (append) {
        setLeads(prev => [...prev, ...result]);
      } else {
        setLeads(result);
      }

      const total = count || 0;
      setTotalCount(total);
      setHasMore((pageNum + 1) * PAGE_SIZE < total);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError(String(err));
      setLoading(false);
    }
  }, [currentProject?.id, funnelId]);

  // Reset pagination when funnel changes
  useEffect(() => {
    setPage(0);
    setLeads([]);
    setLoading(true);
    fetchLeads(0, false);
  }, [fetchLeads]);

  // Realtime: UPDATE, INSERT, DELETE on leads
  useEffect(() => {
    if (!currentProject) return;

    const channel = supabase
      .channel(`leads-realtime-${currentProject.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leads",
          filter: `project_id=eq.${currentProject.id}`,
        },
        (payload) => {
          setLeads(prev =>
            prev.map(l =>
              l.id === payload.new.id ? { ...l, ...payload.new } : l
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `project_id=eq.${currentProject.id}`,
        },
        () => {
          fetchLeads(0, false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "leads",
          filter: `project_id=eq.${currentProject.id}`,
        },
        (payload) => {
          setLeads(prev => prev.filter(l => l.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProject?.id]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLeads(nextPage, true);
  }, [hasMore, loading, page, fetchLeads]);

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

  const updateLeadField = async (leadId: string, field: string, value: any) => {
    const { error } = await supabase
      .from("leads")
      .update({ [field]: value } as any)
      .eq("id", leadId);

    if (!error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, [field]: value } : l))
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
      await fetchLeads(0, false);
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

  return {
    leads,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    refetch: () => { setPage(0); fetchLeads(0, false); },
    updateLeadStage,
    updateLeadField,
    createLead,
    deleteLead,
  };
}
