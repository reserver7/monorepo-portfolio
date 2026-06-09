import type { QaScenario } from "@repo/opslens";

export type QaAudience = "developer" | "pm" | "qa";

export type QaFormValues = {
  featureName: string;
  changedScreens: string;
  relatedApis: string;
  releaseNote: string;
  audience: QaAudience;
};

export type ReadinessItem = {
  label: string;
  ready: boolean;
};

export type QaScenarioItem = QaScenario;
