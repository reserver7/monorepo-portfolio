"use client";

import {
  Badge,
  Box,
  Button,
  FormField,
  Grid,
  Select,
  Switch,
  TimePicker,
  Typography,
  type TimeRangeValue
} from "@repo/ui";
import { useTranslations } from "next-intl";
import type { OpsNotificationPolicy } from "@/lib/auth";
import { SETTINGS_IN_APP_NOTIFICATION_LEVEL_OPTIONS } from "../constants";

type NotificationPolicyPanelProps = {
  policy: OpsNotificationPolicy;
  dirty: boolean;
  savePending: boolean;
  onPolicyChange: (policy: OpsNotificationPolicy) => void;
  onSave: () => void;
};

const parseMinutes = (text?: string) => {
  if (!text) return null;
  const [hourRaw, minuteRaw] = text.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const getBlockedSameTime = (value: TimeRangeValue) => {
  const startMinute = parseMinutes(value.start);
  const endMinute = parseMinutes(value.end);
  if (startMinute == null || endMinute == null || startMinute !== endMinute) return {};
  const blockedHour = Math.floor(startMinute / 60);
  const blockedMinute = startMinute % 60;
  return {
    disabledHours: () => [blockedHour],
    disabledMinutes: (selectedHour: number) => (selectedHour === blockedHour ? [blockedMinute] : [])
  };
};

type ChannelRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function ChannelRow({ title, description, checked, onCheckedChange }: ChannelRowProps) {
  const t = useTranslations("settings.notification");
  return (
    <Box
      className={
        checked
          ? "border-default flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]"
          : "border-default bg-surface-elevated/70 flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]"
      }
    >
      <Box className="grid gap-[2px]">
        <Typography as="p" className="text-body-sm">
          {title}
        </Typography>
        <Typography as="p" color="muted" className="text-caption">
          {description}
        </Typography>
      </Box>
      <Box className="flex items-center gap-[var(--space-2)]">
        <Badge variant="outline" size="md" shape="pill">
          {checked ? t("enabled") : t("disabled")}
        </Badge>
        <Switch checked={checked} color={checked ? "primary" : "warning"} onCheckedChange={onCheckedChange} />
      </Box>
    </Box>
  );
}

export function NotificationPolicyPanel({
  policy,
  dirty,
  savePending,
  onPolicyChange,
  onSave
}: NotificationPolicyPanelProps) {
  const t = useTranslations("settings.notification");
  return (
    <Grid className="gap-[var(--space-3)]">
      <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Grid className="gap-[var(--space-3)]">
          <Typography as="p" className="text-body-sm font-semibold">
            {t("channels")}
          </Typography>
          <ChannelRow
            title={t("inApp")}
            description={t("inAppDescription")}
            checked={policy.inAppEnabled}
            onCheckedChange={(checked) => onPolicyChange({ ...policy, inAppEnabled: checked })}
          />
          <ChannelRow
            title={t("email")}
            description={t("emailDescription")}
            checked={policy.emailEnabled}
            onCheckedChange={(checked) => onPolicyChange({ ...policy, emailEnabled: checked })}
          />
          <ChannelRow
            title={t("slack")}
            description={t("slackDescription")}
            checked={policy.slackEnabled}
            onCheckedChange={(checked) => onPolicyChange({ ...policy, slackEnabled: checked })}
          />
        </Grid>
      </Box>

      <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Grid className="gap-[var(--space-3)]">
          <Typography as="p" className="text-body-sm font-semibold">
            {t("visibility")}
          </Typography>
          <FormField label={t("minLevel")} htmlFor="notification-min-level">
            <Select
              value={policy.minLevel}
              onChange={(next) =>
                onPolicyChange({
                  ...policy,
                  minLevel: next === "all" || next === "high" || next === "critical" ? next : "all"
                })
              }
              options={[...SETTINGS_IN_APP_NOTIFICATION_LEVEL_OPTIONS]}
            />
          </FormField>
        </Grid>
      </Box>

      <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Grid className="gap-[var(--space-3)]">
          <ChannelRow
            title={t("quietHours")}
            description={t("quietHoursDescription")}
            checked={policy.quietHoursEnabled}
            onCheckedChange={(checked) => onPolicyChange({ ...policy, quietHoursEnabled: checked })}
          />
          {policy.quietHoursEnabled ? (
            <FormField label={t("quietRange")} htmlFor="notification-quiet-range">
              <TimePicker.RangePicker
                minuteStep={5}
                value={{ start: policy.quietFrom, end: policy.quietTo }}
                startPlaceholder={t("startTime")}
                endPlaceholder={t("endTime")}
                disabledTime={getBlockedSameTime}
                onValueChange={(nextValue: TimeRangeValue) =>
                  onPolicyChange({
                    ...policy,
                    quietFrom: nextValue.start || "22:00",
                    quietTo: nextValue.end || "08:00"
                  })
                }
              />
            </FormField>
          ) : (
            <Typography as="p" color="muted" className="text-caption">
              {t("quietHoursDisabled")}
            </Typography>
          )}
        </Grid>
      </Box>
      <Box className="mt-[var(--space-2)] flex justify-end">
        <Button variant="primary" disabled={!dirty} loading={savePending} onClick={onSave}>
          {t("save")}
        </Button>
      </Box>
    </Grid>
  );
}
