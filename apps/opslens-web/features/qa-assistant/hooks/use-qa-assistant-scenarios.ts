"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
import { resolveLocalizedError } from "@/lib/i18n/errors";
import type { QaFormValues } from "../types";

export function useQaAssistantScenarios() {
  const t = useTranslations("qa.confirm");
  const tError = useTranslations("error");
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
      toast.error(resolveLocalizedError(error, tError as never, t("deleteFailed")));
    }
  });

  const requestDeleteScenario = async (scenario: QaScenario) => {
    const ok = await confirm({
      title: t("deleteTitle"),
      description: t("deleteDescription", { name: scenario.featureName }),
      confirmText: t("delete"),
      cancelText: t("cancel"),
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
