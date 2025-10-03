import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  const isProduction = configService.get('NODE_ENV') === 'production';
  
  const corsOptions = isProduction
    ? {
        origin: [
          'https://edoyenne.com',
          'https://www.edoyenne.com',
          'http://localhost:3000',
          
        ],
        credentials: true,
      }
    : {
        origin: [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:4200',
          'http://localhost:8080',
          'http://localhost:5173',
          'http://127.0.0.1:3000',
        ],
        credentials: true,
      };
  
  app.enableCors(corsOptions);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  await app.listen(configService.get('PORT') || 3001);
}
bootstrap();