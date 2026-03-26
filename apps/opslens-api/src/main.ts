import "dotenv/config";
import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { env } from "./common/config/index.js";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true
  });

  await app.listen(env.PORT);

  const logger = new Logger("Bootstrap");
  logger.log(`[opslens-api] running on http://localhost:${env.PORT}`);
}

bootstrap().catch((error) => {
  const logger = new Logger("Bootstrap");
  logger.error(error);
  process.exit(1);
});
