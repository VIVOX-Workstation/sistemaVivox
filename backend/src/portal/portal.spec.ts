import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma, Role, StatusInteresse, StatusServico, TipoServico } from '@prisma/client';
import { validate } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInteresseDto } from './dto/create-interesse.dto';
import { decryptPortalPassword, encryptPortalPassword, generatePortalPassword } from './portal-crypto';
import { PortalService } from './portal.service';

describe('Portal business rules', () => {
  const originalKey = process.env.PORTAL_ENCRYPTION_KEY;
  const prisma = {
    cliente: { findUnique: jest.fn() },
    user: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    servicoContratado: { findFirst: jest.fn() },
    interesseServico: { upsert: jest.fn(), findMany: jest.fn() },
  };
  const service = new PortalService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.PORTAL_ENCRYPTION_KEY = 'ab'.repeat(32);
  });
  afterAll(() => {
    if (originalKey === undefined) delete process.env.PORTAL_ENCRYPTION_KEY;
    else process.env.PORTAL_ENCRYPTION_KEY = originalKey;
  });

  it('encrypts with unique nonces, detects tampering, and reports missing keys', () => {
    const encrypted = encryptPortalPassword('secret');
    expect(decryptPortalPassword(encrypted)).toBe('secret');
    expect(encryptPortalPassword('secret')).not.toBe(encrypted);
    const parts = encrypted.split(':');
    parts[1] = '00'.repeat(16);
    expect(() => decryptPortalPassword(parts.join(':'))).toThrow(InternalServerErrorException);
    delete process.env.PORTAL_ENCRYPTION_KEY;
    expect(() => encryptPortalPassword('secret')).toThrow(/PORTAL_ENCRYPTION_KEY/);
    expect(generatePortalPassword()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789]{10}$/);
  });

  it('returns nine services, newest contract, contracted first and interest flags', async () => {
    const latest = new Date('2026-10-01');
    prisma.cliente.findUnique.mockResolvedValue({
      id: 'c1', nomeFantasia: 'Cliente', logoUrl: null,
      servicosContratados: [
        { tipoServico: TipoServico.VIDEO, status: StatusServico.ATIVO, dataContratacao: latest },
        { tipoServico: TipoServico.VIDEO, status: StatusServico.PAUSADO, dataContratacao: new Date('2025-01-01') },
      ],
      interessesServico: [{ tipoServico: TipoServico.APP }],
    });
    const result = await service.mapaServicos('c1');
    expect(result.servicos).toHaveLength(9);
    expect(new Set(result.servicos.map((s) => s.tipoServico)).size).toBe(9);
    expect(result.servicos[0]).toMatchObject({ tipoServico: TipoServico.VIDEO, contratado: true, status: StatusServico.ATIVO, dataContratacao: latest.toISOString() });
    expect(result.servicos.find((s) => s.tipoServico === TipoServico.APP)).toMatchObject({ contratado: false, status: null, dataContratacao: null, interesseRegistrado: true });
  });

  it('rejects interest in a contracted service and reopens existing interest as NOVO', async () => {
    prisma.cliente.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.servicoContratado.findFirst.mockResolvedValueOnce({ id: 's1' }).mockResolvedValueOnce(null);
    await expect(service.registrarInteresse('c1', { tipoServico: TipoServico.APP })).rejects.toThrow(BadRequestException);
    expect(prisma.interesseServico.upsert).not.toHaveBeenCalled();
    await service.registrarInteresse('c1', { tipoServico: TipoServico.APP, mensagem: 'Olá' });
    expect(prisma.interesseServico.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { clienteId_tipoServico: { clienteId: 'c1', tipoServico: TipoServico.APP } },
      update: { mensagem: 'Olá', status: StatusInteresse.NOVO },
    }));
  });

  it('validates enum, message type and maximum length', async () => {
    for (const data of [{ tipoServico: 'INVALID' }, { tipoServico: TipoServico.APP, mensagem: 'a'.repeat(501) }, { tipoServico: TipoServico.APP, mensagem: 123 }]) {
      expect((await validate(Object.assign(new CreateInteresseDto(), data))).length).toBeGreaterThan(0);
    }
    expect(await validate(Object.assign(new CreateInteresseDto(), { tipoServico: TipoServico.APP, mensagem: 'a'.repeat(500) }))).toHaveLength(0);
  });

  it('creates a slug login with collision suffix, bcrypt and recoverable password', async () => {
    prisma.cliente.findUnique.mockResolvedValue({ nomeFantasia: 'Ótica São José', usuarioPortal: null });
    prisma.user.create.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('collision', { code: 'P2002', clientVersion: '5.22.0' })).mockResolvedValueOnce({});
    prisma.user.findUnique.mockResolvedValue(null);
    const result = await service.criarAcesso('c1');
    expect(result).toMatchObject({ login: 'otica-sao-jose-2@cliente.vivox', criadoAgora: true });
    const data = prisma.user.create.mock.calls[1][0].data;
    expect(data).toMatchObject({ role: Role.CLIENTE, clienteId: 'c1' });
    expect(await bcrypt.compare(result.senha, data.senha)).toBe(true);
    expect(decryptPortalPassword(data.senhaPortalCriptografada)).toBe(result.senha);
  });

  it('reuses existing access without writing and handles simultaneous creation', async () => {
    const user = { email: 'existing@cliente.vivox', senhaPortalCriptografada: encryptPortalPassword('password') };
    prisma.cliente.findUnique.mockResolvedValueOnce({ nomeFantasia: 'Cliente', usuarioPortal: user }).mockResolvedValueOnce({ nomeFantasia: 'Cliente', usuarioPortal: null });
    expect(await service.criarAcesso('c1')).toEqual({ login: user.email, senha: 'password', criadoAgora: false });
    expect(prisma.user.create).not.toHaveBeenCalled();
    prisma.user.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('collision', { code: 'P2002', clientVersion: '5.22.0' }));
    prisma.user.findUnique.mockResolvedValue(user);
    expect(await service.criarAcesso('c1')).toEqual({ login: user.email, senha: 'password', criadoAgora: false });
  });

  it('returns 404 for missing clients and portal access', async () => {
    prisma.cliente.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.criarAcesso('missing')).rejects.toThrow(NotFoundException);
    await expect(service.redefinirSenha('missing')).rejects.toThrow(NotFoundException);
  });

  it('resets both password representations without changing login', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'cliente@cliente.vivox' });
    const result = await service.redefinirSenha('c1');
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(result).toMatchObject({ login: 'cliente@cliente.vivox', criadoAgora: false });
    expect(await bcrypt.compare(result.senha, data.senha)).toBe(true);
    expect(decryptPortalPassword(data.senhaPortalCriptografada)).toBe(result.senha);
  });
});
