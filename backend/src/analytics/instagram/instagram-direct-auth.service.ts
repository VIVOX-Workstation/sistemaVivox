import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { MetaTokenResponse } from './interfaces';

@Injectable()
export class InstagramDirectAuthService {
  private readonly logger = new Logger(InstagramDirectAuthService.name);
  private readonly graphApiBase = 'https://graph.instagram.com';

  private getCredentials() {
    // Tenta usar as credenciais específicas para Instagram Direct Login, ou faz fallback para as do Facebook
    const appId = process.env.META_APP_ID_INSTAGRAM || process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET_INSTAGRAM || process.env.META_APP_SECRET;
    // O redirect URI deve estar configurado no App da Meta
    const redirectUri = process.env.META_REDIRECT_URI_INSTAGRAM || 'http://localhost:3000/auth/instagram/callback/direct';

    if (!appId || !appSecret || !redirectUri) {
      this.logger.error('Credenciais da Meta (META_APP_ID, META_APP_SECRET, META_REDIRECT_URI) não configuradas no .env');
      throw new InternalServerErrorException('Configurações da Meta/Instagram incompletas no servidor.');
    }

    return { appId, appSecret, redirectUri };
  }

  /**
   * Gera a URL de autorização OAuth do Instagram (Business Login)
   */
  getAuthUrl(clienteId: string, customRedirectUri?: string): string {
    const { appId, redirectUri } = this.getCredentials();
    const finalRedirect = customRedirectUri || redirectUri;

    const state = Buffer.from(
      JSON.stringify({ clienteId, timestamp: Date.now() }),
    ).toString('base64url');

    const scopes = [
      'instagram_business_basic',
      'instagram_business_manage_insights',
    ].join(',');

    const url = new URL(`https://www.instagram.com/oauth/authorize`);
    url.searchParams.set('client_id', appId);
    url.searchParams.set('redirect_uri', finalRedirect);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes);
    url.searchParams.set('state', state);

    return url.toString();
  }

  /**
   * Troca o code de autorização por um token de curta duração e
   * em seguida por um Token de Longa Duração (60 dias).
   */
  async exchangeCodeForToken(code: string, customRedirectUri?: string): Promise<{
    access_token: string;
    user_id: string;
  }> {
    const { appId, appSecret, redirectUri } = this.getCredentials();
    const finalRedirect = customRedirectUri || redirectUri;

    // 1. Obter token de curta duração
    const shortTokenUrl = 'https://api.instagram.com/oauth/access_token';
    const body = new URLSearchParams();
    body.append('client_id', appId);
    body.append('client_secret', appSecret);
    body.append('grant_type', 'authorization_code');
    body.append('redirect_uri', finalRedirect);
    body.append('code', code);

    const shortRes = await fetch(shortTokenUrl, {
      method: 'POST',
      body: body.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const shortData = (await shortRes.json()) as MetaTokenResponse & { error?: any, error_message?: string, user_id?: string };

    if (!shortRes.ok || !shortData.access_token) {
      const msg = shortData.error_message || shortData.error?.message || 'Falha ao trocar código por token do Instagram';
      this.logger.error(`Erro ao obter token de curta duração: ${msg}`);
      throw new BadRequestException(msg);
    }

    // 2. Trocar token de curta duração por Token de Longa Duração (60 dias)
    const longTokenUrl = new URL(`${this.graphApiBase}/access_token`);
    longTokenUrl.searchParams.set('grant_type', 'ig_exchange_token');
    longTokenUrl.searchParams.set('client_secret', appSecret);
    longTokenUrl.searchParams.set('access_token', shortData.access_token);

    const longRes = await fetch(longTokenUrl.toString());
    const longData = (await longRes.json()) as MetaTokenResponse & { error?: any };

    if (!longRes.ok || !longData.access_token) {
      this.logger.warn(
        `Não foi possível estender para token de longa duração, usando o token inicial: ${longData.error?.message}`,
      );
      return {
        access_token: shortData.access_token,
        user_id: shortData.user_id as string,
      };
    }

    // Para o token longo, precisamos garantir que temos o user_id (pode vir no curto)
    return {
      access_token: longData.access_token,
      user_id: shortData.user_id as string, // A API do token curto retorna o user_id
    };
  }

  /**
   * Obtém as informações básicas do perfil do Instagram conectado
   */
  async getProfile(accessToken: string): Promise<{ id: string; username: string }> {
    const url = new URL(`${this.graphApiBase}/v22.0/me`);
    url.searchParams.set('fields', 'id,username');
    url.searchParams.set('access_token', accessToken);

    const res = await fetch(url.toString());
    const data = (await res.json()) as { id: string; username: string; error?: any };

    if (!res.ok) {
      const msg = data.error?.message || 'Erro ao consultar perfil do Instagram';
      this.logger.error(`Erro em /me: ${msg}`);
      throw new BadRequestException(msg);
    }

    return {
      id: data.id,
      username: data.username,
    };
  }
}
