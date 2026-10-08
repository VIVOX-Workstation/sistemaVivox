import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ModuloSistema, Role, TipoPublicacao } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { AcompanhamentoController } from '../acompanhamento/acompanhamento.controller';
import { AcompanhamentoService } from '../acompanhamento/acompanhamento.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

describe('Acompanhamento and portal endpoints (HTTP)', () => {
  let app: INestApplication;
  const secret = 'acompanhamento-test-secret';
  const originalSecret = process.env.JWT_SECRET;
  const service = {
    consultar: jest.fn(async (clienteId, filtro) => ({ clienteId, ...filtro })),
    meses: jest.fn(async () => [{ ano: 2025, mes: 1, total: 1 }]),
    criar: jest.fn(async () => ({ id: 'p1' })),
    atualizar: jest.fn(async () => ({ id: 'p1' })),
    remover: jest.fn(async () => ({ ok: true })),
  };
  const prisma = { user: { findUnique: jest.fn() } };
  const token = (role: Role, clienteId: string | null = 'token-client') => sign({ sub: 'u1', role, clienteId }, secret);
  beforeAll(async () => {
    process.env.JWT_SECRET = secret;
    const module = await Test.createTestingModule({
      controllers: [PortalController, AcompanhamentoController],
      providers: [JwtStrategy,
        { provide: PortalService, useValue: {} },
        { provide: AcompanhamentoService, useValue: service },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ role: Role.COLABORADOR, modulos: [ModuloSistema.ACOMPANHAMENTO] });
  });
  afterAll(async () => {
    await app?.close();
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('uses the token client for portal monthly data and month navigation, ignoring a query clientId', async () => {
    const jwt = token(Role.CLIENTE);
    await request(app.getHttpServer()).get('/portal/acompanhamento?ano=2025&mes=1&clienteId=other-client')
      .auth(jwt, { type: 'bearer' }).expect(200, { clienteId: 'token-client', ano: 2025, mes: 1 });
    expect(service.consultar).toHaveBeenCalledWith('token-client', expect.objectContaining({ ano: 2025, mes: 1 }));
    await request(app.getHttpServer()).get('/portal/acompanhamento/meses?clienteId=other-client')
      .auth(jwt, { type: 'bearer' }).expect(200, [{ ano: 2025, mes: 1, total: 1 }]);
    expect(service.meses).toHaveBeenCalledWith('token-client');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('requires a linked client and permits only CLIENTE in the portal', async () => {
    for (const jwt of [token(Role.ADMIN), token(Role.COLABORADOR), token(Role.CLIENTE, null)]) {
      await request(app.getHttpServer()).get('/portal/acompanhamento?ano=2025&mes=1').auth(jwt, { type: 'bearer' }).expect(403);
      await request(app.getHttpServer()).get('/portal/acompanhamento/meses').auth(jwt, { type: 'bearer' }).expect(403);
    }
    expect(service.consultar).not.toHaveBeenCalled();
    expect(service.meses).not.toHaveBeenCalled();
  });

  it('rejects portal mutation routes and CLIENTE access to internal mutation routes', async () => {
    await request(app.getHttpServer()).post('/portal/acompanhamento').auth(token(Role.CLIENTE), { type: 'bearer' }).send({}).expect(404);
    await request(app.getHttpServer()).post('/acompanhamento/clientes/other-client/publicacoes').auth(token(Role.CLIENTE), { type: 'bearer' }).send({}).expect(403);
    expect(service.criar).not.toHaveBeenCalled();
  });

  // Falta de ano/mês ou de inicio/fim é recusada no service (ver acompanhamento.service.spec); aqui só o formato
  it.each(['?ano=2025&mes=13', '?ano=2025&mes=0', '?inicio=2025-1-5&fim=2025-01-10', '?inicio=2025-01-05&fim=10/01/2025', '?ano=2025&mes=1&tipos=REELS,FOTO'])('validates period and type formats %s in both controllers', async (query) => {
    await request(app.getHttpServer()).get(`/portal/acompanhamento${query}`).auth(token(Role.CLIENTE), { type: 'bearer' }).expect(400);
    await request(app.getHttpServer()).get(`/acompanhamento/clientes/c1${query}`).auth(token(Role.COLABORADOR), { type: 'bearer' }).expect(400);
    expect(service.consultar).not.toHaveBeenCalled();
  });

  it('allows the internal module and returns its service contracts on all CRUD endpoints', async () => {
    const jwt = token(Role.COLABORADOR);
    await request(app.getHttpServer()).get('/acompanhamento/clientes/c1?ano=2025&mes=1').auth(jwt, { type: 'bearer' }).expect(200, { clienteId: 'c1', ano: 2025, mes: 1 });
    await request(app.getHttpServer()).get('/acompanhamento/clientes/c1/meses').auth(jwt, { type: 'bearer' }).expect(200);
    await request(app.getHttpServer()).post('/acompanhamento/clientes/c1/publicacoes').auth(jwt, { type: 'bearer' })
      .send({ dataPublicacao: '2025-01-01T03:00:00Z', tipo: TipoPublicacao.POST, origemDado: 'REPORTEI', clienteId: 'other-client' }).expect(201, { id: 'p1' });
    expect(service.criar).toHaveBeenCalledWith('c1', { dataPublicacao: '2025-01-01T03:00:00Z', tipo: TipoPublicacao.POST });
    await request(app.getHttpServer()).patch('/acompanhamento/publicacoes/p1').auth(jwt, { type: 'bearer' }).send({ assunto: null, curtidas: null }).expect(200, { id: 'p1' });
    expect(service.atualizar).toHaveBeenCalledWith('p1', { assunto: null, curtidas: null });
    await request(app.getHttpServer()).delete('/acompanhamento/publicacoes/p1').auth(jwt, { type: 'bearer' }).expect(200, { ok: true });
  });

  it('denies internal reads and writes without the ACOMPANHAMENTO module', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: Role.COLABORADOR, modulos: [ModuloSistema.CLIENTES] });
    await request(app.getHttpServer()).get('/acompanhamento/clientes/c1?ano=2025&mes=1').auth(token(Role.COLABORADOR), { type: 'bearer' }).expect(403);
    await request(app.getHttpServer()).delete('/acompanhamento/publicacoes/p1').auth(token(Role.COLABORADOR), { type: 'bearer' }).expect(403);
    expect(service.consultar).not.toHaveBeenCalled();
    expect(service.remover).not.toHaveBeenCalled();
  });
});
