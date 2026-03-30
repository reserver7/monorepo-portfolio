import { Module } from "@nestjs/common";
import { AiModule } from "../ai/index.js";
import { OpsResolver } from "./ops.resolver.js";
import { OpsService } from "./ops.service.js";

@Module({
  imports: [AiModule],
  providers: [OpsResolver, OpsService]
})
export class OpsModule {}
