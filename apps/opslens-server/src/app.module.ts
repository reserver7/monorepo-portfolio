import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "node:path";
import { PrismaModule } from "./integration/db/prisma.module.js";
import { HealthController } from "./modules/health/health.controller.js";
import { OpsModule } from "./modules/ops/ops.module.js";

@Module({
  imports: [
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "apps/opslens-server/schema.gql"),
      sortSchema: true,
      // Apollo v4/Nest 조합에서 playground 옵션이 런타임 초기화 오류를 유발할 수 있어 비활성화
      // (필요 시 Apollo Sandbox를 사용)
      playground: false,
      introspection: true
    }),
    OpsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
