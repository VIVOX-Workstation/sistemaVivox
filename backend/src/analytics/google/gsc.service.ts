import { Injectable, Logger } from '@nestjs/common';
import { google, searchconsole_v1 } from 'googleapis';
import { GoogleAuthService } from './google-auth.service';
import {
  GSCMetricsResult,
  GSCOverview,
  GSCTimelinePoint,
  GSCQueryMetric,
  GSCPageMetric,
} from './interfaces';

@Injectable()
export class GSCService {
  private readonly logger = new Logger(GSCService.name);

  constructor(private readonly googleAuth: GoogleAuthService) {}

  private getClient(): searchconsole_v1.Searchconsole | null {
    const auth = this.googleAuth.getGoogleAuth();
    if (!auth) return null;
    return google.searchconsole({ version: 'v1', auth });
  }

  /**
   * Converte data relativa como "30daysAgo" ou "7daysAgo" em data YYYY-MM-DD para a API do GSC
   */
  private parseRelativeDate(dateStr: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    const today = new Date();
    if (dateStr === 'today') {
      return today.toISOString().split('T')[0];
    }
    if (dateStr === 'yesterday') {
      today.setDate(today.getDate() - 1);
      return today.toISOString().split('T')[0];
    }

    const matchDays = dateStr.match(/^(\d+)daysAgo$/i);
    if (matchDays) {
      const days = parseInt(matchDays[1], 10);
      today.setDate(today.getDate() - days);
      return today.toISOString().split('T')[0];
    }

    // Default 30 dias atrás
    today.setDate(today.getDate() - 30);
    return today.toISOString().split('T')[0];
  }

  /**
   * Consulta métricas do Google Search Console para um site/domínio
   * @param siteUrl URL do site (ex: "https://www.dominio.com.br/" ou "sc-domain:dominio.com.br")
   * @param startDate Data de início (ex: "30daysAgo" ou "2026-07-01")
   * @param endDate Data final (ex: "yesterday" ou "2026-07-31")
   */
  private async resolveSiteUrl(client: any, inputUrl: string): Promise<string> {
    let raw = inputUrl.trim();
    if (raw.startsWith('sc-domain:') || raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }

    // Se o usuário digitou apenas o domínio (ex: dramanuelacordeiropediatra.com.br)
    try {
      const sitesList = await client.sites.list();
      const entries: any[] = sitesList.data.siteEntry || [];
      
      // Procura match exato por sc-domain
      const domainMatch = entries.find(e => e.siteUrl === `sc-domain:${raw}`);
      if (domainMatch) return domainMatch.siteUrl;

      // Procura match por https
      const httpsMatch = entries.find(e => e.siteUrl.includes(raw));
      if (httpsMatch) return httpsMatch.siteUrl;
    } catch {
      // fallback
    }

    return `sc-domain:${raw}`;
  }

  async getSearchConsoleMetrics(
    siteUrl: string,
    startDate: string = '30daysAgo',
    endDate: string = 'yesterday',
  ): Promise<GSCMetricsResult> {
    let cleanSiteUrl = siteUrl.trim();
    if (!cleanSiteUrl) {
      return {
        success: false,
        siteUrl: '',
        configured: false,
        error: 'URL do site no Search Console não foi informada.',
      };
    }

    const client = this.getClient();
    const serviceAccountEmail = this.googleAuth.getServiceAccountEmail();

    if (!client) {
      return {
        success: false,
        siteUrl: cleanSiteUrl,
        configured: false,
        error: 'Credenciais do Google Service Account não configuradas no backend.',
      };
    }

    // Resolve se é sc-domain ou https
    cleanSiteUrl = await this.resolveSiteUrl(client, cleanSiteUrl);

    const parsedStartDate = this.parseRelativeDate(startDate);
    const parsedEndDate = this.parseRelativeDate(endDate);

    try {
      const [timelineRes, queriesRes, pagesRes] = await Promise.all([
        client.searchanalytics.query({
          siteUrl: cleanSiteUrl,
          requestBody: {
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            dimensions: ['date'],
            rowLimit: 500,
          },
        }),
        client.searchanalytics.query({
          siteUrl: cleanSiteUrl,
          requestBody: {
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            dimensions: ['query'],
            rowLimit: 20,
          },
        }),
        client.searchanalytics.query({
          siteUrl: cleanSiteUrl,
          requestBody: {
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            dimensions: ['page'],
            rowLimit: 20,
          },
        }),
      ]);

      const timelineRows = timelineRes.data.rows || [];
      const queryRows = queriesRes.data.rows || [];
      const pageRows = pagesRes.data.rows || [];

      // --- Parser da Timeline e Cálculo do Resumo Geral ---
      let totalClicks = 0;
      let totalImpressions = 0;
      let weightedPositionSum = 0;

      const timeline: GSCTimelinePoint[] = timelineRows
        .map(row => {
          const clicks = row.clicks || 0;
          const impressions = row.impressions || 0;
          const ctr = Math.round((row.ctr || 0) * 1000) / 10; // %
          const position = Math.round((row.position || 0) * 10) / 10;

          totalClicks += clicks;
          totalImpressions += impressions;
          weightedPositionSum += (row.position || 0) * impressions;

          return {
            date: row.keys?.[0] || '',
            clicks,
            impressions,
            ctr,
            position,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      const averageCtr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 1000) / 10 : 0;
      const averagePosition = totalImpressions > 0 ? Math.round((weightedPositionSum / totalImpressions) * 10) / 10 : 0;

      const overview: GSCOverview = {
        totalClicks,
        totalImpressions,
        averageCtr,
        averagePosition,
      };

      // --- Parser de Palavras-Chave (Queries) ---
      const queries: GSCQueryMetric[] = queryRows.map(row => ({
        query: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: Math.round((row.ctr || 0) * 1000) / 10,
        position: Math.round((row.position || 0) * 10) / 10,
      }));

      // --- Parser de Páginas ---
      const pages: GSCPageMetric[] = pageRows.map(row => ({
        page: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: Math.round((row.ctr || 0) * 1000) / 10,
        position: Math.round((row.position || 0) * 10) / 10,
      }));

      return {
        success: true,
        siteUrl: cleanSiteUrl,
        configured: true,
        overview,
        timeline,
        queries,
        pages,
      };
    } catch (error: any) {
      this.logger.error(`Erro ao consultar Search Console para ${cleanSiteUrl}:`, error);

      let userFriendlyError = error.message || 'Erro ao comunicar com Google Search Console API.';
      const msg = error.message || '';

      if (
        msg.includes('User does not have sufficient permissions') ||
        error.code === 403 ||
        msg.includes('PERMISSION_DENIED')
      ) {
        userFriendlyError = `A Conta de Serviço (${serviceAccountEmail || 'configurada'}) não possui permissão no site "${cleanSiteUrl}" no Search Console. Adicione esse e-mail como Usuário nas configurações de "Usuários e permissões" da propriedade.`;
      } else if (msg.includes('site is not in your account') || error.code === 404) {
        userFriendlyError = `A propriedade "${cleanSiteUrl}" não foi encontrada no Google Search Console. Certifique-se de usar o formato exato cadastrado (ex: "https://site.com.br/" ou "sc-domain:site.com.br").`;
      }

      return {
        success: false,
        siteUrl: cleanSiteUrl,
        configured: true,
        error: userFriendlyError,
      };
    }
  }
}
