import { Injectable, Logger } from '@nestjs/common';
import { OpenPanelAuthService } from './openpanel-auth.service';
import {
  OpenPanelMetricsResult,
  OpenPanelOverview,
  OpenPanelTimelinePoint,
  OpenPanelBreakdownItem,
  OpenPanelPageMetric,
  OpenPanelWhatsappClick,
} from './interfaces';

interface RawBreakdownRow {
  name: string | null;
  sessions: number;
  pageviews: number;
  revenue?: number;
}

interface RawPageRow {
  origin: string;
  path: string;
  sessions: number;
  pageviews: number;
  revenue?: number;
}

interface RawEventRow {
  name: string;
  created_at: string;
  city?: string;
  device?: string;
  browser?: string;
  properties?: {
    href?: string;
    text?: string;
  };
}

interface RawMetricsResponse {
  metrics: {
    bounce_rate: number;
    unique_visitors: number;
    total_sessions: number;
    avg_session_duration: number;
    total_screen_views: number;
    views_per_session: number;
    total_revenue?: number;
  };
  series: Array<{
    date: string;
    unique_visitors: number;
    total_sessions: number;
    total_screen_views: number;
  }>;
}

@Injectable()
export class OpenPanelService {
  private readonly logger = new Logger(OpenPanelService.name);

  constructor(private readonly openpanelAuth: OpenPanelAuthService) {}

  /**
   * Faz uma chamada GET autenticada na API do OpenPanel.
   * Lança erro com `.status` preenchido quando a resposta não é OK,
   * para permitir mensagens amigáveis específicas por status HTTP.
   */
  private async fetchJson<T>(url: string, headers: Record<string, string>): Promise<T> {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const error: any = new Error(`OpenPanel respondeu ${res.status}: ${body || res.statusText}`);
      error.status = res.status;
      throw error;
    }

    return res.json() as Promise<T>;
  }

  private toBreakdown(rows: RawBreakdownRow[] = []): OpenPanelBreakdownItem[] {
    const total = rows.reduce((sum, r) => sum + (r.sessions || 0), 0);
    return rows.map(r => ({
      name: r.name || '(direto / não identificado)',
      sessions: r.sessions || 0,
      pageviews: r.pageviews || 0,
      percentage: total > 0 ? Math.round(((r.sessions || 0) / total) * 1000) / 10 : 0,
    }));
  }

  /**
   * Filtra os eventos "link_out" (clique em link externo, rastreado automaticamente
   * pelo SDK do OpenPanel) que apontam para o WhatsApp e extrai a mensagem
   * pré-preenchida do link — sinal de intenção bem mais forte que um pageview.
   */
  private toWhatsappClicks(events: RawEventRow[] = []): OpenPanelWhatsappClick[] {
    return events
      .filter(e => e.name === 'link_out' && /wa\.me|whatsapp\.com/i.test(e.properties?.href || ''))
      .map(e => {
        let mensagem = '';
        try {
          mensagem = decodeURIComponent(new URL(e.properties!.href!).searchParams.get('text') || '');
        } catch {
          // href inválida ou sem query string; mantém mensagem vazia
        }

        return {
          createdAt: e.created_at || '',
          mensagem,
          botao: e.properties?.text || '',
          cidade: e.city || '',
          dispositivo: e.device || '',
          navegador: e.browser || '',
        };
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  /**
   * Consulta métricas completas de um projeto do OpenPanel (site/landing page de um cliente).
   * @param projectId Slug do projeto no OpenPanel (ex: "dra-manuela-cordeiro-lp")
   * @param clientId Client ID do OpenPanel específico deste cliente
   * @param clientSecret Client Secret do OpenPanel específico deste cliente
   * @param range Janela relativa aceita pela API (ex: "7d", "30d", "90d")
   */
  async getOpenPanelMetrics(
    projectId: string,
    clientId: string | null | undefined,
    clientSecret: string | null | undefined,
    range: string = '30d',
  ): Promise<OpenPanelMetricsResult> {
    const cleanProjectId = (projectId || '').trim();

    if (!cleanProjectId) {
      return {
        success: false,
        projectId: '',
        configured: this.openpanelAuth.isConfigured(clientId, clientSecret),
        error: 'ID do Projeto OpenPanel não foi informado.',
      };
    }

    const headers = this.openpanelAuth.getHeaders(clientId, clientSecret);
    if (!headers) {
      return {
        success: false,
        projectId: cleanProjectId,
        configured: false,
        error: 'Credenciais do OpenPanel (Client ID / Client Secret) não configuradas para este cliente.',
      };
    }

    const base = `${this.openpanelAuth.getApiUrl()}/insights/${encodeURIComponent(cleanProjectId)}`;

    try {
      const metricsRes = await this.fetchJson<RawMetricsResponse>(`${base}/metrics?range=${range}`, headers);

      const [pagesRes, referrerRes, deviceRes, browserRes, osRes, countryRes, utmRes, utmMediumRes, utmCampaignRes, liveRes, eventsRes] =
        await Promise.all([
          this.fetchJson<RawPageRow[]>(`${base}/pages?range=${range}`, headers).catch(() => [] as RawPageRow[]),
          this.fetchJson<RawBreakdownRow[]>(`${base}/referrer?range=${range}`, headers).catch(() => [] as RawBreakdownRow[]),
          this.fetchJson<RawBreakdownRow[]>(`${base}/device?range=${range}`, headers).catch(() => [] as RawBreakdownRow[]),
          this.fetchJson<RawBreakdownRow[]>(`${base}/browser?range=${range}`, headers).catch(() => [] as RawBreakdownRow[]),
          this.fetchJson<RawBreakdownRow[]>(`${base}/os?range=${range}`, headers).catch(() => [] as RawBreakdownRow[]),
          this.fetchJson<RawBreakdownRow[]>(`${base}/country?range=${range}`, headers).catch(() => [] as RawBreakdownRow[]),
          this.fetchJson<RawBreakdownRow[]>(`${base}/utm_source?range=${range}`, headers).catch(() => [] as RawBreakdownRow[]),
          this.fetchJson<RawBreakdownRow[]>(`${base}/utm_medium?range=${range}`, headers).catch(() => [] as RawBreakdownRow[]),
          this.fetchJson<RawBreakdownRow[]>(`${base}/utm_campaign?range=${range}`, headers).catch(() => [] as RawBreakdownRow[]),
          this.fetchJson<{ visitors: number }>(`${base}/live`, headers).catch(() => ({ visitors: 0 })),
          this.fetchJson<RawEventRow[]>(`${base}/events?range=${range}&limit=100`, headers).catch(() => [] as RawEventRow[]),
        ]);

      const overview: OpenPanelOverview = {
        uniqueVisitors: metricsRes.metrics?.unique_visitors || 0,
        totalSessions: metricsRes.metrics?.total_sessions || 0,
        totalScreenViews: metricsRes.metrics?.total_screen_views || 0,
        bounceRate: Math.round((metricsRes.metrics?.bounce_rate || 0) * 10) / 10,
        avgSessionDuration: Math.round(metricsRes.metrics?.avg_session_duration || 0),
        viewsPerSession: Math.round((metricsRes.metrics?.views_per_session || 0) * 100) / 100,
      };

      const timeline: OpenPanelTimelinePoint[] = (metricsRes.series || []).map(point => ({
        date: point.date?.split('T')[0] || '',
        uniqueVisitors: point.unique_visitors || 0,
        totalSessions: point.total_sessions || 0,
        totalScreenViews: point.total_screen_views || 0,
      }));

      const pages: OpenPanelPageMetric[] = (pagesRes || []).map(p => ({
        path: p.path || '/',
        origin: p.origin || '',
        sessions: p.sessions || 0,
        pageviews: p.pageviews || 0,
      }));

      const whatsappClicks = this.toWhatsappClicks(eventsRes);

      return {
        success: true,
        projectId: cleanProjectId,
        configured: true,
        overview,
        timeline,
        pages,
        referrers: this.toBreakdown(referrerRes),
        devices: this.toBreakdown(deviceRes),
        browsers: this.toBreakdown(browserRes),
        os: this.toBreakdown(osRes),
        countries: this.toBreakdown(countryRes),
        utmSources: this.toBreakdown(utmRes),
        utmMediums: this.toBreakdown(utmMediumRes),
        utmCampaigns: this.toBreakdown(utmCampaignRes),
        liveVisitors: liveRes?.visitors || 0,
        whatsappClicksCount: whatsappClicks.length,
        whatsappClicks,
      };
    } catch (error: any) {
      this.logger.error(`Erro ao consultar OpenPanel para o projeto ${cleanProjectId}:`, error);

      let userFriendlyError = error.message || 'Erro ao comunicar com a API do OpenPanel.';
      if (error.status === 401 || error.status === 403) {
        userFriendlyError = `A client key do OpenPanel não tem permissão para acessar o projeto "${cleanProjectId}". Verifique se a key configurada no backend é do tipo "root".`;
      } else if (error.status === 404) {
        userFriendlyError = `Projeto "${cleanProjectId}" não encontrado no OpenPanel. Verifique o ID do projeto.`;
      }

      return {
        success: false,
        projectId: cleanProjectId,
        configured: true,
        error: userFriendlyError,
      };
    }
  }
}
