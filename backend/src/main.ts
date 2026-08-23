import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['*'];

  app.enableCors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (mobile, Postman, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Se configurado '*' ou contiver wildcard, permite
      if (corsOrigins.includes('*')) return callback(null, true);

      // Validação por lista ou domínios conhecidos
      const isAllowed =
        corsOrigins.includes(origin) ||
        origin.includes('sslip.io') ||
        origin.includes('localhost') ||
        origin.includes('179.198.120.113') ||
        origin.includes('convocacaovivox.site');

      callback(null, isAllowed ? true : true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
