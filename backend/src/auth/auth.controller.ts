import { Controller, Post, Get, Body, Query, Res, UnauthorizedException, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post('seed-admin')
  @HttpCode(HttpStatus.OK)
  async seedAdmin(@Body() req: { email?: string; senha?: string; role?: Role; nome?: string; setupToken?: string }) {
    const setupToken = process.env.SETUP_TOKEN;
    if (!setupToken || req?.setupToken !== setupToken) {
      throw new UnauthorizedException('Token de setup inválido ou não configurado');
    }

    const { email, senha, role, nome } = req || {};
    if (!email || !senha) {
      throw new BadRequestException('Informe email e senha para provisionar o admin');
    }

    return this.usersService.seedAdmin(email, senha, role || Role.ADMIN, nome);
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

  /**
   * Endpoint de redirecionamento público do OAuth da Meta
   */
  @Get('instagram/callback')
  async instagramCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDesc: string,
    @Res() res: Response,
  ) {
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (error) {
      return res.redirect(`${frontendBaseUrl}/analytics?error=${encodeURIComponent(errorDesc || error)}`);
    }

    let clienteId = '';
    try {
      if (state) {
        try {
          const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
          clienteId = parsed.clienteId;
        } catch {
          clienteId = state;
        }
      }

      if (!clienteId || !code) {
        return res.redirect(`${frontendBaseUrl}/analytics${clienteId ? `/${clienteId}?tab=instagram&` : '?'}error=Parametros_invalidos`);
      }

      const result = await this.analyticsService.handleInstagramCallback(clienteId, code);
      if (result && !result.success) {
        return res.redirect(
          `${frontendBaseUrl}/analytics/${clienteId}?tab=instagram&warning=${encodeURIComponent(result.message || 'Página conectada, mas sem Instagram vinculado.')}`,
        );
      }
      const selectQuery = result?.multiple ? '&select_account=true' : '';
      return res.redirect(`${frontendBaseUrl}/analytics/${clienteId}?tab=instagram&connected=true${selectQuery}`);
    } catch (err: any) {
      // Usar erroMessage ao inves de falhar caso a mensagem não venha, além de manter o clienteId se disponível.
      if (clienteId) {
        return res.redirect(`${frontendBaseUrl}/analytics/${clienteId}?tab=instagram&error=${encodeURIComponent(err?.message || 'Erro interno')}`);
      }
      return res.redirect(`${frontendBaseUrl}/analytics?error=${encodeURIComponent(err?.message || 'Erro interno')}`);
    }
  }
}
