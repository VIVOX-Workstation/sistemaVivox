import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ModuloSistema, Role } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('Users module permissions endpoint (HTTP)', () => {
  let app: INestApplication;
  const secret = 'users-module-test-secret';
  const originalSecret = process.env.JWT_SECRET;
  const service = { updateModulos: jest.fn(async (id, modulos) => ({ id, modulos })) };
  const prisma = { user: { findUnique: jest.fn() } };
  const token = (role: Role) => sign({ sub: 'admin-id', role }, secret);
  beforeAll(async () => {
    process.env.JWT_SECRET = secret;
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [JwtStrategy, { provide: UsersService, useValue: service }, { provide: PrismaService, useValue: prisma }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app?.close();
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('allows ADMIN to set an empty array, with no module checks', async () => {
    await request(app.getHttpServer()).patch('/users/u1/modulos').auth(token(Role.ADMIN), { type: 'bearer' }).send({ modulos: [] }).expect(200, { id: 'u1', modulos: [] });
    expect(service.updateModulos).toHaveBeenCalledWith('u1', []);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
  it.each([Role.COLABORADOR, Role.CLIENTE])('rejects %s with 403', async (role) => {
    await request(app.getHttpServer()).patch('/users/u1/modulos').auth(token(role), { type: 'bearer' }).send({ modulos: [ModuloSistema.GP] }).expect(403);
    expect(service.updateModulos).not.toHaveBeenCalled();
  });
  it.each([{}, { modulos: ['INVALID'] }, { modulos: [ModuloSistema.GP, ModuloSistema.GP] }])('rejects invalid input %j', async (body) => {
    await request(app.getHttpServer()).patch('/users/u1/modulos').auth(token(Role.ADMIN), { type: 'bearer' }).send(body).expect(400);
    expect(service.updateModulos).not.toHaveBeenCalled();
  });
});
