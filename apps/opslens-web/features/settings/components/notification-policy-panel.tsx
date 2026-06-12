"use client";

import { Badge, Box, Button, FormField, Grid, Select, Switch, TimePicker, Typography, type TimeRangeValue } from "@repo/ui";
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
  return (
    <Box className={checked ? "border-default flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]" : "border-default bg-surface-elevated/70 flex items-center justify-between rounded-[var(--radius-sm)] border p-[var(--space-2)]"}>
      <Box className="grid gap-[2px]">
        <Typography as="p" className="text-body-sm">{title}</Typography>
        <Typography as="p" color="muted" className="text-caption">{description}</Typography>
      </Box>
      <Box className="flex items-center gap-[var(--space-2)]">
        <Badge variant="outline" size="md" shape="pill">
          {checked ? "Enabled" : "Disabled"}
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
  return (
    <Grid className="gap-[var(--space-3)]">
      <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Grid className="gap-[var(--space-3)]">
          <Typography as="p" className="text-body-sm font-semibold">채널</Typography>
          <ChannelRow
            title="인앱 알림"
            description="대시보드/화면 내 알림을 표시합니다."
            checked={policy.inAppEnabled}
            onCheckedChange={(checked) => onPolicyChange({ ...policy, inAppEnabled: checked })}
          />
          <ChannelRow
            title="이메일 알림"
            description="중요 이벤트를 이메일로 발송합니다."
            checked={policy.emailEnabled}
            onCheckedChange={(checked) => onPolicyChange({ ...policy, emailEnabled: checked })}
          />
          <ChannelRow
            title="슬랙 알림"
            description="운영 채널로 즉시 전파합니다."
            checked={policy.slackEnabled}
            onCheckedChange={(checked) => onPolicyChange({ ...policy, slackEnabled: checked })}
          />
        </Grid>
      </Box>

      <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Grid className="gap-[var(--space-3)]">
          <Typography as="p" className="text-body-sm font-semibold">노출 기준</Typography>
          <FormField label="최소 알림 레벨" htmlFor="notification-min-level">
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
            title="방해금지 시간"
            description="지정한 시간에는 알림을 억제합니다."
            checked={policy.quietHoursEnabled}
            onCheckedChange={(checked) => onPolicyChange({ ...policy, quietHoursEnabled: checked })}
          />
          {policy.quietHoursEnabled ? (
            <FormField label="조용한 시간대" htmlFor="notification-quiet-range">
              <TimePicker.RangePicker
                minuteStep={5}
                value={{ start: policy.quietFrom, end: policy.quietTo }}
                startPlaceholder="시작 시간"
                endPlaceholder="종료 시간"
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
              방해금지 시간이 비활성화되어 있습니다.
            </Typography>
          )}
        </Grid>
      </Box>
      <Box className="mt-[var(--space-2)] flex justify-end">
        <Button variant="primary" disabled={!dirty} loading={savePending} onClick={onSave}>
          알림 정책 저장
        </Button>
      </Box>
    </Grid>
  );
}
