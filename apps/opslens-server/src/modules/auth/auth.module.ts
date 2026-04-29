import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { OpsAuthGuard } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";

@Module({
  controllers: [AuthController],
  providers: [AuthService, OpsAuthGuard],
  exports: [AuthService, OpsAuthGuard]
})
export class AuthModule {}
