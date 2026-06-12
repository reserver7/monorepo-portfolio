import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { env } from "../../config/env.js";
import { PrismaService } from "../../integration/db/prisma.service.js";
import type {
  AddIssueCommentInput,
  AssignIssueInput,
  IssueFilterInput,
  UpdateIssueStatusInput
} from "./ops.inputs.js";
import { writeOpsAuditLog } from "./ops-audit-writer.js";
import { buildIssueWhere, toStatus } from "./ops.filters.js";
import { toIssueType } from "./ops.mappers.js";
import type { IssueListPayloadType, IssueSummaryType, IssueType } from "./ops.types.js";

@Injectable()
export class OpsIssueService {
  private readonly issueListCache = new Map<string, { value: IssueListPayloadType; expiresAt: number }>();
  private readonly logger = new Logger(OpsIssueService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getIssueListCacheKey(filter?: IssueFilterInput): string {
    return JSON.stringify({
      environment: filter?.environment ?? "all",
      serviceName: filter?.serviceName ?? "all",
      query: filter?.query ?? "",
      severity: filter?.severity ?? "all",
      status: filter?.status ?? "all",
      page: filter?.page ?? 1,
      pageSize: filter?.pageSize ?? 20
    });
  }

  private readIssueListCache(key: string): IssueListPayloadType | null {
    const hit = this.issueListCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      this.issueListCache.delete(key);
      return null;
    }
    return hit.value;
  }

  private writeIssueListCache(key: string, value: IssueListPayloadType): void {
    this.issueListCache.set(key, { value, expiresAt: Date.now() + env.OPS_CACHE_ISSUE_LIST_TTL_MS });
    if (this.issueListCache.size > env.OPS_CACHE_ISSUE_LIST_MAX) {
      const oldest = this.issueListCache.keys().next().value as string | undefined;
      if (oldest) this.issueListCache.delete(oldest);
    }
  }

  clearCache(): void {
    this.issueListCache.clear();
  }

  async listIssues(filter?: IssueFilterInput): Promise<IssueListPayloadType> {
    const pageSizeForCache = Math.min(Math.max(filter?.pageSize ?? 20, 1), 100);
    const shouldUseCache = pageSizeForCache <= 10;
    const cacheKey = shouldUseCache ? this.getIssueListCacheKey(filter) : null;
    if (cacheKey) {
      const cached = this.readIssueListCache(cacheKey);
      if (cached) return cached;
    }

    const where = buildIssueWhere(filter);
    const page = Math.max(filter?.page ?? 1, 1);
    const pageSize = pageSizeForCache;

    const [totalCount, items] = await this.prisma.$transaction([
      this.prisma.issue.count({ where }),
      this.prisma.issue.findMany({
        where,
        include: { deployment: true },
        orderBy: [{ occurrenceCount: "desc" }, { lastOccurredAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    const payload: IssueListPayloadType = {
      items: items.map((issue) => toIssueType({ ...issue, logs: [], comments: [] })),
      totalCount,
      page,
      pageSize
    };
    if (cacheKey) this.writeIssueListCache(cacheKey, payload);
    return payload;
  }

  async getIssueSummary(filter?: IssueFilterInput): Promise<IssueSummaryType> {
    const where = buildIssueWhere(filter);
    const openWhere: Prisma.IssueWhereInput = {
      AND: [where, { status: { not: "resolved" } }]
    };
    const now = Date.now();
    const criticalSlaCutoff = new Date(now - 30 * 60 * 1000);
    const highSlaCutoff = new Date(now - 60 * 60 * 1000);

    const [open, criticalHigh, unassigned, slaRisk] = await this.prisma.$transaction([
      this.prisma.issue.count({ where: openWhere }),
      this.prisma.issue.count({ where: { AND: [openWhere, { severity: { in: ["critical", "high"] } }] } }),
      this.prisma.issue.count({ where: { AND: [openWhere, { OR: [{ assignee: null }, { assignee: "" }] }] } }),
      this.prisma.issue.count({
        where: {
          AND: [
            openWhere,
            {
              OR: [
                { severity: "critical", lastOccurredAt: { lte: criticalSlaCutoff } },
                { severity: "high", lastOccurredAt: { lte: highSlaCutoff } }
              ]
            }
          ]
        }
      })
    ]);

    return { open, criticalHigh, unassigned, slaRisk };
  }

  async getIssueDetail(issueId: string): Promise<IssueType> {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        deployment: true,
        comments: { orderBy: { createdAt: "desc" } },
        logs: { orderBy: { occurredAt: "desc" }, take: 30 }
      }
    });

    if (!issue) {
      throw new NotFoundException("이슈를 찾을 수 없습니다.");
    }

    return toIssueType(issue);
  }

  async updateIssueStatus(input: UpdateIssueStatusInput): Promise<IssueType> {
    const status = toStatus(input.status);
    if (!status) {
      throw new BadRequestException("status 값이 필요합니다.");
    }

    const updated = await this.prisma.issue.update({
      where: { id: input.issueId },
      data: { status },
      include: { deployment: true }
    });

    this.clearCache();
    await writeOpsAuditLog(this.prisma, this.logger, {
      action: "issue.status_updated",
      targetType: "Issue",
      targetId: updated.id,
      summary: `${updated.title} 상태를 ${updated.status}(으)로 변경`,
      metadata: { status: updated.status }
    });

    return toIssueType({ ...updated, logs: [], comments: [] });
  }

  async assignIssue(input: AssignIssueInput): Promise<IssueType> {
    const updated = await this.prisma.issue.update({
      where: { id: input.issueId },
      data: { assignee: input.assignee.trim() || null },
      include: { deployment: true }
    });

    this.clearCache();
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor: input.assignee,
      action: "issue.assigned",
      targetType: "Issue",
      targetId: updated.id,
      summary: `${updated.title} 담당자 지정`,
      metadata: { assignee: updated.assignee }
    });

    return toIssueType({ ...updated, logs: [], comments: [] });
  }

  async addIssueComment(input: AddIssueCommentInput): Promise<IssueType> {
    const comment = await this.prisma.issueComment.create({
      data: {
        issueId: input.issueId,
        author: input.author.trim() || "익명",
        body: input.body
      }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor: comment.author,
      action: "issue.comment_added",
      targetType: "Issue",
      targetId: input.issueId,
      summary: "이슈 코멘트 추가",
      metadata: { commentId: comment.id }
    });

    return this.getIssueDetail(input.issueId);
  }
}
