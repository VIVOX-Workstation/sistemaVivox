import { JwtService } from '@nestjs/jwt';
import { ModuloSistema, Role } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService login permissions', () => {
  it('includes module permissions in the login user without exposing password fields', async () => {
    const jwt = { sign: jest.fn().mockReturnValue('jwt') };
    const service = new AuthService({} as UsersService, jwt as unknown as JwtService);
    const result = await service.login({
      id: 'u1', nome: 'Nome', email: 'user@vivox.com', role: Role.COLABORADOR,
      clienteId: null, modulos: [ModuloSistema.GP], senha: 'hash', senhaPortalCriptografada: 'encrypted',
    });
    expect(result).toEqual({ access_token: 'jwt', user: { id: 'u1', nome: 'Nome', email: 'user@vivox.com', role: Role.COLABORADOR, clienteId: null, modulos: [ModuloSistema.GP] } });
  });
});
