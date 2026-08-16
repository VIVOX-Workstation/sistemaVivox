import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

export interface GoogleCredentials {
  client_email?: string;
  private_key?: string;
  project_id?: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private cachedCredentials: GoogleCredentials | null = null;
  private cachedGoogleAuth: any = null;

  constructor() {
    this.loadCredentials();
  }

  /**
   * Carrega credenciais do Google Service Account de várias fontes possíveis:
   * 1. Variável GOOGLE_SERVICE_ACCOUNT_KEY (JSON string)
   * 2. Variáveis GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY
   * 3. Arquivo apontado por GOOGLE_APPLICATION_CREDENTIALS
   * 4. Arquivo credentials.json ou google-credentials.json no diretório backend ou raiz
   */
  public loadCredentials(): GoogleCredentials | null {
    try {
      // 1. JSON String em GOOGLE_SERVICE_ACCOUNT_KEY
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
        const parsed = JSON.parse(raw);
        if (parsed.client_email && parsed.private_key) {
          this.cachedCredentials = {
            client_email: parsed.client_email,
            private_key: this.sanitizePrivateKey(parsed.private_key),
            project_id: parsed.project_id,
          };
          this.logger.log(`Credenciais Google carregadas via GOOGLE_SERVICE_ACCOUNT_KEY (${parsed.client_email})`);
          return this.cachedCredentials;
        }
      }

      // 2. Variáveis individuais
      if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        this.cachedCredentials = {
          client_email: process.env.GOOGLE_CLIENT_EMAIL.trim(),
          private_key: this.sanitizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
          project_id: process.env.GOOGLE_PROJECT_ID?.trim(),
        };
        this.logger.log(`Credenciais Google carregadas via GOOGLE_CLIENT_EMAIL (${process.env.GOOGLE_CLIENT_EMAIL})`);
        return this.cachedCredentials;
      }

      // 3. Arquivo em GOOGLE_APPLICATION_CREDENTIALS
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const filePath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(content);
          this.cachedCredentials = {
            client_email: parsed.client_email,
            private_key: this.sanitizePrivateKey(parsed.private_key),
            project_id: parsed.project_id,
          };
          this.logger.log(`Credenciais Google carregadas do arquivo ${filePath} (${parsed.client_email})`);
          return this.cachedCredentials;
        }
      }

      // 4. Arquivo local credentials.json ou google-credentials.json
      const possiblePaths = [
        path.join(process.cwd(), 'credentials.json'),
        path.join(process.cwd(), 'google-credentials.json'),
        path.join(process.cwd(), '..', 'credentials.json'),
        path.join(process.cwd(), '..', 'google-credentials.json'),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          const parsed = JSON.parse(content);
          if (parsed.client_email && parsed.private_key) {
            this.cachedCredentials = {
              client_email: parsed.client_email,
              private_key: this.sanitizePrivateKey(parsed.private_key),
              project_id: parsed.project_id,
            };
            this.logger.log(`Credenciais Google carregadas de ${p} (${parsed.client_email})`);
            return this.cachedCredentials;
          }
        }
      }

      this.logger.warn('Nenhuma credencial do Google Service Account foi encontrada (.env ou credentials.json).');
      return null;
    } catch (err) {
      this.logger.error('Erro ao processar credenciais da Service Account do Google:', err);
      return null;
    }
  }

  private sanitizePrivateKey(key: string): string {
    if (!key) return '';
    let sanitized = key.trim();
    if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
      sanitized = sanitized.substring(1, sanitized.length - 1);
    }
    sanitized = sanitized.replace(/\\n/g, '\n');
    return sanitized;
  }

  public isConfigured(): boolean {
    const creds = this.getCredentials();
    return !!(creds && creds.client_email && creds.private_key);
  }

  public getServiceAccountEmail(): string | null {
    const creds = this.getCredentials();
    return creds?.client_email || null;
  }

  public getCredentials(): GoogleCredentials | null {
    if (!this.cachedCredentials) {
      this.loadCredentials();
    }
    return this.cachedCredentials;
  }

  /**
   * Retorna instância GoogleAuth autenticada para Google APIs (Search Console, etc.)
   */
  public getGoogleAuth(): any {
    const creds = this.getCredentials();
    if (!creds || !creds.client_email || !creds.private_key) {
      return null;
    }

    if (!this.cachedGoogleAuth) {
      this.cachedGoogleAuth = new google.auth.GoogleAuth({
        credentials: {
          client_email: creds.client_email,
          private_key: creds.private_key,
        },
        projectId: creds.project_id,
        scopes: [
          'https://www.googleapis.com/auth/analytics.readonly',
          'https://www.googleapis.com/auth/webmasters.readonly',
        ],
      });
    }

    return this.cachedGoogleAuth;
  }
}
