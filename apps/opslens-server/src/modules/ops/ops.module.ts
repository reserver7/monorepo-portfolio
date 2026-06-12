import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { OpsController } from "./ops.controller.js";
import { OpsAlertService } from "./ops-alert.service.js";
import { OpsDashboardService } from "./ops-dashboard.service.js";
import { OpsDeploymentService } from "./ops-deployment.service.js";
import { OpsIssueService } from "./ops-issue.service.js";
import { OpsLogAnalysisService } from "./ops-log-analysis.service.js";
import { OpsQaService } from "./ops-qa.service.js";
import { OpsReportService } from "./ops-report.service.js";
import { OpsSettingsService } from "./ops-settings.service.js";
import { OpsResolver } from "./ops.resolver.js";
import { OpsService } from "./ops.service.js";

@Module({
  imports: [AiModule, AuthModule],
  controllers: [OpsController],
  providers: [
    OpsResolver,
    OpsService,
    OpsAlertService,
    OpsDashboardService,
    OpsDeploymentService,
    OpsIssueService,
    OpsLogAnalysisService,
    OpsQaService,
    OpsReportService,
    OpsSettingsService
  ]
})
export class OpsModule {}
