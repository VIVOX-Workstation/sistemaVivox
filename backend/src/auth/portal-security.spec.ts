import { Controller, Get, INestApplication, Req, UseGuards } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ModuloSistema, Role } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { PortalCliente } from './portal-cliente.decorator';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { PortalController } from '../portal/portal.controller';
import { PortalService } from '../portal/portal.service';
import { ClientesController } from '../clientes/clientes.controller';
import { ClientesService } from '../clientes/clientes.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { AcompanhamentoService } from '../acompanhamento/acompanhamento.service';
import { CronogramasService } from '../acompanhamento/cronogramas.service';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

@Controller('internal')
@UseGuards(JwtAuthGuard)
class InternalController {
  @Get()
  internal() { return { ok: true }; }

  @Get('portal-handler')
  @PortalCliente()
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENTE)
  portalHandler() { return { ok: true }; }
}

@Controller('portal')
@PortalCliente()
@Roles(Role.CLIENTE)
@UseGuards(JwtAuthGuard, RolesGuard)
class ClientController {
  @Get()
  portal(@Req() req: any) { return { clienteId: req.user.clienteId }; }
}

describe('Portal JWT isolation (HTTP)', () => {
  let app: INestApplication;
  const originalSecret = process.env.JWT_SECRET;
  const secret = 'portal-security-test-secret';
  const token = (role: Role) => sign({ sub: 'user-1', role, clienteId: 'client-1' }, secret);
  const portalService = { mapaServicos: jest.fn((clienteId) => ({ clienteId })), criarAcesso: jest.fn(() => ({ criadoAgora: true })) };

  beforeAll(async () => {
    process.env.JWT_SECRET = secret;
    const module = await Test.createTestingModule({
      controllers: [InternalController, ClientController, PortalController, ClientesController],
      providers: [
        JwtStrategy,
        { provide: PortalService, useValue: portalService },
        { provide: ClientesService, useValue: {} },
        { provide: StorageService, useValue: {} },
        { provide: AcompanhamentoService, useValue: {} },
        { provide: CronogramasService, useValue: {} },
        { provide: PrismaService, useValue: { user: { findUnique: jest.fn().mockResolvedValue({ role: Role.COLABORADOR, modulos: [ModuloSistema.CLIENTES] }) } } },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('returns 403 for CLIENTE on an internal route', async () => {
    await request(app.getHttpServer()).get('/internal').auth(token(Role.CLIENTE), { type: 'bearer' }).expect(403);
  });

  it.each([Role.ADMIN, Role.COLABORADOR])('allows %s internally and blocks it on the portal', async (role) => {
    await request(app.getHttpServer()).get('/internal').auth(token(role), { type: 'bearer' }).expect(200);
    await request(app.getHttpServer()).get('/portal').auth(token(role), { type: 'bearer' }).expect(403);
  });

  it('allows CLIENTE on class and handler markers and preserves token clienteId', async () => {
    await request(app.getHttpServer()).get('/portal').auth(token(Role.CLIENTE), { type: 'bearer' }).expect(200, { clienteId: 'client-1' });
    await request(app.getHttpServer()).get('/internal/portal-handler').auth(token(Role.CLIENTE), { type: 'bearer' }).expect(200);
  });

  it('requires a valid JWT', async () => {
    await request(app.getHttpServer()).get('/portal').expect(401);
    await request(app.getHttpServer()).get('/internal').auth('invalid', { type: 'bearer' }).expect(401);
  });

  it('blocks CLIENTE on the actual customer admin controller', async () => {
    await request(app.getHttpServer()).get('/clientes').auth(token(Role.CLIENTE), { type: 'bearer' }).expect(403);
    await request(app.getHttpServer()).post('/clientes/other-client/acesso-portal').auth(token(Role.CLIENTE), { type: 'bearer' }).expect(403);
  });

  it.each([Role.ADMIN, Role.COLABORADOR])('allows %s on access creation and blocks it on actual portal routes', async (role) => {
    await request(app.getHttpServer()).post('/clientes/client-1/acesso-portal').auth(token(role), { type: 'bearer' }).expect(201);
    await request(app.getHttpServer()).get('/portal/mapa-servicos').auth(token(role), { type: 'bearer' }).expect(403);
  });

  it('uses token clienteId regardless of query and rejects tokens without a client', async () => {
    await request(app.getHttpServer()).get('/portal/mapa-servicos?clienteId=other-client').auth(token(Role.CLIENTE), { type: 'bearer' }).expect(200, { clienteId: 'client-1' });
    const unlinked = sign({ sub: 'user-1', role: Role.CLIENTE }, secret);
    await request(app.getHttpServer()).get('/portal/mapa-servicos').auth(unlinked, { type: 'bearer' }).expect(403);
  });
});
