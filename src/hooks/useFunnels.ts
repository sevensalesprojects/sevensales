import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";

export interface FunnelStage {
  id: string;
  name: string;
  color: string;
  position: number;
  funnel_id: string;
}

export interface Funnel {
  id: string;
  name: string;
  type: string;
  project_id: string;
  created_at: string;
  stages: FunnelStage[];
}

export function useFunnels() {
  const { currentProject } = useProject();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFunnels = async () => {
    if (!currentProject) {
      setFunnels([]);
      setLoading(false);
      return;
    }

    const { data: funnelsData } = await supabase
      .from("funnels")
      .select("*")
      .eq("project_id", currentProject.id)
      .order("created_at");

    if (!funnelsData || funnelsData.length === 0) {
      setFunnels([]);
      setLoading(false);
      return;
    }

    const funnelIds = funnelsData.map((f) => f.id);
    const { data: stagesData } = await supabase
      .from("funnel_stages")
      .select("*")
      .in("funnel_id", funnelIds)
      .order("position");

    const result: Funnel[] = funnelsData.map((f) => ({
      ...f,
      stages: (stagesData || []).filter((s) => s.funnel_id === f.id),
    }));

    setFunnels(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchFunnels();
  }, [currentProject?.id]);

  return { funnels, loading, refetch: fetchFunnels };
}
