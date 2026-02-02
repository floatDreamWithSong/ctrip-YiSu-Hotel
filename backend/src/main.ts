import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import FiltersChain from './filters/app-exception.filter';
import { Configurations } from './config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  for(const filter of FiltersChain) {
    app.useGlobalFilters(filter);
  }

  app.enableCors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    preflightContinue: false,
  });
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.listen(process.env.PORT);
}

void bootstrap();
