import "dotenv/config";
import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { HttpMetricsInterceptor } from "./common/interceptors/http-metrics.interceptor.js";
import { env } from "./config/env.js";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true
  });
  app.useGlobalInterceptors(new HttpMetricsInterceptor());

  await app.listen(env.PORT);

  const logger = new Logger("Bootstrap");
  logger.log(`[opslens-server] running on http://localhost:${env.PORT}`);
}

bootstrap().catch((error) => {
  const logger = new Logger("Bootstrap");
  if (error instanceof Error) {
    logger.error(error.message, error.stack);
  } else {
    logger.error(String(error));
  }
  process.exit(1);
});
