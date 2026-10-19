import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ModuloSistema, Role } from '@prisma/client';
import { createHash } from 'node:crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { SalvarPropostaDto } from './proposta.dto';
import { PropostasController } from './propostas.controller';
import { PropostasService } from './propostas.service';

describe('Propostas: documento, validação e compartilhamento', () => {
  const prisma = {
    cliente: { findUnique: jest.fn() },
    proposta: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const service = new PropostasService(prisma as unknown as PrismaService);
  const documento: SalvarPropostaDto = {
    titulo: 'Plataforma',
    destinatario: 'Cliente',
    apresentacao: 'Cursos em vídeo',
    corDestaque: '#91672b',
    validade: '2026-11-02',
    secoes: [{ titulo: 'Investimento', texto: '**R$ 10.000,00**' }],
  };
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.cliente.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.proposta.findFirst.mockResolvedValue({ id: 'p1' });
  });

  it('cria o documento e persiste todos os campos editáveis', async () => {
    await service.criar('c1', documento);
    expect(prisma.proposta.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          ...documento,
          clienteId: 'c1',
          validade: new Date('2026-11-02T00:00:00Z'),
        },
      }),
    );
  });
  it('não altera uma proposta de outro cliente', async () => {
    prisma.proposta.findFirst.mockResolvedValue(null);
    await expect(
      service.editar('outro-cliente', 'p1', documento),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.proposta.update).not.toHaveBeenCalled();
  });
  it('preserva o HTML editável e os estilos estruturais do modelo ao salvar', async () => {
    const html =
      '<div class="features"><article class="feature"><h3>Escopo</h3><p>Valor editado</p></article></div>';
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const dto = await pipe.transform(
      { ...documento, secoes: [{ titulo: 'Escopo', texto: '', html }] },
      { type: 'body', metatype: SalvarPropostaDto },
    );
    await service.criar('c1', dto);
    expect(prisma.proposta.create.mock.calls[0][0].data.secoes[0].html).toBe(
      html,
    );
  });
  it('gera segredo aleatório e persiste somente o hash; novo link tem outro segredo', async () => {
    const a = await service.compartilhar('c1', 'p1');
    const b = await service.compartilhar('c1', 'p1');
    expect(a.token).toMatch(/^[a-f0-9]{64}$/);
    expect(b.token).not.toBe(a.token);
    expect(prisma.proposta.update.mock.calls[0][0].data.linkHash).toBe(
      createHash('sha256').update(a.token).digest('hex'),
    );
  });
  it('busca documento público com allowlist sem relação ou segredo do cliente', async () => {
    prisma.proposta.findUnique.mockResolvedValue(documento);
    await service.publica('a'.repeat(64));
    const consulta = prisma.proposta.findUnique.mock.calls[0][0];
    expect(consulta.where.linkHash).toBe(
      createHash('sha256').update('a'.repeat(64)).digest('hex'),
    );
    expect(consulta.select).not.toHaveProperty('cliente');
    expect(consulta.select).not.toHaveProperty('linkHash');
    expect(consulta.select).not.toHaveProperty('clienteId');
    expect(consulta.select.createdAt).toBe(true);
  });
  it('revoga link e rejeita links inexistentes ou inválidos', async () => {
    await service.revogar('c1', 'p1');
    expect(prisma.proposta.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { linkHash: null } }),
    );
    prisma.proposta.findUnique.mockResolvedValue(null);
    await expect(service.publica('b'.repeat(64))).rejects.toThrow(
      NotFoundException,
    );
    prisma.proposta.findUnique.mockClear();
    await expect(service.publica('p1')).rejects.toThrow(NotFoundException);
    expect(prisma.proposta.findUnique).not.toHaveBeenCalled();
  });
  it('whitelist preserva seções e remove campos internos inclusive dentro de seções', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const dto = await pipe.transform(
      {
        ...documento,
        linkHash: 'injetado',
        secoes: [{ titulo: 'Escopo', texto: '', token: 'injetado' }],
      },
      { type: 'body', metatype: SalvarPropostaDto },
    );
    expect(dto).not.toHaveProperty('linkHash');
    expect(dto.secoes[0]).not.toHaveProperty('token');
    expect(dto.secoes[0]).toEqual({ titulo: 'Escopo', texto: '' });
  });
  it.each([
    { validade: '2026-02-30' },
    { validade: '2026-11-02T00:00:00Z' },
    { corDestaque: 'url(javascript:alert(1))' },
    { titulo: '   ' },
    { secoes: [{ titulo: 'Escopo' }] },
    { secoes: [{ titulo: 'Escopo', texto: 123 }] },
    { secoes: Array.from({ length: 51 }, () => ({ titulo: 'x', texto: '' })) },
  ])('rejeita documento inválido: %j', async (alteracao) => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    await expect(
      pipe.transform(
        { ...documento, ...alteracao },
        { type: 'body', metatype: SalvarPropostaDto },
      ),
    ).rejects.toThrow();
  });
});

describe('Permissões das propostas pelo guard real', () => {
  const prisma = { user: { findUnique: jest.fn() } };
  const guard = new JwtAuthGuard(
    new Reflector(),
    prisma as unknown as PrismaService,
  );
  afterEach(() => jest.restoreAllMocks());
  it.each([
    [Role.ADMIN, [], true],
    [Role.COLABORADOR, [ModuloSistema.CLIENTES], true],
    [Role.COLABORADOR, [ModuloSistema.GP], false],
    [Role.COLABORADOR, [], false],
    [Role.CLIENTE, [ModuloSistema.CLIENTES], false],
  ])('papel %s e módulos %j → acesso %s', async (role, modulos, permitido) => {
    jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockResolvedValue(true);
    prisma.user.findUnique.mockResolvedValue({ role, modulos });
    const context = {
      getClass: () => PropostasController,
      getHandler: () => PropostasController.prototype.criar,
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', user: { userId: 'u1', role } }),
      }),
    } as unknown as ExecutionContext;
    if (permitido) expect(await guard.canActivate(context)).toBe(true);
    else
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
  });
});
