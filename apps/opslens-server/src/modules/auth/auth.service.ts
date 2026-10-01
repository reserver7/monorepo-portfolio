import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import type { User } from "@prisma/client";
import { env } from "../../config/env.js";
import { PrismaService } from "../../integration/db/prisma.service.js";
import { writeOpsAuditLog } from "../ops/ops-audit-writer.js";
import {
  AuthUserPayload,
  hashPassword,
  signAccessToken,
  verifyAccessToken,
  verifyPassword
} from "./auth.token.js";
import {
  consumeEmailVerificationToken,
  createEmailVerificationToken,
  sendEmailVerificationEmail,
  type EmailVerificationDelivery
} from "./email-verification.js";
import { consumeEmailChangeToken, createEmailChangeToken, sendEmailChangeEmail } from "./email-change.js";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  sendPasswordResetEmail
} from "./password-reset.js";
import {
  createTwoFactorSecret,
  createTwoFactorUri,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  verifyTotpCode
} from "./two-factor.js";
import { consumeRecoveryCode, createRecoveryCodes, serializeRecoveryCodes } from "./recovery-codes.js";
import {
  consumeAdminInvitation,
  createAdminInvitationToken,
  buildAdminInvitationUrl,
  sendAdminInvitationEmail
} from "./admin-invitation.js";

type AuthUserResponse = {
  id: string;
  email: string;
  name: string;
  role: User["role"];
  authProvider: User["authProvider"];
  avatarColor: User["avatarColor"];
  isActive: boolean;
};

type AuthUserListInput = {
  query?: string;
  role?: User["role"];
  isActive?: boolean;
  page?: number;
  pageSize?: number;
};

type AuthUserListResponse = {
  items: AuthUserResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
};

type SecurityEventListInput = {
  reviewStatus?: "unreviewed" | "in_review" | "resolved";
  severity?: string;
  assignee?: string;
  page?: number;
  pageSize?: number;
};

type SecurityEventReviewInput = {
  reviewStatus: "unreviewed" | "in_review" | "resolved";
  assignee?: string;
  reviewNote?: string;
};

type AuthUserDetailsResponse = {
  user: AuthUserResponse & { createdAt: Date; emailVerifiedAt: Date | null };
  activeSessionCount: number;
  lastLoginAt: Date | null;
  lastPasswordChangedAt: Date | null;
  recentActivity: Array<{
    id: string;
    action: string;
    severity: string;
    summary: string;
    createdAt: Date;
  }>;
  sessions: Array<{
    id: string;
    createdAt: Date;
    lastUsedAt: Date | null;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  }>;
};

type AuthUserActivityInput = {
  action?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

type AuthUserActivityResponse = {
  items: Array<{
    id: string;
    actor: string;
    targetType: string;
    targetId: string | null;
    action: string;
    severity: string;
    summary: string;
    beforeValue: unknown;
    afterValue: unknown;
    metadata: unknown;
    createdAt: Date;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
};

const csvCell = (value: unknown): string => `"${String(value ?? "").replaceAll('"', '""')}"`;

export type AuthLoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUserResponse;
};

export type AuthSignupResponse = {
  requiresEmailVerification: true;
  email: string;
  emailDelivery: EmailVerificationDelivery;
};

export type AuthNotificationPolicy = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  slackEnabled: boolean;
  minLevel: "all" | "high" | "critical";
  quietHoursEnabled: boolean;
  quietFrom: string;
  quietTo: string;
};

const DEFAULT_NOTIFICATION_POLICY: AuthNotificationPolicy = {
  inAppEnabled: true,
  emailEnabled: false,
  slackEnabled: false,
  minLevel: "all",
  quietHoursEnabled: false,
  quietFrom: "22:00",
  quietTo: "08:00"
};
const TWO_FACTOR_SETUP_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly loginAttempts = new Map<
    string,
    { count: number; firstAttemptAt: number; blockedUntil: number }
  >();

  constructor(private readonly prisma: PrismaService) {}

  async signup(input: {
    email: string;
    name: string;
    password: string;
    next?: string;
  }): Promise<AuthSignupResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedName = input.name.trim();
    const normalizedPassword = input.password.trim();

    if (!normalizedEmail || normalizedName.length < 2 || normalizedPassword.length < 8) {
      throw new UnauthorizedException("회원가입 입력값이 올바르지 않습니다.");
    }

    const exists = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }
    });
    if (exists) {
      throw new ConflictException("이미 가입된 이메일입니다.");
    }

    const createdUser = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedName,
        passwordHash: hashPassword(normalizedPassword),
        authProvider: "local",
        role: "operator",
        isActive: true
      }
    });

    const token = await createEmailVerificationToken(this.prisma, createdUser.id, input.next);
    const emailDelivery = await sendEmailVerificationEmail({ to: createdUser.email, token });
    return { requiresEmailVerification: true, email: createdUser.email, emailDelivery };
  }

  async resendEmailVerification(input: { email: string; next?: string }): Promise<EmailVerificationDelivery> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.emailVerifiedAt) return { sent: false, reason: "already-verified" };
    const token = await createEmailVerificationToken(this.prisma, user.id, input.next);
    await this.writeAuthAudit(user.email, "auth.verification_resent", user.id, "인증 이메일 재발송");
    return sendEmailVerificationEmail({ to: user.email, token });
  }

  async inviteUser(actor: AuthUserPayload, input: { email: string; role: User["role"] }) {
    this.assertAdmin(actor);
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new ConflictException("이미 등록된 이메일입니다.");
    await this.prisma.adminInvitation.updateMany({
      where: { email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    const created = await createAdminInvitationToken(this.prisma, {
      email,
      role: input.role,
      invitedBy: actor.email
    });
    const emailDelivery = await sendAdminInvitationEmail({ to: email, token: created.token });
    const invitation = await this.prisma.adminInvitation.findUnique({ where: { id: created.invitationId } });
    await this.writeAuthAudit(
      actor.email,
      "auth.invitation_created",
      created.invitationId,
      "관리자 초대 생성",
      "info",
      {
        email,
        role: input.role,
        emailDelivery: emailDelivery.sent ? "sent" : emailDelivery.reason
      }
    );
    return {
      id: created.invitationId,
      email,
      role: input.role,
      expiresAt: invitation?.expiresAt,
      emailDelivery,
      inviteUrl: buildAdminInvitationUrl(created.token)
    };
  }

  async listInvitations(actor: AuthUserPayload) {
    this.assertAdmin(actor);
    return this.prisma.adminInvitation.findMany({
      where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true, invitedBy: true }
    });
  }

  async resendInvitation(actor: AuthUserPayload, invitationId: string) {
    this.assertAdmin(actor);
    const invitation = await this.prisma.adminInvitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt <= new Date()) {
      throw new NotFoundException("유효한 초대를 찾을 수 없습니다.");
    }
    const rotated = await createAdminInvitationToken(this.prisma, {
      email: invitation.email,
      role: invitation.role,
      invitedBy: actor.email
    });
    await this.prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { revokedAt: new Date() }
    });
    const emailDelivery = await sendAdminInvitationEmail({ to: invitation.email, token: rotated.token });
    await this.writeAuthAudit(
      actor.email,
      "auth.invitation_resent",
      invitation.id,
      "관리자 초대 재발송",
      "info",
      {
        email: invitation.email,
        emailDelivery: emailDelivery.sent ? "sent" : emailDelivery.reason
      }
    );
    return { success: true as const, emailDelivery, inviteUrl: buildAdminInvitationUrl(rotated.token) };
  }

  async revokeInvitation(actor: AuthUserPayload, invitationId: string) {
    this.assertAdmin(actor);
    const result = await this.prisma.adminInvitation.updateMany({
      where: { id: invitationId, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    if (result.count === 0) throw new NotFoundException("유효한 초대를 찾을 수 없습니다.");
    await this.writeAuthAudit(
      actor.email,
      "auth.invitation_revoked",
      invitationId,
      "관리자 초대 취소",
      "warning"
    );
    return { success: true as const };
  }

  async resolveInvitation(token: string) {
    const invitation = await consumeAdminInvitation(this.prisma, token);
    if (!invitation) throw new UnauthorizedException("초대 링크가 만료되었거나 유효하지 않습니다.");
    return { email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt };
  }

  async acceptInvitation(input: { token: string; name: string; password: string }) {
    const invitation = await consumeAdminInvitation(this.prisma, input.token);
    if (!invitation) throw new UnauthorizedException("초대 링크가 만료되었거나 유효하지 않습니다.");
    const existing = await this.prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true }
    });
    if (existing) throw new ConflictException("이미 등록된 이메일입니다.");
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: invitation.email,
          name: input.name.trim(),
          passwordHash: hashPassword(input.password.trim()),
          role: invitation.role,
          authProvider: "local",
          isActive: true,
          emailVerifiedAt: new Date()
        }
      });
      await tx.adminInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
      return created;
    });
    await this.writeAuthAudit(user.email, "auth.invitation_accepted", user.id, "관리자 초대 수락", "info");
    return { accepted: true as const, email: user.email };
  }

  async requestEmailChange(authUser: AuthUserPayload, newEmail: string) {
    const normalizedEmail = newEmail.trim().toLowerCase();
    if (normalizedEmail === authUser.email.toLowerCase()) {
      throw new ConflictException("새 이메일 주소가 현재 주소와 같습니다.");
    }
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new ConflictException("이미 사용 중인 이메일입니다.");
    const token = await createEmailChangeToken(this.prisma, authUser.sub, normalizedEmail);
    const delivery = await sendEmailChangeEmail({ to: normalizedEmail, token });
    await this.writeAuthAudit(
      authUser.email,
      "auth.email_change_requested",
      authUser.sub,
      "이메일 주소 변경 요청",
      "info",
      {
        newEmail: normalizedEmail,
        delivery
      }
    );
    return { sent: delivery === "sent", email: normalizedEmail };
  }

  async confirmEmailChange(token: string) {
    const result = await consumeEmailChangeToken(this.prisma, token);
    if (!result) throw new UnauthorizedException("이메일 변경 링크가 만료되었거나 유효하지 않습니다.");
    const existing = await this.prisma.user.findUnique({ where: { email: result.newEmail } });
    if (existing && existing.id !== result.userId) {
      throw new ConflictException("이미 사용 중인 이메일입니다.");
    }
    const user = await this.prisma.user.update({
      where: { id: result.userId },
      data: { email: result.newEmail }
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: result.userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await this.writeAuthAudit(user.email, "auth.email_changed", user.id, "이메일 주소 변경 완료");
    return { changed: true as const, email: user.email };
  }

  async verifyEmail(token: string) {
    const result = await consumeEmailVerificationToken(this.prisma, token);
    if (!result) throw new UnauthorizedException("인증 링크가 만료되었거나 유효하지 않습니다.");
    await this.writeAuthAudit(result.email, "auth.email_verified", result.userId, "이메일 인증 완료");
    return { verified: true as const, email: result.email, next: result.returnTo };
  }

  async listUsers(actor: AuthUserPayload, input: AuthUserListInput = {}): Promise<AuthUserListResponse> {
    this.assertAdmin(actor);
    const query = input.query?.trim();
    const page =
      Number.isFinite(input.page) && input.page && input.page > 0 ? Math.max(1, Math.floor(input.page)) : 1;
    const pageSize =
      Number.isFinite(input.pageSize) && input.pageSize && input.pageSize > 0
        ? Math.max(1, Math.min(100, Math.floor(input.pageSize)))
        : 20;
    const where = {
      ...(query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" as const } },
              { name: { contains: query, mode: "insensitive" as const } }
            ]
          }
        : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {})
    };
    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.user.count({ where })
    ]);
    return { items: users.map((user) => this.toAuthUserResponse(user)), totalCount, page, pageSize };
  }

  async updateUser(
    actor: AuthUserPayload,
    userId: string,
    input: { role?: User["role"]; isActive?: boolean; reason: string }
  ): Promise<AuthUserResponse> {
    this.assertAdmin(actor);
    const reason = this.normalizeAdminReason(input.reason);
    if (actor.sub === userId && input.isActive === false) {
      throw new ConflictException("자신의 계정은 비활성화할 수 없습니다.");
    }
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException("사용자를 찾을 수 없습니다.");
    if (target.role === "admin" && input.role !== "admin") {
      const adminCount = await this.prisma.user.count({ where: { role: "admin", isActive: true } });
      if (adminCount <= 1) throw new ConflictException("활성 관리자는 최소 한 명 이상 필요합니다.");
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.role ? { role: input.role } : {}),
        ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {})
      }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor: actor.email,
      action: "user.updated",
      targetType: "User",
      targetId: updated.id,
      severity: input.isActive === false || input.role === "admin" ? "warning" : "info",
      summary: `${updated.email} 사용자 권한 또는 활성 상태 변경`,
      metadata: { reason },
      beforeValue: { role: target.role, isActive: target.isActive },
      afterValue: { role: updated.role, isActive: updated.isActive }
    });
    return this.toAuthUserResponse(updated);
  }

  async getUserDetails(actor: AuthUserPayload, userId: string): Promise<AuthUserDetailsResponse> {
    this.assertAdmin(actor);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        authProvider: true,
        avatarColor: true,
        isActive: true,
        createdAt: true,
        emailVerifiedAt: true
      }
    });
    if (!user) throw new NotFoundException("사용자를 찾을 수 없습니다.");
    const [activeSessionCount, sessions, activity] = await Promise.all([
      this.prisma.refreshToken.count({
        where: { userId, revokedAt: null, expiresAt: { gt: new Date() } }
      }),
      this.prisma.refreshToken.findMany({
        where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { lastUsedAt: "desc" },
        take: 20,
        select: {
          id: true,
          createdAt: true,
          lastUsedAt: true,
          expiresAt: true,
          ipAddress: true,
          userAgent: true
        }
      }),
      this.prisma.opsAuditLog.findMany({
        where: { targetType: "Auth", targetId: userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, action: true, severity: true, summary: true, createdAt: true }
      })
    ]);
    return {
      user: {
        ...this.toAuthUserResponse(user as User),
        createdAt: user.createdAt,
        emailVerifiedAt: user.emailVerifiedAt
      },
      activeSessionCount,
      lastLoginAt: activity.find((item) => item.action === "auth.login")?.createdAt ?? null,
      lastPasswordChangedAt:
        activity.find(
          (item) => item.action === "auth.password_changed" || item.action === "auth.password_reset"
        )?.createdAt ?? null,
      recentActivity: activity,
      sessions
    };
  }

  async bulkUpdateUsers(
    actor: AuthUserPayload,
    userIds: string[],
    input: { isActive: boolean; reason: string }
  ): Promise<{ success: true; updatedCount: number; skippedUserIds: string[] }> {
    this.assertAdmin(actor);
    const reason = this.normalizeAdminReason(input.reason);
    const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
    const skippedUserIds = input.isActive === false && uniqueUserIds.includes(actor.sub) ? [actor.sub] : [];
    const targetUserIds = uniqueUserIds.filter((userId) => !skippedUserIds.includes(userId));
    if (targetUserIds.length === 0) {
      return { success: true, updatedCount: 0, skippedUserIds };
    }
    const result = await this.prisma.user.updateMany({
      where: { id: { in: targetUserIds } },
      data: { isActive: input.isActive }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor: actor.email,
      action: "users.bulk_status_updated",
      targetType: "User",
      severity: input.isActive ? "info" : "warning",
      summary: `관리자가 ${result.count}명의 사용자 상태를 일괄 변경`,
      metadata: { userIds: targetUserIds, isActive: input.isActive, count: result.count, reason }
    });
    return { success: true, updatedCount: result.count, skippedUserIds };
  }

  async listUserActivity(
    actor: AuthUserPayload,
    userId: string,
    input: AuthUserActivityInput = {}
  ): Promise<AuthUserActivityResponse> {
    this.assertAdmin(actor);
    const page =
      Number.isFinite(input.page) && input.page && input.page > 0 ? Math.max(1, Math.floor(input.page)) : 1;
    const pageSize =
      Number.isFinite(input.pageSize) && input.pageSize && input.pageSize > 0
        ? Math.max(1, Math.min(100, Math.floor(input.pageSize)))
        : 20;
    const where = {
      targetType: "Auth",
      targetId: userId,
      ...(input.action ? { action: input.action } : {}),
      ...(input.from || input.to
        ? {
            createdAt: { ...(input.from ? { gte: input.from } : {}), ...(input.to ? { lte: input.to } : {}) }
          }
        : {})
    };
    const [items, totalCount] = await Promise.all([
      this.prisma.opsAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          actor: true,
          targetType: true,
          targetId: true,
          action: true,
          severity: true,
          summary: true,
          beforeValue: true,
          afterValue: true,
          metadata: true,
          createdAt: true
        }
      }),
      this.prisma.opsAuditLog.count({ where })
    ]);
    return { items, totalCount, page, pageSize };
  }

  async exportUserActivityCsv(
    actor: AuthUserPayload,
    userId: string,
    input: Pick<AuthUserActivityInput, "action" | "from" | "to"> = {}
  ): Promise<string> {
    this.assertAdmin(actor);
    const where = {
      targetType: "Auth",
      targetId: userId,
      ...(input.action ? { action: input.action } : {}),
      ...(input.from || input.to
        ? {
            createdAt: { ...(input.from ? { gte: input.from } : {}), ...(input.to ? { lte: input.to } : {}) }
          }
        : {})
    };
    const items = await this.prisma.opsAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10_000,
      select: {
        actor: true,
        targetType: true,
        targetId: true,
        action: true,
        severity: true,
        summary: true,
        beforeValue: true,
        afterValue: true,
        metadata: true,
        createdAt: true
      }
    });
    const header =
      "createdAt,actor,targetType,targetId,action,severity,summary,beforeValue,afterValue,metadata";
    const rows = items.map((item) =>
      [
        item.createdAt.toISOString(),
        item.actor,
        item.targetType,
        item.targetId,
        item.action,
        item.severity,
        item.summary,
        JSON.stringify(item.beforeValue ?? ""),
        JSON.stringify(item.afterValue ?? ""),
        JSON.stringify(item.metadata ?? "")
      ]
        .map(csvCell)
        .join(",")
    );
    return `\uFEFF${[header, ...rows].join("\n")}`;
  }

  private assertAdmin(actor: AuthUserPayload): void {
    if (actor.role !== "admin") throw new ForbiddenException("관리자 권한이 필요합니다.");
  }

  private toAuthUserResponse(user: User): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      authProvider: user.authProvider,
      avatarColor: user.avatarColor,
      isActive: user.isActive
    };
  }

  async login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string,
    otp?: string
  ): Promise<AuthLoginResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const attemptKey = this.buildAttemptKey(normalizedEmail, ip);
    this.assertLoginAllowed(attemptKey);
    if (!normalizedEmail || normalizedPassword.length < 8) {
      this.markLoginFailure(attemptKey);
      await this.writeAuthAudit(
        normalizedEmail || "unknown",
        "auth.login_failed",
        null,
        "로그인 입력값 검증 실패",
        "warning",
        {
          ipAddress: ip,
          userAgent
        }
      );
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || !user.isActive) {
      this.markLoginFailure(attemptKey);
      await this.writeAuthAudit(
        normalizedEmail,
        "auth.login_failed",
        null,
        "존재하지 않거나 비활성화된 계정의 로그인 실패",
        "warning",
        {
          ipAddress: ip,
          userAgent
        }
      );
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    if (!user.emailVerifiedAt) {
      await this.writeAuthAudit(
        user.email,
        "auth.login_failed",
        user.id,
        "미인증 계정의 로그인 시도",
        "warning",
        {
          ipAddress: ip,
          userAgent
        }
      );
      throw new ForbiddenException("이메일 인증이 필요합니다.");
    }
    if (!verifyPassword(normalizedPassword, user.passwordHash)) {
      this.markLoginFailure(attemptKey);
      await this.writeAuthAudit(
        user.email,
        "auth.login_failed",
        user.id,
        "비밀번호 불일치로 로그인 실패",
        "warning",
        {
          ipAddress: ip,
          userAgent
        }
      );
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    if (user.twoFactorEnabled) {
      const validTotp = Boolean(
        otp && user.twoFactorSecret && verifyTotpCode(decryptTwoFactorSecret(user.twoFactorSecret), otp)
      );
      const remainingRecoveryCodes =
        !validTotp && otp ? consumeRecoveryCode(user.twoFactorRecoveryCodes, otp) : null;
      if (!validTotp && !remainingRecoveryCodes) {
        await this.writeAuthAudit(
          user.email,
          "auth.two_factor_failed",
          user.id,
          "2FA 코드 불일치",
          "warning",
          {
            ipAddress: ip,
            userAgent
          }
        );
        throw new UnauthorizedException("2FA 인증 코드가 필요하거나 올바르지 않습니다.");
      }
      if (remainingRecoveryCodes) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { twoFactorRecoveryCodes: remainingRecoveryCodes }
        });
        await this.writeAuthAudit(
          user.email,
          "auth.two_factor_recovery_used",
          user.id,
          "2FA 복구 코드 사용",
          "warning"
        );
      }
    }

    this.clearLoginFailure(attemptKey);
    const response = await this.buildLoginResponse(user, user.name, undefined, { ipAddress: ip, userAgent });
    await this.writeAuthAudit(user.email, "auth.login", user.id, "로그인 성공", "info", {
      ipAddress: ip,
      userAgent
    });
    return response;
  }

  async forgotPassword(email: string): Promise<{ success: true }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new UnauthorizedException("이메일이 올바르지 않습니다.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, authProvider: true, emailVerifiedAt: true }
    });

    if (user?.authProvider === "local" && user.emailVerifiedAt) {
      const token = await createPasswordResetToken(this.prisma, user.id);
      await sendPasswordResetEmail({ to: user.email, token });
      await this.writeAuthAudit(user.email, "auth.password_reset_requested", user.id, "비밀번호 재설정 요청");
    }

    return { success: true };
  }

  async resetPassword(input: { token: string; password: string }): Promise<{ success: true }> {
    const password = input.password.trim();
    if (password.length < 8) throw new UnauthorizedException("비밀번호는 8자 이상이어야 합니다.");

    const result = await consumePasswordResetToken(this.prisma, input.token);
    if (!result) throw new UnauthorizedException("비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.");

    await this.prisma.user.update({
      where: { id: result.userId },
      data: { passwordHash: hashPassword(password) }
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: result.userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await this.writeAuthAudit(result.email, "auth.password_reset", result.userId, "비밀번호 재설정 완료");
    return { success: true };
  }

  verifyBearerToken(authorizationHeader: string | undefined): AuthUserPayload {
    if (!authorizationHeader) {
      throw new UnauthorizedException("로그인이 필요합니다.");
    }

    const [tokenType, accessToken] = authorizationHeader.split(" ");
    if (tokenType?.toLowerCase() !== "bearer" || !accessToken) {
      throw new UnauthorizedException("인증 헤더 형식이 올바르지 않습니다.");
    }

    return verifyAccessToken(accessToken, env.AUTH_JWT_SECRET);
  }

  async me(authUser: AuthUserPayload): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.sub }
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("유효하지 않은 사용자입니다.");
    }

    return this.toUserResponse(user);
  }

  async updateProfile(
    authUser: AuthUserPayload,
    input: { name: string; avatarColor?: string }
  ): Promise<AuthUserResponse> {
    const normalizedName = input.name.trim();
    if (normalizedName.length < 2) {
      throw new UnauthorizedException("이름은 2자 이상이어야 합니다.");
    }

    const user = await this.prisma.user.update({
      where: { id: authUser.sub },
      data: {
        name: normalizedName,
        avatarColor: input.avatarColor ?? undefined
      }
    });

    return this.toUserResponse(user);
  }

  async changePassword(
    authUser: AuthUserPayload,
    input: { currentPassword: string; newPassword: string },
    currentRefreshToken?: string
  ): Promise<{ success: true }> {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.sub }
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("유효하지 않은 사용자입니다.");
    }
    if (user.authProvider !== "local") {
      throw new UnauthorizedException("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
    }

    const currentPassword = input.currentPassword.trim();
    const newPassword = input.newPassword.trim();
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new UnauthorizedException("현재 비밀번호가 올바르지 않습니다.");
    }
    if (newPassword.length < 8) {
      throw new UnauthorizedException("새 비밀번호는 8자 이상이어야 합니다.");
    }
    if (currentPassword === newPassword) {
      throw new UnauthorizedException("새 비밀번호는 기존 비밀번호와 달라야 합니다.");
    }

    const currentTokenHash = currentRefreshToken ? this.hashRefreshToken(currentRefreshToken) : null;
    if (!currentTokenHash) {
      throw new UnauthorizedException("현재 세션을 확인할 수 없습니다.");
    }

    await this.prisma.$transaction(async (tx) => {
      const currentSession = await tx.refreshToken.findFirst({
        where: {
          userId: user.id,
          tokenHash: currentTokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        select: { id: true }
      });
      if (!currentSession) {
        throw new UnauthorizedException("현재 세션을 확인할 수 없습니다.");
      }

      const revokedSessions = await tx.refreshToken.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
          tokenHash: { not: currentTokenHash }
        },
        data: { revokedAt: new Date() }
      });
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashPassword(newPassword)
        }
      });
      await tx.opsAuditLog.create({
        data: {
          actor: user.email,
          action: "auth.password_changed",
          targetType: "Auth",
          targetId: user.id,
          severity: "info",
          summary: "비밀번호 변경 및 다른 세션 해제",
          metadata: { revokedSessionCount: revokedSessions.count }
        }
      });
    });
    return { success: true };
  }

  async getTwoFactorStatus(authUser: AuthUserPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.sub },
      select: { twoFactorEnabled: true }
    });
    if (!user) throw new UnauthorizedException("유효하지 않은 사용자입니다.");
    return { enabled: user.twoFactorEnabled };
  }

  async setupTwoFactor(authUser: AuthUserPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: authUser.sub } });
    if (!user || user.authProvider !== "local") {
      throw new UnauthorizedException("소셜 로그인 계정은 2FA를 설정할 수 없습니다.");
    }
    if (user.twoFactorEnabled) throw new ConflictException("2FA가 이미 활성화되어 있습니다.");
    const secret = createTwoFactorSecret();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: encryptTwoFactorSecret(secret),
        twoFactorSetupExpiresAt: new Date(Date.now() + TWO_FACTOR_SETUP_TTL_MS)
      }
    });
    return {
      enabled: false as const,
      secret,
      otpauthUri: createTwoFactorUri(secret, user.email),
      expiresAt: new Date(Date.now() + TWO_FACTOR_SETUP_TTL_MS).toISOString()
    };
  }

  async confirmTwoFactor(authUser: AuthUserPayload, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: authUser.sub } });
    if (!user?.twoFactorSecret || user.twoFactorEnabled)
      throw new ConflictException("2FA 설정을 시작해 주세요.");
    if (user.twoFactorSetupExpiresAt && user.twoFactorSetupExpiresAt <= new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: null, twoFactorSetupExpiresAt: null }
      });
      throw new ConflictException("2FA 설정이 만료되었습니다. 새로 시작해 주세요.");
    }
    if (!verifyTotpCode(decryptTwoFactorSecret(user.twoFactorSecret), code)) {
      throw new UnauthorizedException("2FA 코드가 올바르지 않습니다.");
    }
    const recoveryCodes = createRecoveryCodes();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: serializeRecoveryCodes(recoveryCodes),
        twoFactorSetupExpiresAt: null
      }
    });
    await this.writeAuthAudit(user.email, "auth.two_factor_enabled", user.id, "2FA 활성화");
    return { enabled: true as const, recoveryCodes };
  }

  async disableTwoFactor(authUser: AuthUserPayload, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: authUser.sub } });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret)
      throw new ConflictException("2FA가 활성화되어 있지 않습니다.");
    if (!verifyTotpCode(decryptTwoFactorSecret(user.twoFactorSecret), code)) {
      throw new UnauthorizedException("2FA 코드가 올바르지 않습니다.");
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
        twoFactorSetupExpiresAt: null
      }
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await this.writeAuthAudit(user.email, "auth.two_factor_disabled", user.id, "2FA 비활성화", "warning");
    return { enabled: false as const };
  }

  async cancelTwoFactorSetup(authUser: AuthUserPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: authUser.sub } });
    if (!user || user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new ConflictException("진행 중인 2FA 설정이 없습니다.");
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: null, twoFactorSetupExpiresAt: null }
    });
    await this.writeAuthAudit(
      user.email,
      "auth.two_factor_setup_cancelled",
      user.id,
      "2FA 설정 취소",
      "info"
    );
    return { cancelled: true as const };
  }

  async regenerateRecoveryCodes(authUser: AuthUserPayload, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: authUser.sub } });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new ConflictException("2FA가 활성화되어 있지 않습니다.");
    }
    if (!verifyTotpCode(decryptTwoFactorSecret(user.twoFactorSecret), code)) {
      throw new UnauthorizedException("2FA 코드가 올바르지 않습니다.");
    }
    const recoveryCodes = createRecoveryCodes();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorRecoveryCodes: serializeRecoveryCodes(recoveryCodes) }
    });
    await this.writeAuthAudit(
      user.email,
      "auth.two_factor_recovery_regenerated",
      user.id,
      "2FA 복구 코드 재발급",
      "warning"
    );
    return { recoveryCodes };
  }

  async refresh(refreshToken: string): Promise<AuthLoginResponse> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const now = new Date();
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });
    if (!stored || stored.revokedAt || stored.expiresAt <= now || !stored.user?.isActive) {
      throw new UnauthorizedException("세션이 만료되었습니다. 다시 로그인해 주세요.");
    }

    const response = await this.buildLoginResponse(stored.user, stored.user.name, undefined, {
      ipAddress: stored.ipAddress ?? undefined,
      userAgent: stored.userAgent ?? undefined
    });
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: now, replacedById: this.hashRefreshToken(response.refreshToken), lastUsedAt: now }
    });
    return response;
  }

  async oauthLogin(input: {
    provider: string;
    providerAccountId: string;
    email: string;
    name: string;
  }): Promise<AuthLoginResponse> {
    const provider = input.provider.trim().toLowerCase();
    const providerAccountId = input.providerAccountId.trim();
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedName = input.name.trim();

    if (!provider || !providerAccountId || !normalizedEmail) {
      throw new UnauthorizedException("OAuth 사용자 정보가 유효하지 않습니다.");
    }

    const user =
      (await this.prisma.user.findUnique({
        where: { email: normalizedEmail }
      })) ??
      (await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: normalizedName.length > 0 ? normalizedName : this.deriveNameFromEmail(normalizedEmail),
          passwordHash: hashPassword(randomBytes(24).toString("base64url")),
          authProvider: provider === "github" || provider === "google" ? provider : "local",
          role: "operator",
          isActive: true,
          emailVerifiedAt: new Date()
        }
      }));

    if (!user.isActive) {
      throw new UnauthorizedException("비활성화된 사용자입니다.");
    }

    if (normalizedName.length > 0 && user.name !== normalizedName) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { name: normalizedName }
      });
    }

    const refreshedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        authProvider: provider === "github" || provider === "google" ? provider : "local",
        emailVerifiedAt: user.emailVerifiedAt ?? new Date()
      }
    });

    return this.buildLoginResponse(
      refreshedUser,
      normalizedName.length > 0 ? normalizedName : refreshedUser.name
    );
  }

  async logout(authUser: AuthUserPayload, refreshToken?: string): Promise<{ success: true }> {
    await this.prisma.refreshToken.updateMany({
      where: refreshToken
        ? { tokenHash: this.hashRefreshToken(refreshToken), userId: authUser.sub, revokedAt: null }
        : { userId: authUser.sub, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await this.writeAuthAudit(authUser.email, "auth.logout", authUser.sub, "로그아웃");
    return { success: true };
  }

  async deleteAccount(authUser: AuthUserPayload, currentPassword: string): Promise<{ success: true }> {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.sub },
      select: { id: true, email: true, passwordHash: true }
    });
    if (!user || !verifyPassword(currentPassword.trim(), user.passwordHash)) {
      throw new UnauthorizedException("현재 비밀번호가 올바르지 않습니다.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.opsAuditLog.create({
        data: {
          actor: user.email,
          action: "auth.account_deleted",
          targetType: "User",
          targetId: user.id,
          severity: "warning",
          summary: "사용자 계정 삭제"
        }
      });
      await tx.user.delete({ where: { id: user.id } });
    });

    return { success: true };
  }

  async listSessions(authUser: AuthUserPayload, currentRefreshToken?: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId: authUser.sub, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
      select: {
        id: true,
        tokenHash: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true
      }
    });
    const currentHash = currentRefreshToken ? this.hashRefreshToken(currentRefreshToken) : null;
    return sessions.map(({ tokenHash, ...session }) => ({
      ...session,
      isCurrent: tokenHash === currentHash
    }));
  }

  async revokeSession(authUser: AuthUserPayload, sessionId: string): Promise<{ success: true }> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { id: sessionId, userId: authUser.sub, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    if (result.count === 0) throw new NotFoundException("세션을 찾을 수 없습니다.");
    await this.writeAuthAudit(authUser.email, "auth.session_revoked", sessionId, "활성 세션 해제", "info", {
      sessionId
    });
    return { success: true };
  }

  async revokeAllSessions(authUser: AuthUserPayload): Promise<{ success: true }> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId: authUser.sub, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await this.writeAuthAudit(
      authUser.email,
      "auth.sessions_revoked",
      authUser.sub,
      "모든 세션 해제",
      "warning",
      {
        count: result.count
      }
    );
    return { success: true };
  }

  async revokeUserSessions(
    actor: AuthUserPayload,
    userId: string,
    reasonInput: string
  ): Promise<{ success: true }> {
    this.assertAdmin(actor);
    if (actor.sub === userId)
      throw new ConflictException("자신의 세션은 관리자 화면에서 종료할 수 없습니다.");
    const reason = this.normalizeAdminReason(reasonInput);
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor: actor.email,
      action: "auth.user_sessions_revoked",
      targetType: "User",
      targetId: userId,
      severity: "warning",
      summary: "관리자가 사용자의 모든 세션 해제",
      metadata: { count: result.count, reason }
    });
    return { success: true };
  }

  async revokeUserSession(
    actor: AuthUserPayload,
    userId: string,
    sessionId: string,
    reasonInput: string
  ): Promise<{ success: true }> {
    this.assertAdmin(actor);
    const reason = this.normalizeAdminReason(reasonInput);
    if (actor.sub === userId)
      throw new ConflictException("자신의 세션은 관리자 화면에서 종료할 수 없습니다.");
    const result = await this.prisma.refreshToken.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    if (result.count === 0) throw new NotFoundException("활성 세션을 찾을 수 없습니다.");
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor: actor.email,
      action: "auth.user_session_revoked",
      targetType: "User",
      targetId: userId,
      severity: "warning",
      summary: "관리자가 사용자의 세션 하나를 해제",
      metadata: { sessionId, reason }
    });
    return { success: true };
  }

  async bulkRevokeUserSessions(
    actor: AuthUserPayload,
    userIds: string[],
    reasonInput: string
  ): Promise<{ success: true; revokedCount: number }> {
    this.assertAdmin(actor);
    const reason = this.normalizeAdminReason(reasonInput);
    const targetUserIds = [...new Set(userIds)].filter((userId) => userId && userId !== actor.sub);
    if (targetUserIds.length === 0) return { success: true, revokedCount: 0 };
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId: { in: targetUserIds, not: actor.sub }, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor: actor.email,
      action: "auth.users_sessions_revoked",
      targetType: "User",
      severity: "warning",
      summary: `관리자가 ${targetUserIds.length}명의 모든 세션 해제`,
      metadata: { userIds: targetUserIds, count: result.count, reason }
    });
    return { success: true, revokedCount: result.count };
  }

  async listSecurityActivity(authUser: AuthUserPayload) {
    const logs = await this.prisma.opsAuditLog.findMany({
      where: { actor: authUser.email, action: { startsWith: "auth." } },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return logs.map((log) => ({
      id: log.id,
      actor: log.actor,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      severity: log.severity,
      summary: log.summary,
      beforeValue: log.beforeValue == null ? null : JSON.stringify(log.beforeValue),
      afterValue: log.afterValue == null ? null : JSON.stringify(log.afterValue),
      metadata: JSON.stringify(log.metadata),
      createdAt: log.createdAt
    }));
  }

  async listSecurityEvents(authUser: AuthUserPayload, input: SecurityEventListInput) {
    this.assertAdmin(authUser);
    const page = Number.isFinite(input.page) && (input.page ?? 0) > 0 ? Math.floor(input.page!) : 1;
    const pageSize =
      Number.isFinite(input.pageSize) && (input.pageSize ?? 0) > 0
        ? Math.min(Math.floor(input.pageSize!), 100)
        : 20;
    const assignee = input.assignee?.trim();
    const where = {
      ...(input.reviewStatus ? { reviewStatus: input.reviewStatus } : {}),
      ...(input.severity?.trim() ? { severity: input.severity.trim() } : {}),
      ...(assignee ? { reviewedBy: assignee } : {})
    };
    const [items, totalCount] = await Promise.all([
      this.prisma.opsAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.opsAuditLog.count({ where })
    ]);
    return {
      items: items.map((item) => ({
        id: item.id,
        actor: item.actor,
        action: item.action,
        targetType: item.targetType,
        targetId: item.targetId,
        severity: item.severity,
        summary: item.summary,
        reviewStatus: item.reviewStatus,
        reviewedBy: item.reviewedBy,
        reviewNote: item.reviewNote,
        reviewedAt: item.reviewedAt,
        createdAt: item.createdAt
      })),
      totalCount,
      page,
      pageSize
    };
  }

  async getSecurityEventDetails(authUser: AuthUserPayload, eventId: string) {
    this.assertAdmin(authUser);
    const event = await this.prisma.opsAuditLog.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        actor: true,
        action: true,
        targetType: true,
        targetId: true,
        severity: true,
        summary: true,
        beforeValue: true,
        afterValue: true,
        metadata: true,
        reviewStatus: true,
        reviewedBy: true,
        reviewNote: true,
        reviewedAt: true,
        createdAt: true
      }
    });
    if (!event) throw new NotFoundException("보안 이벤트를 찾을 수 없습니다.");
    const relatedEvents = event.targetId
      ? await this.prisma.opsAuditLog.findMany({
          where: { targetType: event.targetType, targetId: event.targetId, id: { not: event.id } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, action: true, severity: true, summary: true, createdAt: true }
        })
      : [];
    return { ...event, relatedEvents };
  }

  async listSecurityNotifications(authUser: AuthUserPayload) {
    this.assertAdmin(authUser);
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.opsAuditLog.findMany({
      where: {
        reviewStatus: "unreviewed",
        severity: { in: ["warning", "critical"] },
        createdAt: { gte: since }
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true }
    });
    if (events.length > 0) {
      await this.prisma.opsSecurityNotification.createMany({
        data: events.map((event) => ({ userId: authUser.sub, eventId: event.id })),
        skipDuplicates: true
      });
    }
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.opsSecurityNotification.findMany({
        where: { userId: authUser.sub },
        orderBy: { createdAt: "desc" },
        take: 50
      }),
      this.prisma.opsSecurityNotification.count({ where: { userId: authUser.sub, readAt: null } })
    ]);
    const eventIds = notifications.map((notification) => notification.eventId);
    const eventDetails =
      eventIds.length > 0
        ? await this.prisma.opsAuditLog.findMany({
            where: { id: { in: eventIds } },
            select: { id: true, action: true, severity: true, summary: true, createdAt: true }
          })
        : [];
    const eventById = new Map(eventDetails.map((event) => [event.id, event]));
    return {
      unreadCount,
      items: notifications.flatMap((notification) => {
        const event = eventById.get(notification.eventId);
        return event
          ? [
              {
                id: notification.id,
                eventId: notification.eventId,
                readAt: notification.readAt,
                createdAt: notification.createdAt,
                event
              }
            ]
          : [];
      })
    };
  }

  async markSecurityNotificationRead(authUser: AuthUserPayload, notificationId: string) {
    this.assertAdmin(authUser);
    const result = await this.prisma.opsSecurityNotification.updateMany({
      where: { id: notificationId, userId: authUser.sub },
      data: { readAt: new Date() }
    });
    if (result.count === 0) throw new NotFoundException("보안 알림을 찾을 수 없습니다.");
    return { success: true as const };
  }

  async reviewSecurityEvent(authUser: AuthUserPayload, eventId: string, input: SecurityEventReviewInput) {
    this.assertAdmin(authUser);
    const reviewNote = this.normalizeSecurityReviewNote(input.reviewNote);
    const existing = await this.prisma.opsAuditLog.findUnique({
      where: { id: eventId },
      select: { id: true, reviewStatus: true, reviewedBy: true, reviewNote: true, reviewedAt: true }
    });
    if (!existing) throw new NotFoundException("보안 이벤트를 찾을 수 없습니다.");
    const reviewedBy = input.assignee?.trim() || null;
    await this.validateSecurityEventAssignee(reviewedBy);
    const reviewedAt = input.reviewStatus === "unreviewed" ? null : new Date();
    const updated = await this.prisma.opsAuditLog.update({
      where: { id: eventId },
      data: {
        reviewStatus: input.reviewStatus,
        reviewedBy,
        reviewNote: reviewNote ?? null,
        reviewedAt
      }
    });
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor: authUser.email,
      action: "security.event_reviewed",
      targetType: "OpsAuditLog",
      targetId: eventId,
      severity: "info",
      summary: "관리자가 보안 이벤트 검토 상태를 변경",
      beforeValue: {
        reviewStatus: existing.reviewStatus,
        reviewedBy: existing.reviewedBy,
        reviewNote: existing.reviewNote,
        reviewedAt: existing.reviewedAt?.toISOString() ?? null
      },
      afterValue: {
        reviewStatus: input.reviewStatus,
        reviewedBy,
        reviewNote: reviewNote ?? null,
        reviewedAt: reviewedAt?.toISOString() ?? null
      }
    });
    return {
      id: updated.id,
      reviewStatus: updated.reviewStatus,
      reviewedBy: updated.reviewedBy,
      reviewNote: updated.reviewNote,
      reviewedAt: updated.reviewedAt
    };
  }

  async bulkReviewSecurityEvents(
    authUser: AuthUserPayload,
    eventIds: string[],
    input: SecurityEventReviewInput
  ): Promise<{ success: true; updatedCount: number }> {
    this.assertAdmin(authUser);
    const normalizedIds = [...new Set(eventIds.map((eventId) => eventId.trim()).filter(Boolean))];
    if (normalizedIds.length === 0) {
      throw new BadRequestException("검토할 보안 이벤트를 하나 이상 선택해야 합니다.");
    }
    const reviewNote = this.normalizeSecurityReviewNote(input.reviewNote);
    const reviewedBy = input.assignee?.trim() || null;
    await this.validateSecurityEventAssignee(reviewedBy);
    const events = await this.prisma.opsAuditLog.findMany({
      where: { id: { in: normalizedIds } },
      select: { id: true, reviewStatus: true, reviewedBy: true, reviewNote: true, reviewedAt: true }
    });
    if (events.length !== normalizedIds.length) {
      throw new NotFoundException("보안 이벤트를 찾을 수 없습니다.");
    }
    const reviewedAt = input.reviewStatus === "unreviewed" ? null : new Date();

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        events.map(async (event) => {
          await tx.opsAuditLog.update({
            where: { id: event.id },
            data: { reviewStatus: input.reviewStatus, reviewedBy, reviewNote, reviewedAt }
          });
          await tx.opsAuditLog.create({
            data: {
              actor: authUser.email,
              action: "security.event_reviewed",
              targetType: "OpsAuditLog",
              targetId: event.id,
              severity: "info",
              summary: "관리자가 보안 이벤트 검토 상태를 일괄 변경",
              beforeValue: {
                reviewStatus: event.reviewStatus,
                reviewedBy: event.reviewedBy,
                reviewNote: event.reviewNote,
                reviewedAt: event.reviewedAt?.toISOString() ?? null
              },
              afterValue: {
                reviewStatus: input.reviewStatus,
                reviewedBy,
                reviewNote,
                reviewedAt: reviewedAt?.toISOString() ?? null
              },
              metadata: { bulk: true }
            }
          });
        })
      );
    });
    return { success: true, updatedCount: events.length };
  }

  async getAdminSecuritySummary(authUser: AuthUserPayload) {
    this.assertAdmin(authUser);
    const now = Date.now();
    const recentSince = new Date(now - 24 * 60 * 60 * 1000);
    const adminActionsSince = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const adminActions = [
      "user.updated",
      "users.bulk_status_updated",
      "auth.user_sessions_revoked",
      "auth.users_sessions_revoked",
      "auth.user_session_revoked"
    ];
    const [
      totalUsers,
      activeUsers,
      activeSessions,
      pendingInvitations,
      recentAdminActions,
      highRiskEvents,
      unreviewedHighRiskEvents,
      recentEvents
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.refreshToken.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
      this.prisma.adminInvitation.count({
        where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }
      }),
      this.prisma.opsAuditLog.count({
        where: { action: { in: adminActions }, createdAt: { gte: adminActionsSince } }
      }),
      this.prisma.opsAuditLog.count({
        where: { severity: { in: ["warning", "critical"] }, createdAt: { gte: recentSince } }
      }),
      this.prisma.opsAuditLog.count({
        where: { reviewStatus: "unreviewed", severity: { in: ["warning", "critical"] } }
      }),
      this.prisma.opsAuditLog.findMany({
        where: { severity: { in: ["warning", "critical"] }, createdAt: { gte: recentSince } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, actor: true, action: true, severity: true, summary: true, createdAt: true }
      })
    ]);
    return {
      metrics: {
        totalUsers,
        activeUsers,
        activeSessions,
        pendingInvitations,
        recentAdminActions,
        highRiskEvents,
        unreviewedHighRiskEvents
      },
      recentEvents
    };
  }

  isValidAuthBridgeSecret(secret: string | undefined): boolean {
    return typeof secret === "string" && secret.length > 0 && secret === env.AUTH_BRIDGE_SECRET;
  }

  private normalizeAdminReason(reason: string): string {
    const normalized = reason.trim();
    if (normalized.length < 2 || normalized.length > 200) {
      throw new BadRequestException("관리자 작업 사유는 2자 이상 200자 이하로 입력해야 합니다.");
    }
    return normalized;
  }

  private normalizeSecurityReviewNote(note?: string): string | null {
    if (note === undefined) return null;
    const normalized = note.trim();
    if (normalized.length < 2 || normalized.length > 500) {
      throw new BadRequestException("검토 메모는 2자 이상 500자 이하로 입력해야 합니다.");
    }
    return normalized;
  }

  private async validateSecurityEventAssignee(assignee: string | null): Promise<void> {
    if (!assignee) return;
    const user = await this.prisma.user.findUnique({
      where: { email: assignee },
      select: { role: true, isActive: true }
    });
    if (!user || user.role !== "admin" || !user.isActive) {
      throw new BadRequestException("활성 상태의 관리자만 담당자로 지정할 수 있습니다.");
    }
  }

  async getNotificationPolicy(authUser: AuthUserPayload): Promise<AuthNotificationPolicy> {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.sub },
      select: { isActive: true, notificationPolicy: true }
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("유효하지 않은 사용자입니다.");
    }
    return this.normalizeNotificationPolicy(user.notificationPolicy);
  }

  async updateNotificationPolicy(
    authUser: AuthUserPayload,
    input: AuthNotificationPolicy
  ): Promise<AuthNotificationPolicy> {
    const normalized = this.normalizeNotificationPolicy(input);
    const user = await this.prisma.user.update({
      where: { id: authUser.sub },
      data: {
        notificationPolicy: normalized
      },
      select: {
        notificationPolicy: true
      }
    });
    return this.normalizeNotificationPolicy(user.notificationPolicy);
  }

  private toUserResponse(user: User): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      authProvider: user.authProvider,
      avatarColor: user.avatarColor,
      isActive: user.isActive
    };
  }

  private deriveNameFromEmail(email: string): string {
    const localPart = email.split("@")[0] ?? "";
    return localPart.trim().length > 0 ? localPart : "Ops User";
  }

  private async buildLoginResponse(
    user: User,
    displayName: string,
    refreshToken = this.createRefreshToken(),
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuthLoginResponse> {
    const userPayload: AuthUserPayload = {
      sub: user.id,
      email: user.email,
      name: displayName,
      role: user.role
    };
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + env.AUTH_REFRESH_TOKEN_TTL_SEC * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshExpiresAt,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent
      }
    });

    return {
      accessToken: signAccessToken(userPayload, env.AUTH_JWT_SECRET, env.AUTH_ACCESS_TOKEN_TTL_SEC),
      refreshToken,
      tokenType: "Bearer",
      expiresIn: env.AUTH_ACCESS_TOKEN_TTL_SEC,
      user: {
        id: user.id,
        email: user.email,
        name: displayName,
        role: user.role,
        authProvider: user.authProvider,
        avatarColor: user.avatarColor,
        isActive: user.isActive
      }
    };
  }

  private buildAttemptKey(email: string, ip?: string): string {
    const normalizedIp = ip?.trim() || "unknown";
    return `${email}::${normalizedIp}`;
  }

  private assertLoginAllowed(key: string): void {
    const now = Date.now();
    const state = this.loginAttempts.get(key);
    if (!state) return;
    if (state.blockedUntil > now) {
      throw new HttpException(
        "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    if (now - state.firstAttemptAt > env.AUTH_LOGIN_WINDOW_SEC * 1000) {
      this.loginAttempts.delete(key);
    }
  }

  private markLoginFailure(key: string): void {
    const now = Date.now();
    const current = this.loginAttempts.get(key);
    if (!current || now - current.firstAttemptAt > env.AUTH_LOGIN_WINDOW_SEC * 1000) {
      this.loginAttempts.set(key, { count: 1, firstAttemptAt: now, blockedUntil: 0 });
      return;
    }
    const nextCount = current.count + 1;
    const blockedUntil =
      nextCount >= env.AUTH_LOGIN_MAX_ATTEMPTS ? now + env.AUTH_LOGIN_BLOCK_SEC * 1000 : current.blockedUntil;
    this.loginAttempts.set(key, { ...current, count: nextCount, blockedUntil });
  }

  private clearLoginFailure(key: string): void {
    this.loginAttempts.delete(key);
  }

  private createRefreshToken(): string {
    return randomBytes(48).toString("base64url");
  }

  private hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("base64url");
  }

  private normalizeNotificationPolicy(value: unknown): AuthNotificationPolicy {
    if (!value || typeof value !== "object") return DEFAULT_NOTIFICATION_POLICY;
    const policy = value as Partial<AuthNotificationPolicy>;
    return {
      inAppEnabled: policy.inAppEnabled ?? DEFAULT_NOTIFICATION_POLICY.inAppEnabled,
      emailEnabled: policy.emailEnabled ?? DEFAULT_NOTIFICATION_POLICY.emailEnabled,
      slackEnabled: policy.slackEnabled ?? DEFAULT_NOTIFICATION_POLICY.slackEnabled,
      minLevel:
        policy.minLevel === "all" || policy.minLevel === "high" || policy.minLevel === "critical"
          ? policy.minLevel
          : DEFAULT_NOTIFICATION_POLICY.minLevel,
      quietHoursEnabled: policy.quietHoursEnabled ?? DEFAULT_NOTIFICATION_POLICY.quietHoursEnabled,
      quietFrom:
        typeof policy.quietFrom === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(policy.quietFrom)
          ? policy.quietFrom
          : DEFAULT_NOTIFICATION_POLICY.quietFrom,
      quietTo:
        typeof policy.quietTo === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(policy.quietTo)
          ? policy.quietTo
          : DEFAULT_NOTIFICATION_POLICY.quietTo
    };
  }

  private async writeAuthAudit(
    actor: string,
    action: string,
    targetId: string | null,
    summary: string,
    severity: string = "info",
    metadata?: Record<string, string | number | undefined>
  ): Promise<void> {
    await writeOpsAuditLog(this.prisma, this.logger, {
      actor,
      action,
      targetType: "Auth",
      targetId,
      severity,
      summary,
      metadata: Object.fromEntries(Object.entries(metadata ?? {}).filter(([, value]) => value !== undefined))
    });
  }
}
