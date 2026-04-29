import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
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
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUserResponse;
};

@Injectable()
export class AuthService {
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

  async login(email: string, password: string): Promise<AuthLoginResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    if (!normalizedEmail || normalizedPassword.length < 8) {
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    if (!verifyPassword(normalizedPassword, user.passwordHash)) {
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

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
    return { success: true };
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

  isValidAuthBridgeSecret(secret: string | undefined): boolean {
    return typeof secret === "string" && secret.length > 0 && secret === env.AUTH_BRIDGE_SECRET;
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

  private buildLoginResponse(user: User, displayName: string): AuthLoginResponse {
    const userPayload: AuthUserPayload = {
      sub: user.id,
      email: user.email,
      name: displayName,
      role: user.role
    };

    return {
      accessToken: signAccessToken(userPayload, env.AUTH_JWT_SECRET, env.AUTH_ACCESS_TOKEN_TTL_SEC),
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
}
