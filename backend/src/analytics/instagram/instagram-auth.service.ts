import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { FacebookPagesResponse, FacebookPageAccount, MetaTokenResponse } from './interfaces';

@Injectable()
export class InstagramAuthService {
  private readonly logger = new Logger(InstagramAuthService.name);
  private readonly graphApiVersion = 'v26.0';
  private readonly graphApiBase = 'https://graph.facebook.com';

  private getCredentials() {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      this.logger.error('Credenciais da Meta (META_APP_ID, META_APP_SECRET, META_REDIRECT_URI) não configuradas no .env');
      throw new InternalServerErrorException('Configurações da Meta/Instagram incompletas no servidor.');
    }

    return { appId, appSecret, redirectUri };
  }

  /**
   * Gera a URL de autorização OAuth do Facebook/Instagram
   */
  getAuthUrl(clienteId: string, customRedirectUri?: string): string {
    const { appId, redirectUri } = this.getCredentials();
    const finalRedirect = customRedirectUri || redirectUri;

    const state = Buffer.from(
      JSON.stringify({ clienteId, timestamp: Date.now() }),
    ).toString('base64url');

    const scopes = [
      'public_profile',
      'instagram_basic',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',');

    const url = new URL(`https://www.facebook.com/${this.graphApiVersion}/dialog/oauth`);
    url.searchParams.set('client_id', appId);
    url.searchParams.set('redirect_uri', finalRedirect);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('auth_type', 'rerequest');
    url.searchParams.set('state', state);

    // Se houver META_CONFIG_ID configurado (Facebook Login for Business)
    const configId = process.env.META_CONFIG_ID;
    if (configId) {
      url.searchParams.set('config_id', configId);
    } else {
      url.searchParams.set('scope', scopes);
    }

    return url.toString();
  }

  /**
   * Troca o code de autorização por um token de curta duração e
   * em seguida por um Token de Longa Duração (~60 dias).
   */
  async exchangeCodeForLongLivedToken(code: string, customRedirectUri?: string): Promise<string> {
    const { appId, appSecret, redirectUri } = this.getCredentials();
    const finalRedirect = customRedirectUri || redirectUri;

    // 1. Obter token de curta duração
    const shortTokenUrl = new URL(`${this.graphApiBase}/${this.graphApiVersion}/oauth/access_token`);
    shortTokenUrl.searchParams.set('client_id', appId);
    shortTokenUrl.searchParams.set('client_secret', appSecret);
    shortTokenUrl.searchParams.set('redirect_uri', finalRedirect);
    shortTokenUrl.searchParams.set('code', code);

    const shortRes = await fetch(shortTokenUrl.toString());
    const shortData = (await shortRes.json()) as MetaTokenResponse & { error?: any };

    if (!shortRes.ok || !shortData.access_token) {
      const msg = shortData.error?.message || 'Falha ao trocar código por token do Facebook';
      this.logger.error(`Erro ao obter token de curta duração: ${msg}`);
      throw new BadRequestException(msg);
    }

    // 2. Trocar token de curta duração por Token de Longa Duração (60 dias)
    const longTokenUrl = new URL(`${this.graphApiBase}/${this.graphApiVersion}/oauth/access_token`);
    longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longTokenUrl.searchParams.set('client_id', appId);
    longTokenUrl.searchParams.set('client_secret', appSecret);
    longTokenUrl.searchParams.set('fb_exchange_token', shortData.access_token);

    const longRes = await fetch(longTokenUrl.toString());
    const longData = (await longRes.json()) as MetaTokenResponse & { error?: any };

    if (!longRes.ok || !longData.access_token) {
      this.logger.warn(
        `Não foi possível estender para token de longa duração, usando o token inicial: ${longData.error?.message}`,
      );
      return shortData.access_token;
    }

    return longData.access_token;
  }

  /**
   * Obtém as Páginas do Facebook administradas pelo usuário e
   * suas respectivas contas profissionais do Instagram conectadas.
   */
  async getConnectedPagesAndInstagram(accessToken: string): Promise<FacebookPageAccount[]> {
    const url = new URL(`${this.graphApiBase}/${this.graphApiVersion}/me/accounts`);
    url.searchParams.set(
      'fields',
      'id,name,access_token,category,instagram_business_account{id,username,name,profile_picture_url}',
    );
    url.searchParams.set('access_token', accessToken);

    const res = await fetch(url.toString());
    const json = (await res.json()) as FacebookPagesResponse & { error?: any };

    if (!res.ok) {
      const msg = json.error?.message || 'Erro ao consultar páginas conectadas na Meta';
      this.logger.error(`Erro em /me/accounts: ${msg}`);
      throw new BadRequestException(msg);
    }

    return json.data || [];
  }
}
