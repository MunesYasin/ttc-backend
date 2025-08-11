import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with production-ready configuration
  app.enableCors({
    origin: [
      'http://localhost:8080',
      'https://timecraft-flow.vercel.app',
      process.env.FRONTEND_URL, // Add environment variable for frontend URL
    ].filter(Boolean), // Remove undefined values
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'api',
      'program',
      'lang',
    ],
  });

  // Global exception filter for better error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // Get port from environment or default to 3000
  const port = process.env.PORT || 3000;
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `🗄️ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`,
  );
  
  await app.listen(port);
}
void bootstrap();
