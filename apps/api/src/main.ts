import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: false,
    }),
  );

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);

  console.log(`SOC SOAR API listening on http://localhost:${port}`);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
