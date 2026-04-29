import { IsEmail, IsHexColor, IsOptional, IsString, MinLength } from "class-validator";

export class AuthLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
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
