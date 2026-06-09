import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaModule } from "./integration/db/prisma.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { HealthController } from "./modules/health/health.controller.js";
import { OpsModule } from "./modules/ops/ops.module.js";

const appDir = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(appDir, "..", "schema.gql");

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: schemaPath,
      sortSchema: true,
      context: ({ req }: { req: unknown }) => ({ req }),
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
