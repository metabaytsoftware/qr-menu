import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { PrismaExceptionFilter } from './utils/prisma-exception.filter';

async function bootstrap() {
  console.log('[API] Uygulama başlatılıyor...');
  console.log('[API] Veritabanı URL kontrolü:', process.env.DATABASE_URL ? 'Tanımlı' : 'Tanımsız');
  
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => {
      const messages = errors.map((err) => {
        return Object.values(err.constraints || {}).join(', ');
      });
      return new BadRequestException(messages);
    }
  }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Request logging middleware for debugging
  app.use((req: any, _res: any, next: any) => {
    console.log(`[API] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
  });
  
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port} (API)`);
}
bootstrap();
