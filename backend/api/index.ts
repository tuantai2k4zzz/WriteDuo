import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express, { Express, Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import * as dns from 'dns';

// Fix DNS resolution for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore if restricted
}

const server: Express = express();
let isInitialized = false;

async function bootstrap() {
  if (!isInitialized) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.enableCors({
      origin: true,
      credentials: true,
    });

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );

    await app.init();
    isInitialized = true;
  }
  return server;
}

export default async function handler(req: Request, res: Response) {
  await bootstrap();
  server(req, res);
}
