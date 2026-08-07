import { Injectable, Logger } from "@nestjs/common";
import { env } from "../../config/env.js";
import { PrismaService } from "../../integration/db/prisma.service.js";

@Injectable()
export class OpsSlackNotifier {
  private readonly logger = new Logger(OpsSlackNotifier.name);

  constructor(private readonly prisma: PrismaService) {}

  async notify(input: { level: string; title: string; message: string; source: string; link?: string | null }): Promise<void> {
    if (!env.OPS_SLACK_WEBHOOK_URL) throw new Error("OPS_SLACK_WEBHOOK_URL이 설정되지 않았습니다.");
    const onCall = await this.prisma.opsSetting.findUnique({ where: { key: "oncall.primary" }, select: { value: true } });
    const owner = onCall?.value && typeof onCall.value === "object" && !Array.isArray(onCall.value)
      ? String((onCall.value as { primary?: unknown }).primary ?? "운영 담당자")
      : "운영 담당자";
    const response = await fetch(env.OPS_SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[OpsLens ${input.level.toUpperCase()}] ${input.title}\n${input.message}\nsource: ${input.source}\non-call: ${owner}${input.link ? `\n${input.link}` : ""}`
      })
    });
    if (!response.ok) throw new Error(`Slack webhook 응답 ${response.status}`);
  }
}
