import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
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
  AuthDeleteAccountDto,
  AuthChangeEmailDto,
  AuthAdminUpdateUserDto,
  AuthAdminBulkUserStatusDto,
  AuthAdminBulkUserSessionsDto,
  AuthAdminActionReasonDto,
  AuthAcceptInvitationDto,
  AuthForgotPasswordDto,
  AuthLoginDto,
  AuthInviteUserDto,
  AuthOAuthLoginDto,
  AuthRefreshDto,
  AuthResendVerificationDto,
  AuthResetPasswordDto,
  AuthSignupDto,
  AuthTwoFactorDto,
  AuthUpdateNotificationPolicyDto,
  AuthUpdateProfileDto,
  AuthSecurityEventReviewDto,
  AuthBulkSecurityEventReviewDto
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
  users(
    @Req() request: AuthenticatedRequest,
    @Query("query") query?: string,
    @Query("role") role?: string,
    @Query("isActive") isActive?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.authService.listUsers(request.authUser!, {
      query,
      role: role === "admin" || role === "operator" || role === "viewer" ? role : undefined,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  }

  @UseGuards(OpsAuthGuard)
  @Get("security-summary")
  securitySummary(@Req() request: AuthenticatedRequest) {
    return this.authService.getAdminSecuritySummary(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Get("security-events")
  securityEvents(
    @Req() request: AuthenticatedRequest,
    @Query("reviewStatus") reviewStatus?: string,
    @Query("severity") severity?: string,
    @Query("assignee") assignee?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.authService.listSecurityEvents(request.authUser!, {
      reviewStatus:
        reviewStatus === "unreviewed" || reviewStatus === "in_review" || reviewStatus === "resolved"
          ? reviewStatus
          : undefined,
      severity,
      assignee,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  }

  @UseGuards(OpsAuthGuard)
  @Get("security-notifications")
  securityNotifications(@Req() request: AuthenticatedRequest) {
    return this.authService.listSecurityNotifications(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Patch("security-notifications/:notificationId/read")
  markSecurityNotificationRead(
    @Req() request: AuthenticatedRequest,
    @Param("notificationId") notificationId: string
  ) {
    return this.authService.markSecurityNotificationRead(request.authUser!, notificationId);
  }

  @UseGuards(OpsAuthGuard)
  @Patch("security-events/:eventId/review")
  reviewSecurityEvent(
    @Req() request: AuthenticatedRequest,
    @Param("eventId") eventId: string,
    @Body() input: AuthSecurityEventReviewDto
  ) {
    return this.authService.reviewSecurityEvent(request.authUser!, eventId, input);
  }

  @UseGuards(OpsAuthGuard)
  @Post("security-events/bulk-review")
  bulkReviewSecurityEvents(
    @Req() request: AuthenticatedRequest,
    @Body() input: AuthBulkSecurityEventReviewDto
  ) {
    return this.authService.bulkReviewSecurityEvents(request.authUser!, input.eventIds, input);
  }

  @UseGuards(OpsAuthGuard)
  @Get("security-events/:eventId")
  securityEventDetails(@Req() request: AuthenticatedRequest, @Param("eventId") eventId: string) {
    return this.authService.getSecurityEventDetails(request.authUser!, eventId);
  }

  @UseGuards(OpsAuthGuard)
  @Get("invitations")
  invitations(@Req() request: AuthenticatedRequest) {
    return this.authService.listInvitations(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Post("invitations")
  invite(@Req() request: AuthenticatedRequest, @Body() input: AuthInviteUserDto) {
    return this.authService.inviteUser(request.authUser!, input);
  }

  @UseGuards(OpsAuthGuard)
  @Post("invitations/:invitationId/resend")
  resendInvitation(@Req() request: AuthenticatedRequest, @Param("invitationId") invitationId: string) {
    return this.authService.resendInvitation(request.authUser!, invitationId);
  }

  @UseGuards(OpsAuthGuard)
  @Delete("invitations/:invitationId")
  revokeInvitation(@Req() request: AuthenticatedRequest, @Param("invitationId") invitationId: string) {
    return this.authService.revokeInvitation(request.authUser!, invitationId);
  }

  @Get("invitations/resolve")
  resolveInvitation(@Query("token") token: string) {
    return this.authService.resolveInvitation(token);
  }

  @Post("invitations/accept")
  acceptInvitation(@Body() input: AuthAcceptInvitationDto) {
    return this.authService.acceptInvitation(input);
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
  @Get("users/:userId/details")
  userDetails(@Req() request: AuthenticatedRequest, @Param("userId") userId: string) {
    return this.authService.getUserDetails(request.authUser!, userId);
  }

  @UseGuards(OpsAuthGuard)
  @Get("users/:userId/activity")
  userActivity(
    @Req() request: AuthenticatedRequest,
    @Param("userId") userId: string,
    @Query("action") action?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.authService.listUserActivity(request.authUser!, userId, {
      action,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  }

  @UseGuards(OpsAuthGuard)
  @Get("users/:userId/activity/export")
  @Header("Content-Type", "text/csv; charset=utf-8")
  exportUserActivity(
    @Req() request: AuthenticatedRequest,
    @Param("userId") userId: string,
    @Query("action") action?: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.authService.exportUserActivityCsv(request.authUser!, userId, {
      action,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined
    });
  }

  @UseGuards(OpsAuthGuard)
  @Post("users/:userId/logout-all")
  revokeUserSessions(
    @Req() request: AuthenticatedRequest,
    @Param("userId") userId: string,
    @Body() input: AuthAdminActionReasonDto
  ) {
    return this.authService.revokeUserSessions(request.authUser!, userId, input.reason);
  }

  @UseGuards(OpsAuthGuard)
  @Post("users/:userId/sessions/:sessionId/logout")
  revokeUserSession(
    @Req() request: AuthenticatedRequest,
    @Param("userId") userId: string,
    @Param("sessionId") sessionId: string,
    @Body() input: AuthAdminActionReasonDto
  ) {
    return this.authService.revokeUserSession(request.authUser!, userId, sessionId, input.reason);
  }

  @UseGuards(OpsAuthGuard)
  @Post("users/bulk/status")
  bulkUpdateUsers(@Req() request: AuthenticatedRequest, @Body() input: AuthAdminBulkUserStatusDto) {
    return this.authService.bulkUpdateUsers(request.authUser!, input.userIds, {
      isActive: input.isActive,
      reason: input.reason
    });
  }

  @UseGuards(OpsAuthGuard)
  @Post("users/bulk/logout-all")
  bulkRevokeUserSessions(@Req() request: AuthenticatedRequest, @Body() input: AuthAdminBulkUserSessionsDto) {
    return this.authService.bulkRevokeUserSessions(request.authUser!, input.userIds, input.reason);
  }

  @UseGuards(OpsAuthGuard)
  @Patch("profile")
  updateProfile(@Req() request: AuthenticatedRequest, @Body() input: AuthUpdateProfileDto) {
    return this.authService.updateProfile(request.authUser!, input);
  }

  @UseGuards(OpsAuthGuard)
  @Patch("password")
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Headers("x-opslens-refresh-token") currentRefreshToken: string | undefined,
    @Body() input: AuthChangePasswordDto
  ) {
    return this.authService.changePassword(request.authUser!, input, currentRefreshToken);
  }

  @UseGuards(OpsAuthGuard)
  @Delete("account")
  deleteAccount(@Req() request: AuthenticatedRequest, @Body() input: AuthDeleteAccountDto) {
    return this.authService.deleteAccount(request.authUser!, input.currentPassword);
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
  @Delete("two-factor/setup")
  cancelTwoFactorSetup(@Req() request: AuthenticatedRequest) {
    return this.authService.cancelTwoFactorSetup(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Post("two-factor/recovery-codes")
  regenerateRecoveryCodes(@Req() request: AuthenticatedRequest, @Body() input: AuthTwoFactorDto) {
    return this.authService.regenerateRecoveryCodes(request.authUser!, input.code);
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
