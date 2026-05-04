import { ConflictException, HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import type { User } from "@prisma/client";
import { env } from "../../config/env.js";
import { PrismaService } from "../../integration/db/prisma.service.js";
import { AuthUserPayload, hashPassword, signAccessToken, verifyAccessToken, verifyPassword } from "./auth.token.js";

type AuthUserResponse = {
  id: string;
  email: string;
  name: string;
  role: User["role"];
  authProvider: User["authProvider"];
  avatarColor: User["avatarColor"];
};

export type AuthLoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUserResponse;
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
  private readonly loginAttempts = new Map<string, { count: number; firstAttemptAt: number; blockedUntil: number }>();

  constructor(private readonly prisma: PrismaService) {}

  async signup(input: { email: string; name: string; password: string }): Promise<AuthLoginResponse> {
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

    return this.buildLoginResponse(createdUser, createdUser.name);
  }

  async login(email: string, password: string, ip?: string): Promise<AuthLoginResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const attemptKey = this.buildAttemptKey(normalizedEmail, ip);
    this.assertLoginAllowed(attemptKey);
    if (!normalizedEmail || normalizedPassword.length < 8) {
      this.markLoginFailure(attemptKey);
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || !user.isActive) {
      this.markLoginFailure(attemptKey);
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    if (!verifyPassword(normalizedPassword, user.passwordHash)) {
      this.markLoginFailure(attemptKey);
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    this.clearLoginFailure(attemptKey);
    return this.buildLoginResponse(user, user.name);
  }

  async forgotPassword(email: string): Promise<{ success: true }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new UnauthorizedException("이메일이 올바르지 않습니다.");
    }

    await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }
    });

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
    return { success: true };
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

    const response = await this.buildLoginResponse(stored.user, stored.user.name);
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
          isActive: true
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
        authProvider: provider === "github" || provider === "google" ? provider : "local"
      }
    });

    return this.buildLoginResponse(refreshedUser, normalizedName.length > 0 ? normalizedName : refreshedUser.name);
  }

  async logout(authUser: AuthUserPayload, refreshToken?: string): Promise<{ success: true }> {
    await this.prisma.refreshToken.updateMany({
      where: refreshToken
        ? { tokenHash: this.hashRefreshToken(refreshToken), userId: authUser.sub, revokedAt: null }
        : { userId: authUser.sub, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    return { success: true };
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
      avatarColor: user.avatarColor
    };
  }

  private deriveNameFromEmail(email: string): string {
    const localPart = email.split("@")[0] ?? "";
    return localPart.trim().length > 0 ? localPart : "Ops User";
  }

  private async buildLoginResponse(
    user: User,
    displayName: string,
    refreshToken = this.createRefreshToken()
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
        expiresAt: refreshExpiresAt
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
        avatarColor: user.avatarColor
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
      throw new HttpException("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.", HttpStatus.TOO_MANY_REQUESTS);
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
}
