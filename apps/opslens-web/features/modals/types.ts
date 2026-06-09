export type OpsFilterFormValues = {
  environment: "dev" | "stage" | "prod";
  locale: "ko" | "en" | "ja";
  serviceName: string;
  fromDate: string;
  toDate: string;
  search: string;
};
