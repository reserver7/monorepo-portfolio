import {
  IsBoolean,
  IsArray,
  IsEmail,
  IsHexColor,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMinSize,
  Matches,
  MinLength
} from "class-validator";

export class AuthLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @Matches(/^(?:\d{6}|[A-Za-z0-9]{10})$/)
  otp?: string;
}

export class AuthTwoFactorDto {
  @Matches(/^\d{6}$/)
  code!: string;
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

  @IsOptional()
  @IsString()
  next?: string;
}

export class AuthResendVerificationDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  next?: string;
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

export class AuthResetPasswordDto {
  @IsString()
  @MinLength(32)
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class AuthChangeEmailDto {
  @IsEmail()
  newEmail!: string;
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

export class AuthDeleteAccountDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string;
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

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  reason!: string;
}

export class AuthAdminBulkUserStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds!: string[];

  @IsBoolean()
  isActive!: boolean;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  reason!: string;
}

export class AuthAdminBulkUserSessionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds!: string[];

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  reason!: string;
}

export class AuthAdminActionReasonDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  reason!: string;
}

export class AuthInviteUserDto {
  @IsEmail()
  email!: string;

  @IsIn(["admin", "operator", "viewer"])
  role!: "admin" | "operator" | "viewer";
}

export class AuthAcceptInvitationDto {
  @IsString()
  @MinLength(32)
  token!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class AuthSecurityEventReviewDto {
  @IsIn(["unreviewed", "in_review", "resolved"])
  reviewStatus!: "unreviewed" | "in_review" | "resolved";

  @IsOptional()
  @IsEmail()
  assignee?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reviewNote?: string;
}

export class AuthBulkSecurityEventReviewDto extends AuthSecurityEventReviewDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  eventIds!: string[];
}
