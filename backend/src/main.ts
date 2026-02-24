import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import FiltersChain from './filters/app-exception.filter';

const DEFAULT_NATIVE_APP_ORIGINS = [
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(...FiltersChain);
  const envOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const corsAllowedOrigins = new Set([
    ...DEFAULT_NATIVE_APP_ORIGINS,
    ...envOrigins,
  ]);
  console.log('CORS_ALLOWED_ORIGINS:', Array.from(corsAllowedOrigins));

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without Origin (e.g. curl, server-to-server calls)
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, corsAllowedOrigins.has(origin));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    preflightContinue: false,
  });
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.listen(process.env.PORT);
}

void bootstrap();
