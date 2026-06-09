import type { QaFormValues, ReadinessItem } from "../types";

export const splitQaInputLines = (value: string): string[] =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

export const getQaReadinessItems = (
  values: QaFormValues,
  changedScreenItems: string[],
  relatedApiItems: string[]
): ReadinessItem[] => [
  {
    label: "기능 범위",
    ready: values.featureName.trim().length >= 8
  },
  {
    label: "화면 범위",
    ready: changedScreenItems.length > 0
  },
  {
    label: "API 범위",
    ready: relatedApiItems.length > 0
  },
  {
    label: "변경 맥락",
    ready: values.releaseNote.trim().length >= 20
  }
];

export const getQaReadinessScore = (items: ReadinessItem[]): number =>
  clampPercent(Math.round((items.filter((item) => item.ready).length / items.length) * 100));

export const getQaScenarioItemCount = (scenario: {
  generatedCases: string[];
  riskPoints: string[];
  regressionTargets: string[];
}): number => scenario.generatedCases.length + scenario.riskPoints.length + scenario.regressionTargets.length;
