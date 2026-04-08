import { SEMANTIC_COLOR_TOKENS } from "../../styles";

export const chartColorTokens = {
  severity: {
    critical: SEMANTIC_COLOR_TOKENS.danger,
    high: SEMANTIC_COLOR_TOKENS.warning,
    medium: SEMANTIC_COLOR_TOKENS.info,
    low: SEMANTIC_COLOR_TOKENS.success
  },
  trend: SEMANTIC_COLOR_TOKENS.primary,
  bar: SEMANTIC_COLOR_TOKENS.primary,
  fallback: SEMANTIC_COLOR_TOKENS.subtle
} as const;
