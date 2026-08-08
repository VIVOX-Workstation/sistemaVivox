import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import request = require('supertest');

async function run() {
  console.log("Starting server...");
  const app = await NestFactory.create(AppModule);
  await app.init();
  const server = app.getHttpServer();

  console.log("Testing correct email, wrong password...");
  const res1 = await request(server)
    .post('/auth/login')
    .send({ email: 'kelson@vivox.com.br', senha: 'wrong_password' });
  
  console.log('Status wrong password:', res1.status);
  console.log('Body wrong password:', res1.body);

  console.log("Testing nonexistent email...");
  const res2 = await request(server)
    .post('/auth/login')
    .send({ email: 'nonexistent@vivox.com.br', senha: '123' });
  
  console.log('Status nonexistent email:', res2.status);
  console.log('Body nonexistent email:', res2.body);

  await app.close();
}

run();
