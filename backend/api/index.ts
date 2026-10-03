import 'reflect-metadata';
import * as dns from 'dns';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express, { Express, Request, Response } from 'express';
import { AppModule } from '../src/app.module';

// Configure DNS servers only on Windows to prevent querySrv ECONNREFUSED when resolving Atlas SRV records
// In Linux / AWS Lambda / Vercel containers, custom DNS override may break VPC DNS resolution.
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch {
    // Ignore if restricted
  }
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

    app.setGlobalPrefix('api/v1', {
      exclude: ['/'],
    });

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
  try {
    await bootstrap();
    server(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Function Startup Error:', err);
    res.status(500).json({
      statusCode: 500,
      error: 'Backend Serverless Error',
      message: err?.message || String(err),
      hint: 'Please check: 1) MONGODB_URI is set in Vercel Environment Variables. 2) MongoDB Atlas Network Access allows 0.0.0.0/0.',
    });
  }
}
