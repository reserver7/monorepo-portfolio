import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { OpsController } from "./ops.controller.js";
import { OpsResolver } from "./ops.resolver.js";
import { OpsService } from "./ops.service.js";

@Module({
  imports: [AiModule, AuthModule],
  controllers: [OpsController],
  providers: [OpsResolver, OpsService]
})
export class OpsModule {}
