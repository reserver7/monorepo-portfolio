import { Body, Controller, Get, Headers, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import {
  AuthChangePasswordDto,
  AuthAdminUpdateUserDto,
  AuthForgotPasswordDto,
  AuthLoginDto,
  AuthOAuthLoginDto,
  AuthRefreshDto,
  AuthSignupDto,
  AuthUpdateNotificationPolicyDto,
  AuthUpdateProfileDto
} from "./auth.dto.js";
import { OpsAuthGuard, type AuthenticatedRequest } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() input: AuthLoginDto, @Req() request: { ip?: string }) {
    return this.authService.login(input.email, input.password, request?.ip);
  }

  @Post("signup")
  signup(@Body() input: AuthSignupDto) {
    return this.authService.signup(input);
  }

  @Post("forgot-password")
  forgotPassword(@Body() input: AuthForgotPasswordDto) {
    return this.authService.forgotPassword(input.email);
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
  @Post("logout")
  logout(@Req() request: AuthenticatedRequest, @Body() input?: Partial<AuthRefreshDto>) {
    return this.authService.logout(request.authUser!, input?.refreshToken);
  }

  @UseGuards(OpsAuthGuard)
  @Get("notification-policy")
  notificationPolicy(@Req() request: AuthenticatedRequest) {
    return this.authService.getNotificationPolicy(request.authUser!);
  }

  @UseGuards(OpsAuthGuard)
  @Patch("notification-policy")
  updateNotificationPolicy(@Req() request: AuthenticatedRequest, @Body() input: AuthUpdateNotificationPolicyDto) {
    return this.authService.updateNotificationPolicy(request.authUser!, input);
  }
}
