import { Injectable, Logger } from '@nestjs/common';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuthService } from './google-auth.service';
import {
  GA4MetricsResult,
  GA4Overview,
  GA4TimelinePoint,
  GA4TrafficSource,
  GA4DeviceDistribution,
  GA4CityMetric,
  GA4EventMetric,
} from './interfaces';

@Injectable()
export class GA4Service {
  private readonly logger = new Logger(GA4Service.name);
  private analyticsClient: BetaAnalyticsDataClient | null = null;

  constructor(private readonly googleAuth: GoogleAuthService) {}

  private getClient(): BetaAnalyticsDataClient | null {
    const creds = this.googleAuth.getCredentials();
    if (!creds || !creds.client_email || !creds.private_key) {
      return null;
    }

    if (!this.analyticsClient) {
      this.analyticsClient = new BetaAnalyticsDataClient({
        credentials: {
          client_email: creds.client_email,
          private_key: creds.private_key,
        },
        projectId: creds.project_id,
      });
    }

    return this.analyticsClient;
  }

  /**
   * Consulta métricas completas de uma propriedade do GA4
   * @param propertyId ID da propriedade do GA4 (ex: "481928472" ou "properties/481928472")
   * @param startDate Data inicial (ex: "30daysAgo", "7daysAgo", ou "YYYY-MM-DD")
   * @param endDate Data final (ex: "today", "yesterday", ou "YYYY-MM-DD")
   */
  async getGA4Metrics(
    propertyId: string,
    startDate: string = '30daysAgo',
    endDate: string = 'today',
  ): Promise<GA4MetricsResult> {
    const cleanPropertyId = propertyId.replace(/^properties\//, '').trim();
    if (!cleanPropertyId) {
      return {
        success: false,
        propertyId: '',
        configured: false,
        error: 'ID da propriedade GA4 não foi informado.',
      };
    }

    const client = this.getClient();
    const serviceAccountEmail = this.googleAuth.getServiceAccountEmail();

    if (!client) {
      return {
        success: false,
        propertyId: cleanPropertyId,
        configured: false,
        error: 'Credenciais do Google Service Account não configuradas no backend.',
      };
    }

    const propertyName = `properties/${cleanPropertyId}`;

    try {
      // Executa relatórios em paralelo
      const [
        overviewResponse,
        timelineResponse,
        trafficResponse,
        devicesResponse,
        citiesResponse,
        eventsResponse,
      ] = await Promise.all([
        // 1. Overview (Resumo Geral)
        client.runReport({
          property: propertyName,
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'engagementRate' },
            { name: 'averageSessionDuration' },
            { name: 'eventCount' },
          ],
        }),

        // 2. Timeline diária
        client.runReport({
          property: propertyName,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
          ],
          orderBys: [
            {
              dimension: {
                dimensionName: 'date',
                orderType: 'ALPHANUMERIC',
              },
              desc: false,
            },
          ],
        }),

        // 3. Origens de Tráfego (Canais / Fontes)
        client.runReport({
          property: propertyName,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
          ],
          limit: 10,
          orderBys: [
            {
              metric: { metricName: 'sessions' },
              desc: true,
            },
          ],
        }),

        // 4. Dispositivos (Mobile / Desktop / Tablet)
        client.runReport({
          property: propertyName,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
          ],
        }),

        // 5. Cidades
        client.runReport({
          property: propertyName,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'city' }, { name: 'country' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
          ],
          limit: 10,
          orderBys: [
            {
              metric: { metricName: 'activeUsers' },
              desc: true,
            },
          ],
        }),

        // 6. Principais Eventos (WhatsApp, formulários, cliques, etc.)
        client.runReport({
          property: propertyName,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'eventName' }],
          metrics: [
            { name: 'eventCount' },
            { name: 'totalUsers' },
          ],
          limit: 15,
          orderBys: [
            {
              metric: { metricName: 'eventCount' },
              desc: true,
            },
          ],
        }),
      ]);

      // --- Parser do Overview ---
      const overviewRow = overviewResponse[0]?.rows?.[0];
      const activeUsers = Number(overviewRow?.metricValues?.[0]?.value || 0);
      const newUsers = Number(overviewRow?.metricValues?.[1]?.value || 0);
      const sessions = Number(overviewRow?.metricValues?.[2]?.value || 0);
      const screenPageViews = Number(overviewRow?.metricValues?.[3]?.value || 0);
      const engagementRate = Math.round(Number(overviewRow?.metricValues?.[4]?.value || 0) * 1000) / 10; // %
      const averageSessionDuration = Math.round(Number(overviewRow?.metricValues?.[5]?.value || 0)); // Segundos
      const eventCount = Number(overviewRow?.metricValues?.[6]?.value || 0);

      const overview: GA4Overview = {
        activeUsers,
        newUsers,
        sessions,
        screenPageViews,
        engagementRate,
        averageSessionDuration,
        eventCount,
      };

      // --- Parser da Timeline ---
      const timeline: GA4TimelinePoint[] = (timelineResponse[0]?.rows || []).map(row => {
        const rawDate = row.dimensionValues?.[0]?.value || '';
        // Formata YYYYMMDD para YYYY-MM-DD
        const formattedDate = rawDate.length === 8
          ? `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`
          : rawDate;

        return {
          date: formattedDate,
          activeUsers: Number(row.metricValues?.[0]?.value || 0),
          sessions: Number(row.metricValues?.[1]?.value || 0),
          screenPageViews: Number(row.metricValues?.[2]?.value || 0),
        };
      });

      // --- Parser de Origens de Tráfego ---
      const totalTrafficSessions = (trafficResponse[0]?.rows || []).reduce(
        (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0),
        0
      );
      const trafficSources: GA4TrafficSource[] = (trafficResponse[0]?.rows || []).map(row => {
        const sCount = Number(row.metricValues?.[0]?.value || 0);
        return {
          sourceMedium: row.dimensionValues?.[0]?.value || '(direto / nenhum)',
          sessions: sCount,
          activeUsers: Number(row.metricValues?.[1]?.value || 0),
          percentage: totalTrafficSessions > 0 ? Math.round((sCount / totalTrafficSessions) * 1000) / 10 : 0,
        };
      });

      // --- Parser de Dispositivos ---
      const totalDeviceUsers = (devicesResponse[0]?.rows || []).reduce(
        (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0),
        0
      );
      const devices: GA4DeviceDistribution[] = (devicesResponse[0]?.rows || []).map(row => {
        const uCount = Number(row.metricValues?.[0]?.value || 0);
        return {
          device: row.dimensionValues?.[0]?.value || 'outro',
          activeUsers: uCount,
          percentage: totalDeviceUsers > 0 ? Math.round((uCount / totalDeviceUsers) * 1000) / 10 : 0,
        };
      });

      // --- Parser de Cidades ---
      const cities: GA4CityMetric[] = (citiesResponse[0]?.rows || [])
        .filter(row => row.dimensionValues?.[0]?.value !== '(not set)')
        .map(row => ({
          city: row.dimensionValues?.[0]?.value || 'Desconhecida',
          country: row.dimensionValues?.[1]?.value || 'Brasil',
          activeUsers: Number(row.metricValues?.[0]?.value || 0),
          sessions: Number(row.metricValues?.[1]?.value || 0),
        }));

      // --- Parser de Eventos ---
      const events: GA4EventMetric[] = (eventsResponse[0]?.rows || []).map(row => ({
        eventName: row.dimensionValues?.[0]?.value || '',
        eventCount: Number(row.metricValues?.[0]?.value || 0),
        totalUsers: Number(row.metricValues?.[1]?.value || 0),
      }));

      return {
        success: true,
        propertyId: cleanPropertyId,
        configured: true,
        overview,
        timeline,
        trafficSources,
        devices,
        cities,
        events,
      };
    } catch (error: any) {
      this.logger.error(`Erro ao consultar GA4 para property ${cleanPropertyId}:`, error);

      let userFriendlyError = error.message || 'Erro ao comunicar com Google Analytics Data API.';
      const msg = error.message || '';

      if (msg.includes('PERMISSION_DENIED') || error.code === 7 || msg.includes('does not have sufficient permissions')) {
        userFriendlyError = `A Conta de Serviço (${serviceAccountEmail || 'configurada'}) não possui permissão de leitura na propriedade GA4 (ID: ${cleanPropertyId}). Adicione esse e-mail como Leitor nas permissões da propriedade no GA4.`;
      } else if (msg.includes('INVALID_ARGUMENT') || msg.includes('not found')) {
        userFriendlyError = `ID de propriedade GA4 inválido ou inexistente: "${cleanPropertyId}". Verifique se o ID numérico está correto.`;
      }

      return {
        success: false,
        propertyId: cleanPropertyId,
        configured: true,
        error: userFriendlyError,
      };
    }
  }
}
