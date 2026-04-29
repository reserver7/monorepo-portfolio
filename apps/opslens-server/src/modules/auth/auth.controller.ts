import { Body, Controller, Get, Headers, Patch, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import {
  AuthChangePasswordDto,
  AuthForgotPasswordDto,
  AuthLoginDto,
  AuthOAuthLoginDto,
  AuthSignupDto,
  AuthUpdateProfileDto
} from "./auth.dto.js";
import { OpsAuthGuard, type AuthenticatedRequest } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() input: AuthLoginDto) {
    return this.authService.login(input.email, input.password);
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

  @UseGuards(OpsAuthGuard)
  @Get("me")
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.authUser!);
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
  logout() {
    return { success: true };
  }
}
