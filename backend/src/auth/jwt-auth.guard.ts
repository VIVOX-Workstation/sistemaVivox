import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { firstValueFrom, isObservable } from 'rxjs';
import { PORTAL_CLIENTE_KEY } from './portal-cliente.decorator';
import { MODULOS_KEY, ModulosRequeridos } from './modulos.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authentication = super.canActivate(context);
    const authenticated = await (isObservable(authentication)
      ? firstValueFrom(authentication)
      : authentication);
    if (!authenticated) return false;

    const { user } = context.switchToHttp().getRequest();
    const portalCliente = this.reflector.getAllAndOverride<boolean>(
      PORTAL_CLIENTE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (user?.role === Role.CLIENTE && !portalCliente) {
      throw new ForbiddenException('Acesso restrito à equipe Vivox.');
    }
    const modulos = this.reflector.getAllAndOverride<ModulosRequeridos>(
      MODULOS_KEY, [context.getHandler(), context.getClass()],
    );
    if (modulos) {
      const atual = user?.userId ? await this.prisma.user.findUnique({
        where: { id: user.userId }, select: { role: true, modulos: true },
      }) : null;
      // O banco é a fonte atual de permissões, inclusive após mudanças de role.
      const acessoCompleto = atual && modulos.todos.some((modulo) => atual.modulos.includes(modulo));
      const acessoLeitura = atual && context.switchToHttp().getRequest().method === 'GET' &&
        modulos.leitura?.some((modulo) => atual.modulos.includes(modulo));
      if (!atual || (atual.role !== Role.ADMIN &&
        (atual.role !== Role.COLABORADOR || !(acessoCompleto || acessoLeitura)))) {
        throw new ForbiddenException('Voce nao tem acesso a este modulo.');
      }
      user.role = atual.role;
      user.modulos = atual.modulos;
    }
    return true;
  }
}
