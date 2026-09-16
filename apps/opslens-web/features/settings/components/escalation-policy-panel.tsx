"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Box, Button, Grid, Input, Select, Typography } from "@repo/ui";
import type { OpsSetting } from "@repo/opslens";

export type EscalationPolicy = {
  acknowledgeWithinMinutes: number;
  statusUpdateWithinMinutes: number;
  maxLevel: number;
  escalationTargets: string;
};

const defaultPolicy: EscalationPolicy = {
  acknowledgeWithinMinutes: 10,
  statusUpdateWithinMinutes: 30,
  maxLevel: 3,
  escalationTargets: "Primary on-call → Backup on-call → Incident commander"
};

export const parseEscalationPolicy = (value?: string): EscalationPolicy => {
  try {
    const parsed = JSON.parse(value ?? "{}") as Partial<EscalationPolicy>;
    return {
      acknowledgeWithinMinutes:
        Number.isFinite(parsed.acknowledgeWithinMinutes) && Number(parsed.acknowledgeWithinMinutes) > 0
          ? Number(parsed.acknowledgeWithinMinutes)
          : defaultPolicy.acknowledgeWithinMinutes,
      statusUpdateWithinMinutes:
        Number.isFinite(parsed.statusUpdateWithinMinutes) && Number(parsed.statusUpdateWithinMinutes) > 0
          ? Number(parsed.statusUpdateWithinMinutes)
          : defaultPolicy.statusUpdateWithinMinutes,
      maxLevel: Number.isFinite(parsed.maxLevel)
        ? Math.min(5, Math.max(1, Number(parsed.maxLevel)))
        : defaultPolicy.maxLevel,
      escalationTargets: parsed.escalationTargets?.trim() || defaultPolicy.escalationTargets
    };
  } catch {
    return defaultPolicy;
  }
};

export function EscalationPolicyPanel({
  setting,
  isAdmin,
  saving,
  onSave
}: {
  setting?: OpsSetting;
  isAdmin: boolean;
  saving: boolean;
  onSave: (value: string) => void;
}) {
  const t = useTranslations("settings.escalation");
  const [policy, setPolicy] = useState<EscalationPolicy>(() => parseEscalationPolicy(setting?.value));

  useEffect(() => setPolicy(parseEscalationPolicy(setting?.value)), [setting?.value]);

  const serialized = useMemo(() => JSON.stringify(policy), [policy]);
  const unchanged = serialized === JSON.stringify(parseEscalationPolicy(setting?.value));
  const valid =
    policy.acknowledgeWithinMinutes > 0 &&
    policy.statusUpdateWithinMinutes > 0 &&
    policy.escalationTargets.trim().length > 0;

  return (
    <Box className="space-y-[var(--space-3)]">
      <Typography as="p" variant="caption" color="muted">
        {t("description")}
      </Typography>
      <Grid className="gap-[var(--space-3)] md:grid-cols-3">
        <Input
          label={t("acknowledge")}
          type="number"
          min={1}
          value={String(policy.acknowledgeWithinMinutes)}
          onChange={(event) =>
            setPolicy((previous) => ({ ...previous, acknowledgeWithinMinutes: Number(event.target.value) }))
          }
          disabled={!isAdmin}
        />
        <Input
          label={t("statusUpdate")}
          type="number"
          min={1}
          value={String(policy.statusUpdateWithinMinutes)}
          onChange={(event) =>
            setPolicy((previous) => ({ ...previous, statusUpdateWithinMinutes: Number(event.target.value) }))
          }
          disabled={!isAdmin}
        />
        <Select
          label={t("maxLevel")}
          value={String(policy.maxLevel)}
          onChange={(value) => setPolicy((previous) => ({ ...previous, maxLevel: Number(value) }))}
          disabled={!isAdmin}
          options={[1, 2, 3, 4, 5].map((value) => ({ label: `L${value}`, value: String(value) }))}
        />
      </Grid>
      <Input
        label={t("targets")}
        value={policy.escalationTargets}
        onChange={(event) =>
          setPolicy((previous) => ({ ...previous, escalationTargets: event.target.value }))
        }
        disabled={!isAdmin}
        placeholder={t("targetsPlaceholder")}
      />
      <Box className="flex flex-wrap items-center gap-[var(--space-2)]">
        <Badge size="sm" variant={valid ? "success" : "warning"}>
          {valid
            ? t("valid", {
                acknowledge: policy.acknowledgeWithinMinutes,
                update: policy.statusUpdateWithinMinutes
              })
            : t("invalid")}
        </Badge>
        {isAdmin ? (
          <Button
            type="button"
            size="sm"
            loading={saving}
            disabled={!valid || unchanged}
            onClick={() => onSave(serialized)}
          >
            {t("save")}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
