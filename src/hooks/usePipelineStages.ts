import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StageBehavior = "initial" | "intermediate" | "won" | "lost";

export interface PipelineStage {
  id: string;
  key: string;
  label: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  behavior: StageBehavior;
  overdue_days: number | null;
}

export function usePipelineStages() {
  const query = useQuery({
    queryKey: ["pipeline_stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as PipelineStage[];
    },
    staleTime: 60_000,
  });

  const stages = query.data || [];
  const activeStages = stages.filter((s) => s.is_active);
  const stageMap = new Map(stages.map((s) => [s.key, s]));

  const getStage = (key: string | null | undefined) => (key ? stageMap.get(key) : undefined);
  const getStageLabel = (key: string | null | undefined) => getStage(key)?.label || key || "—";
  const getStageColor = (key: string | null | undefined) => getStage(key)?.color || "#2A070C";
  const keysByBehavior = (b: StageBehavior) => stages.filter((s) => s.behavior === b).map((s) => s.key);
  const getInitialStageKey = () => keysByBehavior("initial")[0] || activeStages[0]?.key || "novos";
  const getWonStageKey = () => keysByBehavior("won")[0];
  const getLostStageKey = () => keysByBehavior("lost")[0];

  return {
    ...query,
    stages,
    activeStages,
    getStage,
    getStageLabel,
    getStageColor,
    keysByBehavior,
    getInitialStageKey,
    getWonStageKey,
    getLostStageKey,
  };
}
