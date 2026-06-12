import { Injectable, Logger, NotFoundException } from "@nestjs/common";

import { env } from "../../config/env.js";
import { PrismaService } from "../../integration/db/prisma.service.js";
import { AiService } from "../ai/ai.service.js";
import type { QaAssistantInputModel } from "./ops.inputs.js";
import { writeOpsAuditLog } from "./ops-audit-writer.js";
import { toQaScenarioType } from "./ops.mappers.js";
import type { QaScenarioType } from "./ops.types.js";

@Injectable()
export class OpsQaService {
  private readonly logger = new Logger(OpsQaService.name);
  private readonly qaScenarioListCache = new Map<string, { value: QaScenarioType[]; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  clearCache(): void {
    this.qaScenarioListCache.clear();
  }

  private readQaScenarioListCache(): QaScenarioType[] | null {
    const key = "recent";
    const hit = this.qaScenarioListCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      this.qaScenarioListCache.delete(key);
      return null;
    }
    return hit.value;
  }

  private writeQaScenarioListCache(value: QaScenarioType[]): void {
    this.qaScenarioListCache.set("recent", { value, expiresAt: Date.now() + env.OPS_CACHE_QA_SCENARIO_TTL_MS });
  }

  async generateQaScenario(input: QaAssistantInputModel): Promise<QaScenarioType> {
    const fallback = {
      generatedCases: [
        `${input.featureName} 정상 시나리오`,
        `${input.featureName} 경계값 시나리오`,
        `${input.featureName} 오류 응답/지연 시나리오`,
        `${input.featureName} 모바일 반응형 시나리오`
      ],
      riskPoints: [
        "API 응답 필드 누락 시 UI 깨짐 여부",
        "권한/세션 만료 상황에서의 동작",
        "배포 후 기존 기능 회귀 가능성"
      ],
      regressionTargets: [
        "관련 화면의 기존 주요 플로우",
        "연관 API 에러 핸들링",
        "공통 컴포넌트 스타일/상태 동기화"
      ]
    };

    const generated = await this.aiService.generateJson<typeof fallback>(
      [
        "당신은 QA 시나리오 생성 도우미입니다.",
        "아래 입력을 바탕으로 JSON만 출력하세요.",
        '{"generatedCases": string[], "riskPoints": string[], "regressionTargets": string[]}',
        `기능: ${input.featureName}`,
        `변경 화면: ${input.changedScreens}`,
        `관련 API: ${input.relatedApis}`,
        `배포 노트: ${input.releaseNote}`,
        `대상 독자: ${input.audience}`
      ].join("\n"),
      fallback
    );

    const created = await this.prisma.qaScenario.create({
      data: {
        featureName: input.featureName,
        changedScreens: input.changedScreens,
        relatedApis: input.relatedApis,
        releaseNote: input.releaseNote,
        generatedCases: generated.generatedCases,
        riskPoints: generated.riskPoints,
        regressionTargets: generated.regressionTargets,
        audience: input.audience,
        status: "draft",
        owner: input.owner?.trim() || "QA 담당자",
        reviewer: input.reviewer?.trim() || null,
        executionStatus: "not_started"
      }
    });

    this.clearCache();
    return toQaScenarioType(created);
  }

  async recentQaScenarios(): Promise<QaScenarioType[]> {
    const cached = this.readQaScenarioListCache();
    if (cached) return cached;

    const scenarios = await this.prisma.qaScenario.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const mapped = scenarios.map((scenario) => toQaScenarioType(scenario));
    this.writeQaScenarioListCache(mapped);
    return mapped;
  }

  async deleteQaScenario(scenarioId: string): Promise<boolean> {
    const existing = await this.prisma.qaScenario.findUnique({
      where: { id: scenarioId },
      select: { id: true }
    });

    if (!existing) {
      throw new NotFoundException("QA 시나리오를 찾을 수 없습니다.");
    }

    await this.prisma.qaScenario.delete({
      where: { id: scenarioId }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      action: "qa_scenario.deleted",
      targetType: "QaScenario",
      targetId: scenarioId,
      summary: "QA 산출물 삭제"
    });

    this.clearCache();
    return true;
  }
}
