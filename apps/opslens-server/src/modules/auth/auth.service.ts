import {
  ConflictException,
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

type AuthUserResponse = {
  id: string;
  email: string;
  name: string;
  role: User["role"];
  authProvider: User["authProvider"];
  avatarColor: User["avatarColor"];
  isActive: boolean;
};

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

  async listUsers(actor: AuthUserPayload): Promise<AuthUserResponse[]> {
    this.assertAdmin(actor);
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return users.map((user) => this.toAuthUserResponse(user));
  }

  async updateUser(
    actor: AuthUserPayload,
    userId: string,
    input: { role?: User["role"]; isActive?: boolean }
  ): Promise<AuthUserResponse> {
    this.assertAdmin(actor);
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
      beforeValue: { role: target.role, isActive: target.isActive },
      afterValue: { role: updated.role, isActive: updated.isActive }
    });
    return this.toAuthUserResponse(updated);
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
    input: { currentPassword: string; newPassword: string }
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(newPassword)
      }
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await this.writeAuthAudit(user.email, "auth.password_changed", user.id, "비밀번호 변경");
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
      data: { twoFactorSecret: encryptTwoFactorSecret(secret) }
    });
    return { enabled: false as const, secret, otpauthUri: createTwoFactorUri(secret, user.email) };
  }

  async confirmTwoFactor(authUser: AuthUserPayload, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: authUser.sub } });
    if (!user?.twoFactorSecret || user.twoFactorEnabled)
      throw new ConflictException("2FA 설정을 시작해 주세요.");
    if (!verifyTotpCode(decryptTwoFactorSecret(user.twoFactorSecret), code)) {
      throw new UnauthorizedException("2FA 코드가 올바르지 않습니다.");
    }
    const recoveryCodes = createRecoveryCodes();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true, twoFactorRecoveryCodes: serializeRecoveryCodes(recoveryCodes) }
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
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorRecoveryCodes: null }
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await this.writeAuthAudit(user.email, "auth.two_factor_disabled", user.id, "2FA 비활성화", "warning");
    return { enabled: false as const };
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

  isValidAuthBridgeSecret(secret: string | undefined): boolean {
    return typeof secret === "string" && secret.length > 0 && secret === env.AUTH_BRIDGE_SECRET;
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
