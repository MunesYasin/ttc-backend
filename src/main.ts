// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with proper configuration for browsers
  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'https://timecraft-flow.vercel.app',
        'http://localhost:8080',
        'http://localhost:3000',
        'http://localhost:5173',
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'api',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
      'User-Agent',
      'Accept',
      'Referer',
      'Origin',
    ],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Set global prefix for all API routes
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Cookie parser middleware
  app.use(cookieParser());

  // Use PORT from environment or default to 3000
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);
  console.log(`📡 API available at: http://localhost:${port}/api`);
}

void bootstrap();
