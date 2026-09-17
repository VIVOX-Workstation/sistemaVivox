import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class GithubAppService {
  private readonly logger = new Logger(GithubAppService.name);
  private installationTokenCache = new Map<string, { token: string; expiresAt: number }>();

  private getAppCredentials() {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

    if (!appId || !privateKey) {
      this.logger.error('GITHUB_APP_ID ou GITHUB_APP_PRIVATE_KEY não encontrados no ambiente.');
      throw new InternalServerErrorException('Configurações do GitHub App incompletas.');
    }

    return { appId, privateKey };
  }

  private generateAppJwt(): string {
    const { appId, privateKey } = this.getAppCredentials();
    
    // O JWT pode durar no máximo 10 minutos na API do GitHub
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // Permite 60s de clock drift
      exp: now + (9 * 60), 
      iss: appId,
    };

    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    return jwt.sign(payload, formattedPrivateKey, { algorithm: 'RS256' });
  }

  async getInstallationAccessToken(installationId: string): Promise<string> {
    const cached = this.installationTokenCache.get(installationId);
    // Checa se ainda tem pelo menos 1 minuto de validade
    if (cached && cached.expiresAt > Date.now() + 60000) { 
      return cached.token;
    }

    const appJwt = this.generateAppJwt();

    const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Failed to get installation access token for installation ${installationId}: ${errorText}`);
      throw new InternalServerErrorException('Falha ao obter token de instalação do GitHub.');
    }

    const data = await response.json();
    const token = data.token;
    const expiresAt = new Date(data.expires_at).getTime();

    this.installationTokenCache.set(installationId, { token, expiresAt });

    return token;
  }
}
