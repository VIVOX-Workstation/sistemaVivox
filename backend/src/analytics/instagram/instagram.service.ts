import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  InstagramAccountProfile,
  InstagramDashboardData,
  InstagramInsightsResponse,
  InstagramMediaItem,
  InstagramMediaListResponse,
} from './interfaces';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private readonly graphApiVersion = 'v26.0';
  private readonly graphApiBase = 'https://graph.facebook.com';

  /**
   * Obtém o perfil básico da conta profissional do Instagram
   */
  async getProfile(instagramAccountId: string, accessToken: string): Promise<InstagramAccountProfile> {
    const url = new URL(`${this.graphApiBase}/${this.graphApiVersion}/${instagramAccountId}`);
    url.searchParams.set(
      'fields',
      'id,username,name,profile_picture_url,followers_count,follows_count,media_count',
    );
    url.searchParams.set('access_token', accessToken);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      this.logger.error(`Erro ao buscar perfil do Instagram ${instagramAccountId}: ${data.error?.message}`);
      throw new BadRequestException(`Erro no Instagram: ${data.error?.message}`);
    }

    return {
      id: data.id,
      username: data.username,
      name: data.name,
      profile_picture_url: data.profile_picture_url,
      followers_count: data.followers_count ?? 0,
      follows_count: data.follows_count ?? 0,
      media_count: data.media_count ?? 0,
    };
  }

  /**
   * Busca métricas históricas de alcance e impressões da conta
   */
  async getAccountInsights(
    instagramAccountId: string,
    accessToken: string,
    days: number = 30,
  ): Promise<{
    overview: {
      reach: number;
      impressions: number;
      accountsEngaged: number;
      profileViews: number;
    };
    history: Array<{ date: string; reach: number; impressions: number }>;
  }> {
    const until = Math.floor(Date.now() / 1000);
    const since = until - days * 24 * 60 * 60;

    const url = new URL(`${this.graphApiBase}/${this.graphApiVersion}/${instagramAccountId}/insights`);
    url.searchParams.set('metric', 'impressions,reach,profile_views,accounts_engaged');
    url.searchParams.set('period', 'day');
    url.searchParams.set('since', String(since));
    url.searchParams.set('until', String(until));
    url.searchParams.set('access_token', accessToken);

    try {
      const res = await fetch(url.toString());
      const data = (await res.json()) as InstagramInsightsResponse & { error?: any };

      if (!res.ok) {
        this.logger.warn(`Aviso ao buscar insights de ${instagramAccountId}: ${data.error?.message}`);
        return {
          overview: { reach: 0, impressions: 0, accountsEngaged: 0, profileViews: 0 },
          history: [],
        };
      }

      let totalReach = 0;
      let totalImpressions = 0;
      let totalEngaged = 0;
      let totalProfileViews = 0;

      const historyMap = new Map<string, { date: string; reach: number; impressions: number }>();

      (data.data || []).forEach((item) => {
        if (item.name === 'reach') {
          item.values?.forEach((v) => {
            totalReach += v.value || 0;
            const dateStr = v.end_time ? v.end_time.split('T')[0] : '';
            if (dateStr) {
              const current = historyMap.get(dateStr) || { date: dateStr, reach: 0, impressions: 0 };
              current.reach = v.value || 0;
              historyMap.set(dateStr, current);
            }
          });
        } else if (item.name === 'impressions') {
          item.values?.forEach((v) => {
            totalImpressions += v.value || 0;
            const dateStr = v.end_time ? v.end_time.split('T')[0] : '';
            if (dateStr) {
              const current = historyMap.get(dateStr) || { date: dateStr, reach: 0, impressions: 0 };
              current.impressions = v.value || 0;
              historyMap.set(dateStr, current);
            }
          });
        } else if (item.name === 'accounts_engaged') {
          item.values?.forEach((v) => {
            totalEngaged += v.value || 0;
          });
        } else if (item.name === 'profile_views') {
          item.values?.forEach((v) => {
            totalProfileViews += v.value || 0;
          });
        }
      });

      const history = Array.from(historyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      return {
        overview: {
          reach: totalReach,
          impressions: totalImpressions,
          accountsEngaged: totalEngaged,
          profileViews: totalProfileViews,
        },
        history,
      };
    } catch (err: any) {
      this.logger.error(`Exceção ao buscar insights do Instagram: ${err.message}`);
      return {
        overview: { reach: 0, impressions: 0, accountsEngaged: 0, profileViews: 0 },
        history: [],
      };
    }
  }

  /**
   * Busca publicações e reels recentes com contadores de engajamento
   */
  async getRecentMedia(
    instagramAccountId: string,
    accessToken: string,
    limit: number = 12,
  ): Promise<InstagramMediaItem[]> {
    const url = new URL(`${this.graphApiBase}/${this.graphApiVersion}/${instagramAccountId}/media`);
    url.searchParams.set(
      'fields',
      'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count',
    );
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('access_token', accessToken);

    try {
      const res = await fetch(url.toString());
      const data = (await res.json()) as InstagramMediaListResponse & { error?: any };

      if (!res.ok) {
        this.logger.warn(`Erro ao buscar mídias de ${instagramAccountId}: ${data.error?.message}`);
        return [];
      }

      return (data.data || []).map((item) => ({
        id: item.id,
        caption: item.caption,
        media_type: item.media_type,
        media_url: item.media_url,
        permalink: item.permalink,
        thumbnail_url: item.thumbnail_url,
        timestamp: item.timestamp,
        like_count: item.like_count ?? 0,
        comments_count: item.comments_count ?? 0,
      }));
    } catch (err: any) {
      this.logger.error(`Exceção ao buscar mídias do Instagram: ${err.message}`);
      return [];
    }
  }

  /**
   * Monta o dashboard consolidado para exibição no frontend
   */
  async getDashboard(
    instagramAccountId: string,
    accessToken: string,
    days: number = 30,
  ): Promise<InstagramDashboardData> {
    const [profile, insightsData, recentMedia] = await Promise.all([
      this.getProfile(instagramAccountId, accessToken),
      this.getAccountInsights(instagramAccountId, accessToken, days),
      this.getRecentMedia(instagramAccountId, accessToken, 12),
    ]);

    return {
      account: profile,
      period: { days },
      overview: {
        reach: insightsData.overview.reach,
        impressions: insightsData.overview.impressions,
        accountsEngaged: insightsData.overview.accountsEngaged,
        totalFollowers: profile.followers_count ?? 0,
        profileViews: insightsData.overview.profileViews,
      },
      insightsHistory: insightsData.history,
      recentMedia,
    };
  }
}
