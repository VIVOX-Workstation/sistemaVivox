import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ModuloSistema, Role } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateModulosDto } from './dto/update-modulos.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

describe('Users module permissions API', () => {
  const prisma = { user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn() } };
  const service = new UsersService(prisma as unknown as PrismaService);
  beforeEach(() => jest.resetAllMocks());

  it('lists internal users with modules and excludes CLIENTE', () => {
    service.findAll();
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { role: { not: Role.CLIENTE } }, select: { id: true, nome: true, email: true, role: true, modulos: true },
    });
  });
  it('reads the current user from the database with only the requested fields', async () => {
    const user = { id: 'u1', nome: 'Nome', email: 'user@vivox.com', role: Role.COLABORADOR, clienteId: null, modulos: [] };
    prisma.user.findUnique.mockResolvedValue(user);
    expect(await service.findCurrent('u1')).toEqual(user);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' }, select: { id: true, nome: true, email: true, role: true, clienteId: true, modulos: true } });
  });
  it('returns 404 for a missing user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.updateModulos('missing', [])).rejects.toThrow(NotFoundException);
    await expect(service.findCurrent('missing')).rejects.toThrow(NotFoundException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('returns 400 when updating CLIENTE modules', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: Role.CLIENTE });
    await expect(service.updateModulos('u1', [])).rejects.toThrow(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('permits an empty array and returns the specified user fields', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: Role.COLABORADOR });
    prisma.user.update.mockResolvedValue({ id: 'u1', nome: 'Nome', email: 'user@vivox.com', role: Role.COLABORADOR, modulos: [] });
    expect(await service.updateModulos('u1', [])).toMatchObject({ id: 'u1', modulos: [] });
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { modulos: [] }, select: { id: true, nome: true, email: true, role: true, modulos: true } });
  });
  it('validates enum values, arrays and uniqueness while permitting empty arrays', async () => {
    for (const modulos of [undefined, null, 'CLIENTES', ['INVALID'], [ModuloSistema.GP, ModuloSistema.GP]]) {
      expect((await validate(Object.assign(new UpdateModulosDto(), { modulos }))).length).toBeGreaterThan(0);
    }
    for (const modulos of [[], [ModuloSistema.GP, ModuloSistema.CLIENTES]]) {
      expect(await validate(Object.assign(new UpdateModulosDto(), { modulos }))).toHaveLength(0);
    }
  });
  it('supports optional creation modules and preserves the database default when omitted', async () => {
    const data = { nome: 'Nome', email: 'user@vivox.com', senha: 'secret123' };
    const dto = Object.assign(new CreateUserDto(), data);
    expect(await validate(dto)).toHaveLength(0);
    prisma.user.findUnique.mockResolvedValue(null);
    await service.create(dto);
    expect(prisma.user.create.mock.calls[0][0].data.modulos).toBeUndefined();
    await service.create({ ...data, modulos: [] });
    expect(prisma.user.create.mock.calls[1][0].data.modulos).toEqual([]);
  });
  it('strips module changes from the generic PATCH DTO', async () => {
    const dto = plainToInstance(UpdateUserDto, { nome: 'Nome', modulos: [ModuloSistema.GP] });
    await validate(dto, { whitelist: true });
    expect(dto).toEqual({ nome: 'Nome' });
  });
});
