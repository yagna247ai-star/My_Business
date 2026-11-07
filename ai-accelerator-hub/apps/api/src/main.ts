import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: process.env.APP_URL || 'http://localhost:3000', credentials: true });
  const port = process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 3001;
  await app.listen(port);
  console.log(`🚀 API listening on http://localhost:${port}/api/v1`);
  console.log(`   Health: http://localhost:${port}/api/v1/health`);
}
bootstrap();
