import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "node:path";
import { PrismaModule } from "./platform/db/prisma.module.js";
import { HealthController } from "./features/health/health.controller.js";
import { OpsModule } from "./features/ops/ops.module.js";

@Module({
  imports: [
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "apps/opslens-api/schema.gql"),
      sortSchema: true,
      playground: true,
      introspection: true
    }),
    OpsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
