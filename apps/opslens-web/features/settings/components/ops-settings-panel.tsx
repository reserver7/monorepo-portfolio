"use client";

import type { OpsSetting } from "@repo/opslens";
import { Badge, Box, Button, Flex, Grid, Input, Textarea, Typography } from "@repo/ui";
import { SETTING_RISK_TONE } from "../utils/settings-utils";

type OpsSettingsPanelProps = {
  isError: boolean;
  settings: OpsSetting[];
  selectedSetting?: OpsSetting;
  valueDraft: string;
  reasonDraft: string;
  selectedChanged: boolean;
  savePending: boolean;
  onSelectSetting: (setting: OpsSetting) => void;
  onValueDraftChange: (value: string) => void;
  onReasonDraftChange: (value: string) => void;
  onResetDraft: () => void;
  onSave: () => void;
};

export function OpsSettingsPanel({
  isError,
  settings,
  selectedSetting,
  valueDraft,
  reasonDraft,
  selectedChanged,
  savePending,
  onSelectSetting,
  onValueDraftChange,
  onReasonDraftChange,
  onResetDraft,
  onSave
}: OpsSettingsPanelProps) {
  if (isError) {
    return (
      <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Typography as="p" color="muted" className="text-body-sm">
          운영 설정을 불러오지 못했습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid className="gap-[var(--space-4)] xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.35fr)]">
      <Grid className="content-start gap-[var(--space-2)]">
        {settings.map((setting) => {
          const selected = selectedSetting?.key === setting.key;
          return (
            <Button
              key={setting.id}
              variant={selected ? "primary" : "secondary"}
              className="h-auto justify-start rounded-[var(--radius-md)] p-[var(--space-3)] text-left"
              onClick={() => onSelectSetting(setting)}
            >
              <Box className="grid w-full gap-[var(--space-2)]">
                <Flex className="items-start justify-between gap-[var(--space-2)]">
                  <Typography as="span" className="truncate text-body-sm font-semibold">
                    {setting.key}
                  </Typography>
                  <Badge variant={SETTING_RISK_TONE[setting.riskLevel] ?? "secondary"} size="sm">
                    {setting.riskLevel}
                  </Badge>
                </Flex>
                <Flex className="flex-wrap gap-[var(--space-1)]">
                  <Badge variant="outline" size="sm">{setting.category}</Badge>
                  <Badge variant={setting.editable ? "success" : "secondary"} size="sm">
                    {setting.editable ? "편집 가능" : "읽기 전용"}
                  </Badge>
                </Flex>
                {setting.description ? (
                  <Typography as="span" color="muted" className="line-clamp-2 text-caption leading-[1.5]">
                    {setting.description}
                  </Typography>
                ) : null}
              </Box>
            </Button>
          );
        })}
      </Grid>

      <Box className="border-default bg-surface rounded-[var(--radius-lg)] border p-[var(--space-4)]">
        {selectedSetting ? (
          <Grid className="gap-[var(--space-4)]">
            <Flex className="items-start justify-between gap-[var(--space-3)]">
              <Box className="min-w-0">
                <Typography as="h3" className="truncate text-body-lg font-semibold">
                  {selectedSetting.key}
                </Typography>
                <Typography as="p" color="muted" className="mt-[var(--space-1)] text-body-sm">
                  {selectedSetting.description ?? "설명 없음"}
                </Typography>
              </Box>
              <Flex className="shrink-0 flex-wrap justify-end gap-[var(--space-1)]">
                <Badge variant="outline" size="sm">{selectedSetting.category}</Badge>
                <Badge variant={SETTING_RISK_TONE[selectedSetting.riskLevel] ?? "secondary"} size="sm">
                  {selectedSetting.riskLevel}
                </Badge>
              </Flex>
            </Flex>

            <Grid className="gap-[var(--space-3)] md:grid-cols-2">
              <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                <Typography as="p" color="muted" className="text-caption">마지막 수정자</Typography>
                <Typography as="p" className="mt-[var(--space-1)] text-body-sm font-semibold">
                  {selectedSetting.updatedBy}
                </Typography>
              </Box>
              <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                <Typography as="p" color="muted" className="text-caption">마지막 변경 사유</Typography>
                <Typography as="p" className="mt-[var(--space-1)] text-body-sm font-semibold">
                  {selectedSetting.changeReason ?? "기록 없음"}
                </Typography>
              </Box>
            </Grid>

            <Textarea
              label="설정 값(JSON)"
              value={valueDraft}
              rows={10}
              resize="vertical"
              disabled={!selectedSetting.editable}
              className="font-mono text-[12px] leading-[1.55]"
              onChange={(event) => onValueDraftChange(event.target.value)}
            />
            <Input
              label="변경 사유"
              value={reasonDraft}
              disabled={!selectedSetting.editable}
              placeholder="예: critical 알림의 슬랙 전파 기준 강화"
              onChange={(event) => onReasonDraftChange(event.target.value)}
            />
            <Flex className="justify-end gap-[var(--space-2)]">
              <Button variant="secondary" disabled={!selectedChanged} onClick={onResetDraft}>
                되돌리기
              </Button>
              <Button
                variant="primary"
                disabled={!selectedSetting.editable || !selectedChanged || reasonDraft.trim().length === 0}
                loading={savePending}
                onClick={onSave}
              >
                설정 저장
              </Button>
            </Flex>
          </Grid>
        ) : (
          <Typography as="p" color="muted" className="text-body-sm">
            등록된 운영 설정이 없습니다.
          </Typography>
        )}
      </Box>
    </Grid>
  );
}
