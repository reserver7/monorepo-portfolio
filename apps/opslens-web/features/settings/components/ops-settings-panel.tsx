"use client";

import type { OpsSetting } from "@repo/opslens";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("settings.ops");
  if (isError) {
    return (
      <Box className="border-default bg-surface-elevated rounded-[var(--radius-md)] border p-[var(--space-3)]">
        <Typography as="p" color="muted" className="text-body-sm">
          {t("loadFailed")}
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
                  <Typography as="span" className="text-body-sm truncate font-semibold">
                    {setting.key}
                  </Typography>
                  <Badge variant={SETTING_RISK_TONE[setting.riskLevel] ?? "secondary"} size="sm">
                    {setting.riskLevel}
                  </Badge>
                </Flex>
                <Flex className="flex-wrap gap-[var(--space-1)]">
                  <Badge variant="outline" size="sm">
                    {setting.category}
                  </Badge>
                  <Badge variant={setting.editable ? "success" : "secondary"} size="sm">
                    {setting.editable ? t("editable") : t("readOnly")}
                  </Badge>
                </Flex>
                {setting.description ? (
                  <Typography as="span" color="muted" className="text-caption line-clamp-2 leading-[1.5]">
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
                <Typography as="h3" className="text-body-lg truncate font-semibold">
                  {selectedSetting.key}
                </Typography>
                <Typography as="p" color="muted" className="text-body-sm mt-[var(--space-1)]">
                  {selectedSetting.description ?? t("noDescription")}
                </Typography>
              </Box>
              <Flex className="shrink-0 flex-wrap justify-end gap-[var(--space-1)]">
                <Badge variant="outline" size="sm">
                  {selectedSetting.category}
                </Badge>
                <Badge variant={SETTING_RISK_TONE[selectedSetting.riskLevel] ?? "secondary"} size="sm">
                  {selectedSetting.riskLevel}
                </Badge>
              </Flex>
            </Flex>

            <Grid className="gap-[var(--space-3)] md:grid-cols-2">
              <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                <Typography as="p" color="muted" className="text-caption">
                  {t("updatedBy")}
                </Typography>
                <Typography as="p" className="text-body-sm mt-[var(--space-1)] font-semibold">
                  {selectedSetting.updatedBy}
                </Typography>
              </Box>
              <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                <Typography as="p" color="muted" className="text-caption">
                  {t("changeReason")}
                </Typography>
                <Typography as="p" className="text-body-sm mt-[var(--space-1)] font-semibold">
                  {selectedSetting.changeReason ?? t("noRecord")}
                </Typography>
              </Box>
            </Grid>

            <Textarea
              label={t("valueJson")}
              value={valueDraft}
              rows={10}
              resize="vertical"
              disabled={!selectedSetting.editable}
              className="font-mono text-[12px] leading-[1.55]"
              onChange={(event) => onValueDraftChange(event.target.value)}
            />
            <Input
              label={t("reason")}
              value={reasonDraft}
              disabled={!selectedSetting.editable}
              placeholder={t("reasonPlaceholder")}
              onChange={(event) => onReasonDraftChange(event.target.value)}
            />
            <Flex className="justify-end gap-[var(--space-2)]">
              <Button variant="secondary" disabled={!selectedChanged} onClick={onResetDraft}>
                {t("revert")}
              </Button>
              <Button
                variant="primary"
                disabled={!selectedSetting.editable || !selectedChanged || reasonDraft.trim().length === 0}
                loading={savePending}
                onClick={onSave}
              >
                {t("save")}
              </Button>
            </Flex>
          </Grid>
        ) : (
          <Typography as="p" color="muted" className="text-body-sm">
            {t("empty")}
          </Typography>
        )}
      </Box>
    </Grid>
  );
}
