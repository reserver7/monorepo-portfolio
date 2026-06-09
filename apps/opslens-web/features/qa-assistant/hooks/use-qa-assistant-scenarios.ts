"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { confirm, toast } from "@repo/ui";
import {
  deleteQaScenario,
  generateQaScenario,
  getRecentQaScenarios,
  opslensQueryKeys,
  type QaScenario
} from "@repo/opslens";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import type { QaFormValues } from "../types";

export function useQaAssistantScenarios() {
  const queryClient = useQueryClient();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const scenariosQuery = useQuery(
    useOpsQueryOptions("list", {
      queryKey: opslensQueryKeys.qaScenarios(),
      queryFn: getRecentQaScenarios
    })
  );

  const scenarios = scenariosQuery.data ?? [];
  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0] ?? null,
    [scenarios, selectedScenarioId]
  );

  const generateMutation = useMutation({
    mutationFn: (values: QaFormValues) =>
      generateQaScenario({
        featureName: values.featureName.trim(),
        changedScreens: values.changedScreens.trim(),
        relatedApis: values.relatedApis.trim(),
        releaseNote: values.releaseNote.trim(),
        audience: values.audience
      }),
    onSuccess: async (scenario) => {
      setSelectedScenarioId(scenario.id);
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.qaScenarios() });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQaScenario,
    onSuccess: async (_, scenarioId) => {
      if (selectedScenarioId === scenarioId) {
        setSelectedScenarioId(null);
      }
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.qaScenarios() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "QA 산출물 삭제에 실패했습니다.");
    }
  });

  const requestDeleteScenario = async (scenario: QaScenario) => {
    const ok = await confirm({
      title: "QA 산출물을 삭제할까요?",
      description: `"${scenario.featureName}" 산출물이 최근 목록에서 삭제됩니다.`,
      confirmText: "삭제",
      cancelText: "취소",
      confirmVariant: "danger"
    });
    if (!ok) return;
    deleteMutation.mutate(scenario.id);
  };

  return {
    deleteMutation,
    generateMutation,
    requestDeleteScenario,
    scenarios,
    scenariosQuery,
    selectedScenario,
    selectedScenarioId,
    setSelectedScenarioId
  };
}
