import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { firstValueFrom, isObservable } from 'rxjs';
import { PORTAL_CLIENTE_KEY } from './portal-cliente.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
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
    return true;
  }
}
