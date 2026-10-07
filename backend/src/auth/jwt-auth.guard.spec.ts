import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ModuloSistema, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequerModulo } from './modulos.decorator';

@RequerModulo({ todos: [ModuloSistema.CLIENTES], leitura: [ModuloSistema.GP] })
class RestrictedController {
  route() {}

  @RequerModulo({ todos: [ModuloSistema.EDUCACIONAL] })
  override() {}
}
class OpenController { route() {} }

describe('JwtAuthGuard module permissions', () => {
  const prisma = { user: { findUnique: jest.fn() } };
  const guard = new JwtAuthGuard(new Reflector(), prisma as unknown as PrismaService);
  let request: { user: { userId: string; role: Role }; method: string };
  const context = (controller: { prototype: { route: () => void } } = RestrictedController, handler = controller.prototype.route): ExecutionContext => ({
    getClass: () => controller, getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

  beforeEach(() => {
    request = { user: { userId: 'u1', role: Role.COLABORADOR }, method: 'POST' };
    prisma.user.findUnique.mockReset();
    jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockResolvedValue(true);
  });
  afterEach(() => jest.restoreAllMocks());

  it('allows current ADMIN even with no modules', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: Role.ADMIN, modulos: [] });
    expect(await guard.canActivate(context())).toBe(true);
    expect(request.user.role).toBe(Role.ADMIN);
  });
  it('rejects COLABORADOR with no modules with the specified 403 message', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: Role.COLABORADOR, modulos: [] });
    await expect(guard.canActivate(context())).rejects.toThrow('Voce nao tem acesso a este modulo.');
  });
  it('allows any module in todos', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: Role.COLABORADOR, modulos: [ModuloSistema.CLIENTES] });
    expect(await guard.canActivate(context())).toBe(true);
  });
  it('allows GET with a read-only module', async () => {
    request.method = 'GET';
    prisma.user.findUnique.mockResolvedValue({ role: Role.COLABORADOR, modulos: [ModuloSistema.GP] });
    expect(await guard.canActivate(context())).toBe(true);
  });
  it.each(['POST', 'PATCH', 'DELETE', 'PUT'])('rejects %s with only a read-only module', async (method) => {
    request.method = method;
    prisma.user.findUnique.mockResolvedValue({ role: Role.COLABORADOR, modulos: [ModuloSistema.GP] });
    await expect(guard.canActivate(context())).rejects.toThrow(ForbiddenException);
  });
  it('does not query the database on routes without a decorator', async () => {
    expect(await guard.canActivate(context(OpenController))).toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
  it('lets method metadata override class metadata', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: Role.COLABORADOR, modulos: [ModuloSistema.CLIENTES] });
    await expect(guard.canActivate(context(RestrictedController, RestrictedController.prototype.override))).rejects.toThrow(ForbiddenException);
    prisma.user.findUnique.mockResolvedValue({ role: Role.COLABORADOR, modulos: [ModuloSistema.EDUCACIONAL] });
    expect(await guard.canActivate(context(RestrictedController, RestrictedController.prototype.override))).toBe(true);
  });
  it('enforces changes without a new login, including demotion of an old ADMIN token', async () => {
    request.user.role = Role.ADMIN;
    prisma.user.findUnique.mockResolvedValueOnce({ role: Role.COLABORADOR, modulos: [] })
      .mockResolvedValueOnce({ role: Role.COLABORADOR, modulos: [ModuloSistema.CLIENTES] });
    await expect(guard.canActivate(context())).rejects.toThrow(ForbiddenException);
    expect(await guard.canActivate(context())).toBe(true);
  });
  it('rejects deleted users and current CLIENTE roles', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ role: Role.CLIENTE, modulos: [ModuloSistema.CLIENTES] });
    await expect(guard.canActivate(context())).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context())).rejects.toThrow(ForbiddenException);
  });
  it('preserves CLIENTE internal blocking before any database query', async () => {
    request.user.role = Role.CLIENTE;
    await expect(guard.canActivate(context())).rejects.toThrow(ForbiddenException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
