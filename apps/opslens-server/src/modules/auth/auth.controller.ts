import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import {
  AuthChangePasswordDto,
  AuthChangeEmailDto,
  AuthAdminUpdateUserDto,
  AuthForgotPasswordDto,
  AuthLoginDto,
  AuthOAuthLoginDto,
  AuthRefreshDto,
  AuthResendVerificationDto,
  AuthResetPasswordDto,
  AuthSignupDto,
  AuthTwoFactorDto,
  AuthUpdateNotificationPolicyDto,
  AuthUpdateProfileDto
} from "./auth.dto.js";
import { OpsAuthGuard, type AuthenticatedRequest } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(
    @Body() input: AuthLoginDto,
    @Req() request: { ip?: string; headers?: Record<string, string | string[] | undefined> }
  ) {
    const userAgent = request.headers?.["user-agent"];
    return this.authService.login(
      input.email,
      input.password,
      request?.ip,
      Array.isArray(userAgent) ? userAgent[0] : userAgent,
      input.otp
    );
  }

  @Post("signup")
  signup(@Body() input: AuthSignupDto) {
    return this.authService.signup(input);
  }

  @Post("resend-verification")
  resendVerification(@Body() input: AuthResendVerificationDto) {
    return this.authService.resendEmailVerification(input);
  }

  @Get("verify-email")
  verifyEmail(@Query("token") token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post("forgot-password")
  forgotPassword(@Body() input: AuthForgotPasswordDto) {
    return this.authService.forgotPassword(input.email);
  }

  @Post("reset-password")
  resetPassword(@Body() input: AuthResetPasswordDto) {
    return this.authService.resetPassword(input);
  }

  @Post("oauth-login")
  oauthLogin(
    @Headers("x-opslens-auth-bridge") bridgeSecret: string | undefined,
    @Body() input: AuthOAuthLoginDto
  ) {
    if (!this.authService.isValidAuthBridgeSecret(bridgeSecret)) {
      throw new UnauthorizedException("OAuth 브리지 인증에 실패했습니다.");
    }
    return this.authService.oauthLogin(input);
  }

  @Post("refresh")
  refresh(@Body() input: AuthRefreshDto) {
    return this.authService.refresh(input.refreshToken);
  }

  @UseGuards(OpsAuthGuard)
  @Get("me")
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Get("users")
  users(@Req() request: AuthenticatedRequest) {
    return this.authService.listUsers(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Patch("users/:userId")
  updateUser(
    @Req() request: AuthenticatedRequest,
    @Param("userId") userId: string,
    @Body() input: AuthAdminUpdateUserDto
  ) {
    return this.authService.updateUser(request.authUser!, userId, input);
  }

  @UseGuards(OpsAuthGuard)
  @Patch("profile")
  updateProfile(@Req() request: AuthenticatedRequest, @Body() input: AuthUpdateProfileDto) {
    return this.authService.updateProfile(request.authUser!, input);
  }

  @UseGuards(OpsAuthGuard)
  @Patch("password")
  changePassword(@Req() request: AuthenticatedRequest, @Body() input: AuthChangePasswordDto) {
    return this.authService.changePassword(request.authUser!, input);
  }

  @UseGuards(OpsAuthGuard)
  @Post("change-email")
  changeEmail(@Req() request: AuthenticatedRequest, @Body() input: AuthChangeEmailDto) {
    return this.authService.requestEmailChange(request.authUser!, input.newEmail);
  }

  @Get("confirm-email-change")
  confirmEmailChange(@Query("token") token: string) {
    return this.authService.confirmEmailChange(token);
  }

  @UseGuards(OpsAuthGuard)
  @Get("two-factor")
  twoFactor(@Req() request: AuthenticatedRequest) {
    return this.authService.getTwoFactorStatus(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Post("two-factor")
  setupTwoFactor(@Req() request: AuthenticatedRequest, @Body() input?: AuthTwoFactorDto) {
    return input?.code
      ? this.authService.confirmTwoFactor(request.authUser!, input.code)
      : this.authService.setupTwoFactor(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Delete("two-factor")
  disableTwoFactor(@Req() request: AuthenticatedRequest, @Body() input: AuthTwoFactorDto) {
    return this.authService.disableTwoFactor(request.authUser!, input.code);
  }

  @UseGuards(OpsAuthGuard)
  @Post("logout")
  logout(@Req() request: AuthenticatedRequest, @Body() input?: Partial<AuthRefreshDto>) {
    return this.authService.logout(request.authUser!, input?.refreshToken);
  }

  @UseGuards(OpsAuthGuard)
  @Get("sessions")
  sessions(@Req() request: AuthenticatedRequest & { headers?: Record<string, string | undefined> }) {
    return this.authService.listSessions(request.authUser!, request.headers?.["x-opslens-refresh-token"]);
  }

  @UseGuards(OpsAuthGuard)
  @Get("security-activity")
  securityActivity(@Req() request: AuthenticatedRequest) {
    return this.authService.listSecurityActivity(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Delete("sessions/:sessionId")
  revokeSession(@Req() request: AuthenticatedRequest, @Param("sessionId") sessionId: string) {
    return this.authService.revokeSession(request.authUser!, sessionId);
  }

  @UseGuards(OpsAuthGuard)
  @Post("sessions/logout-all")
  revokeAllSessions(@Req() request: AuthenticatedRequest) {
    return this.authService.revokeAllSessions(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Get("notification-policy")
  notificationPolicy(@Req() request: AuthenticatedRequest) {
    return this.authService.getNotificationPolicy(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Patch("notification-policy")
  updateNotificationPolicy(
    @Req() request: AuthenticatedRequest,
    @Body() input: AuthUpdateNotificationPolicyDto
  ) {
    return this.authService.updateNotificationPolicy(request.authUser!, input);
  }
}
