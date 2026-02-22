import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import FiltersChain from './filters/app-exception.filter';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(...FiltersChain);
  const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',');
  console.log(corsAllowedOrigins);
  app.enableCors({
    origin: corsAllowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    preflightContinue: false,
  });
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.listen(process.env.PORT);
}

void bootstrap();
