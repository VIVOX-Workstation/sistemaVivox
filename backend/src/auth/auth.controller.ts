import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('seed-admin')
  @HttpCode(HttpStatus.OK)
  async seedAdmin(@Body() req: { email?: string; senha?: string }) {
    const email = req?.email || 'kelson@vivox.com.br';
    const senha = req?.senha || '123456';
    return this.usersService.seedAdmin(email, senha);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() req) {
    try {
      const user = await this.authService.validateUser(req.email, req.senha);
      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas');
      }
      return this.authService.login(user);
    } catch (e) {
      console.error('AUTH LOGIN ERROR STACK:', e);
      throw e;
    }
  }
}
