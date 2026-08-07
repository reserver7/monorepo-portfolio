import { IsBoolean, IsEmail, IsHexColor, IsIn, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class AuthLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class AuthRefreshDto {
  @IsString()
  @MinLength(32)
  refreshToken!: string;
}

export class AuthSignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class AuthOAuthLoginDto {
  @IsString()
  @MinLength(2)
  provider!: string;

  @IsString()
  @MinLength(2)
  providerAccountId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}

export class AuthForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class AuthUpdateProfileDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  avatarColor?: string;
}

export class AuthChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class AuthUpdateNotificationPolicyDto {
  @IsBoolean()
  inAppEnabled!: boolean;

  @IsBoolean()
  emailEnabled!: boolean;

  @IsBoolean()
  slackEnabled!: boolean;

  @IsIn(["all", "high", "critical"])
  minLevel!: "all" | "high" | "critical";

  @IsBoolean()
  quietHoursEnabled!: boolean;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  quietFrom!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  quietTo!: string;
}

export class AuthAdminUpdateUserDto {
  @IsOptional()
  @IsIn(["admin", "operator", "viewer"])
  role?: "admin" | "operator" | "viewer";

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
