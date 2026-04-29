import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthService } from "./auth.service.js";
import type { AuthUserPayload } from "./auth.token.js";

export type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  authUser?: AuthUserPayload;
};

@Injectable()
export class OpsAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = this.resolveRequest(context);
    if (!request) {
      return false;
    }

    request.authUser = this.authService.verifyBearerToken(request.headers.authorization);
    return true;
  }

  private resolveRequest(context: ExecutionContext): AuthenticatedRequest | null {
    const type = context.getType<string>();
    if (type === "http") {
      return context.switchToHttp().getRequest<AuthenticatedRequest>();
    }
    if (type === "graphql") {
      const gqlContext = GqlExecutionContext.create(context).getContext<{ req?: AuthenticatedRequest }>();
      return gqlContext.req ?? null;
    }
    return null;
  }
}
