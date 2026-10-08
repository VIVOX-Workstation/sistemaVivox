import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrigemDado, Prisma, TipoPublicacao } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AcompanhamentoService, intervaloMensal, intervaloPersonalizado, paraDataPublicacao } from './acompanhamento.service';

describe('AcompanhamentoService', () => {
  const cliente = { id: 'c1', nomeFantasia: 'Cliente', logoUrl: null };
  const prisma = {
    cliente: { findUnique: jest.fn() },
    publicacao: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };
  const service = new AcompanhamentoService(prisma as unknown as PrismaService);
  const publication = (id: string, data: string, values = {}) => ({
    id, dataPublicacao: new Date(data), tipo: TipoPublicacao.POST, assunto: null, link: null,
    curtidas: null, comentarios: null, compartilhamentos: null, salvamentos: null,
    visualizacoes: null, alcance: null, origemDado: OrigemDado.MANUAL, ...values,
  });
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.cliente.findUnique.mockResolvedValue(cliente);
  });

  it('includes first and last instants of the local month and excludes adjacent months', async () => {
    const rows = [
      publication('previous', '2025-01-01T02:59:59.999Z'),
      publication('first', '2025-01-01T03:00:00.000Z'),
      publication('last', '2025-02-01T02:59:59.999Z'),
      publication('next', '2025-02-01T03:00:00.000Z'),
    ];
    prisma.publicacao.findMany.mockImplementation(({ where }) => rows.filter((p) =>
      p.dataPublicacao >= where.dataPublicacao.gte && p.dataPublicacao < where.dataPublicacao.lt));
    const result = await service.listar('c1', 2025, 1);
    expect(result.publicacoes.map((p) => p.id)).toEqual(['first', 'last']);
    expect(result.publicacoes[0].dataPublicacao).toBe('2025-01-01T03:00:00.000Z');
    expect(prisma.publicacao.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { clienteId: 'c1', dataPublicacao: { gte: new Date('2025-01-01T03:00:00Z'), lt: new Date('2025-02-01T03:00:00Z') } },
      orderBy: [{ dataPublicacao: 'asc' }, { createdAt: 'asc' }],
    }));
  });

  it('handles December rollover and leap-year February with the same UTC-3 offset', () => {
    expect(intervaloMensal(2025, 12)).toEqual({ inicio: new Date('2025-12-01T03:00:00Z'), fim: new Date('2026-01-01T03:00:00Z') });
    expect(intervaloMensal(2024, 2)).toEqual({ inicio: new Date('2024-02-01T03:00:00Z'), fim: new Date('2024-03-01T03:00:00Z') });
    expect(intervaloMensal(25, 1).inicio.getUTCFullYear()).toBe(25);
  });

  it('summarizes all five types and treats null metrics as zero', async () => {
    prisma.publicacao.findMany.mockResolvedValue([
      publication('p1', '2025-01-02T03:00:00Z', { curtidas: 3, compartilhamentos: 2 }),
      publication('p2', '2025-01-03T03:00:00Z', { tipo: TipoPublicacao.REELS, comentarios: 5, salvamentos: 4, visualizacoes: 50 }),
      publication('p3', '2025-01-04T03:00:00Z'),
    ]);
    const result = await service.listar('c1', 2025, 1);
    expect(result.resumo).toEqual({ total: 3,
      porTipo: { POST: 2, REELS: 1, CARROSSEL: 0, STORY: 0, VIDEO: 0 },
      totais: { curtidas: 3, comentarios: 5, compartilhamentos: 2, salvamentos: 4, visualizacoes: 50 },
    });
    expect(result.cliente).toEqual(cliente);
  });

  it('returns zero counts for an empty month', async () => {
    prisma.publicacao.findMany.mockResolvedValue([]);
    expect((await service.listar('c1', 2025, 1)).resumo).toEqual({ total: 0,
      porTipo: { POST: 0, REELS: 0, CARROSSEL: 0, STORY: 0, VIDEO: 0 },
      totais: { curtidas: 0, comentarios: 0, compartilhamentos: 0, salvamentos: 0, visualizacoes: 0 },
    });
  });

  it.each([0, 13, -1, 1.5, NaN])('rejects invalid month %s before querying', async (mes) => {
    await expect(service.listar('c1', 2025, mes)).rejects.toThrow(BadRequestException);
    expect(prisma.cliente.findUnique).not.toHaveBeenCalled();
  });

  it('groups navigation months by local time, newest first and scoped to the client', async () => {
    prisma.publicacao.findMany.mockResolvedValue([
      { dataPublicacao: new Date('2025-01-01T02:59:59Z') },
      { dataPublicacao: new Date('2025-01-01T03:00:00Z') },
      { dataPublicacao: new Date('2025-01-31T12:00:00Z') },
      { dataPublicacao: new Date('2026-01-01T03:00:00Z') },
    ]);
    expect(await service.meses('c1')).toEqual([{ ano: 2026, mes: 1, total: 1 }, { ano: 2025, mes: 1, total: 2 }, { ano: 2024, mes: 12, total: 1 }]);
    expect(prisma.publicacao.findMany).toHaveBeenCalledWith({ where: { clienteId: 'c1' }, select: { dataPublicacao: true } });
  });

  it('creates a MANUAL publication and returns the public contract', async () => {
    prisma.publicacao.create.mockResolvedValue(publication('p1', '2025-01-01T03:00:00Z'));
    const result = await service.criar('c1', { tipo: TipoPublicacao.POST, dataPublicacao: '2025-01-01T00:00:00-03:00', curtidas: null });
    expect(prisma.publicacao.create).toHaveBeenCalledWith(expect.objectContaining({ data: {
      clienteId: 'c1', tipo: TipoPublicacao.POST, dataPublicacao: new Date('2025-01-01T03:00:00Z'), curtidas: null, origemDado: OrigemDado.MANUAL,
    } }));
    expect(result).toEqual({ ...publication('p1', '2025-01-01T03:00:00Z'), dataPublicacao: '2025-01-01T03:00:00.000Z' });
  });

  it('updates partial fields and lets null clear nullable fields', async () => {
    prisma.publicacao.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.publicacao.update.mockResolvedValue(publication('p1', '2025-01-01T03:00:00Z'));
    await service.atualizar('p1', { assunto: null, link: null, curtidas: null });
    expect(prisma.publicacao.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'p1' }, data: { assunto: null, link: null, curtidas: null } }));
    await service.atualizar('p1', { dataPublicacao: '2025-02-01T03:00:00Z' });
    expect(prisma.publicacao.update.mock.calls[1][0].data.dataPublicacao).toEqual(new Date('2025-02-01T03:00:00Z'));
  });

  it('returns 404 for absent clients/publications', async () => {
    prisma.cliente.findUnique.mockResolvedValue(null);
    prisma.publicacao.findUnique.mockResolvedValue(null);
    await expect(service.listar('missing', 2025, 1)).rejects.toThrow(NotFoundException);
    await expect(service.meses('missing')).rejects.toThrow(NotFoundException);
    await expect(service.criar('missing', { tipo: TipoPublicacao.POST, dataPublicacao: '2025-01-01' })).rejects.toThrow(NotFoundException);
    await expect(service.atualizar('missing', {})).rejects.toThrow(NotFoundException);
    await expect(service.remover('missing')).rejects.toThrow(NotFoundException);
  });

  it('deletes publications and handles a simultaneous deletion as 404', async () => {
    prisma.publicacao.findUnique.mockResolvedValue({ id: 'p1' });
    expect(await service.remover('p1')).toEqual({ ok: true });
    const missing = new Prisma.PrismaClientKnownRequestError('missing', { code: 'P2025', clientVersion: '5.22.0' });
    prisma.publicacao.delete.mockRejectedValue(missing);
    prisma.publicacao.update.mockRejectedValue(missing);
    await expect(service.remover('p1')).rejects.toThrow(NotFoundException);
    await expect(service.atualizar('p1', {})).rejects.toThrow(NotFoundException);
  });
});

describe('paraDataPublicacao', () => {
  it('fixa data sem horário ao meio-dia de Brasília, sem pular de dia ou de mês', () => {
    const primeiro = paraDataPublicacao('2025-02-01');
    const ultimo = paraDataPublicacao('2025-01-31');
    expect(primeiro.toISOString()).toBe('2025-02-01T15:00:00.000Z');
    const fevereiro = intervaloMensal(2025, 2);
    expect(primeiro >= fevereiro.inicio && primeiro < fevereiro.fim).toBe(true);
    const janeiro = intervaloMensal(2025, 1);
    expect(ultimo >= janeiro.inicio && ultimo < janeiro.fim).toBe(true);
  });

  it('mantém data com horário explícito', () => {
    expect(paraDataPublicacao('2025-02-01T10:00:00.000Z').toISOString()).toBe('2025-02-01T10:00:00.000Z');
  });
});

describe('período personalizado e filtro de tipos', () => {
  const prisma = {
    cliente: { findUnique: jest.fn() },
    publicacao: { findMany: jest.fn() },
  };
  const service = new AcompanhamentoService(prisma as unknown as PrismaService);
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.cliente.findUnique.mockResolvedValue({ id: 'c1', nomeFantasia: 'Cliente', logoUrl: null });
    prisma.publicacao.findMany.mockResolvedValue([]);
  });

  it('usa dias inteiros de Brasília com fim inclusivo e devolve o período', async () => {
    const result = await service.consultar('c1', { inicio: '2025-01-16', fim: '2025-02-28' });
    expect(prisma.publicacao.findMany.mock.calls[0][0].where).toEqual({
      clienteId: 'c1',
      dataPublicacao: { gte: new Date('2025-01-16T03:00:00Z'), lt: new Date('2025-03-01T03:00:00Z') },
    });
    expect(result.periodo).toEqual({ inicio: '2025-01-16', fim: '2025-02-28' });
    expect(result.ano).toBeNull();
    expect(result.mes).toBeNull();
  });

  it('aceita período de um único dia', () => {
    expect(intervaloPersonalizado('2025-03-10', '2025-03-10')).toEqual({
      inicio: new Date('2025-03-10T03:00:00Z'), fim: new Date('2025-03-11T03:00:00Z'),
    });
  });

  it('devolve o período do mês quando consultado por ano/mês', async () => {
    expect((await service.consultar('c1', { ano: 2024, mes: 2 })).periodo).toEqual({ inicio: '2024-02-01', fim: '2024-02-29' });
  });

  it('filtra por tipos quando informados', async () => {
    await service.consultar('c1', { ano: 2025, mes: 1, tipos: [TipoPublicacao.REELS, TipoPublicacao.VIDEO] });
    expect(prisma.publicacao.findMany.mock.calls[0][0].where.tipo).toEqual({ in: [TipoPublicacao.REELS, TipoPublicacao.VIDEO] });
  });

  it.each([
    [{ inicio: '2025-02-10', fim: '2025-02-01' }],
    [{ inicio: '2025-02-30', fim: '2025-03-05' }],
    [{ inicio: '2025-01-01' }],
    [{ inicio: '2020-01-01', fim: '2025-01-01' }],
    [{}],
  ])('recusa período inválido %j sem consultar o banco', async (filtro) => {
    await expect(service.consultar('c1', filtro)).rejects.toThrow(BadRequestException);
    expect(prisma.cliente.findUnique).not.toHaveBeenCalled();
  });
});
