import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { AuthUserPayload } from "./auth.token.js";
import type { AuthenticatedRequest } from "./auth.guard.js";

export type OpsPermission = "read" | "operate" | "admin";
const OPS_PERMISSION_KEY = "opslens:permission";

export const RequireOpsPermission = (permission: OpsPermission) => SetMetadata(OPS_PERMISSION_KEY, permission);

const rolePermissions: Record<AuthUserPayload["role"], OpsPermission[]> = {
  admin: ["read", "operate", "admin"],
  operator: ["read", "operate"],
  viewer: ["read"]
};

export function assertOpsPermission(user: AuthUserPayload | undefined, permission: OpsPermission): void {
  if (!user || !rolePermissions[user.role].includes(permission)) {
    throw new ForbiddenException("이 작업을 수행할 권한이 없습니다.");
  }
}

@Injectable()
export class OpsPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<OpsPermission>(OPS_PERMISSION_KEY, [context.getHandler(), context.getClass()]);
    if (!permission) return true;
    const request = GqlExecutionContext.create(context).getContext<{ req?: AuthenticatedRequest }>().req;
    assertOpsPermission(request?.authUser, permission);
    return true;
  }
}
