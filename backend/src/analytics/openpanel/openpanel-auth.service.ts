import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenPanelAuthService {
  public getApiUrl(): string {
    return (process.env.OPENPANEL_API_URL || 'https://api.openpanel.dev').replace(/\/$/, '');
  }

  public isConfigured(clientId?: string | null, clientSecret?: string | null): boolean {
    return !!(clientId?.trim() && clientSecret?.trim());
  }

  public getHeaders(clientId?: string | null, clientSecret?: string | null): Record<string, string> | null {
    const id = clientId?.trim();
    const secret = clientSecret?.trim();
    if (!id || !secret) return null;

    return {
      'openpanel-client-id': id,
      'openpanel-client-secret': secret,
    };
  }
}
