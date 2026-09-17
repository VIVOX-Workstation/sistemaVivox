import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { InstagramAccountProfile, InstagramDashboardData, InstagramMediaItem, InstagramOverview } from './interfaces';

const DAY = 86400;
const emptyOverview = (): InstagramOverview => ({ reach: null, views: null, accountsEngaged: null, profileViews: null });
const numeric = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

@Injectable()
export class InstagramService {
  private readonly cache = new Map<string, { expires: number; data: InstagramDashboardData }>();
  private readonly pending = new Map<string, Promise<InstagramDashboardData>>();

  // Never log URLs or raw Graph errors: they can contain access tokens.
  private async graph(path: string, token: string, params: Record<string, string> = {}): Promise<any | null> {
    const url = new URL(`https://graph.facebook.com/v26.0/${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    try {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) return null;
      const data = await response.json();
      return data.error ? null : data;
    } catch { return null; }
  }

  async getProfile(id: string, token: string): Promise<InstagramAccountProfile> {
    const data = await this.graph(id, token, { fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count' });
    if (!data?.id) throw new BadRequestException('Não foi possível consultar o Instagram. Verifique a conexão e as permissões da conta.');
    return data;
  }

  async getAccountInsights(id: string, token: string, since: number, until: number): Promise<InstagramOverview> {
    const metrics = { reach: 'reach', views: 'views', accountsEngaged: 'accounts_engaged', profileViews: 'profile_views' } as const;
    const overview = emptyOverview();
    // Independent requests isolate unsupported metrics. Unique audiences are never summed across days.
    await Promise.all(Object.entries(metrics).map(async ([key, metric]) => {
      const data = await this.graph(`${id}/insights`, token, {
        metric, period: 'day', metric_type: 'total_value', since: String(since), until: String(until),
      });
      const item = data?.data?.find((entry: any) => entry.name === metric);
      overview[key as keyof InstagramOverview] = numeric(item?.total_value?.value);
    }));
    return overview;
  }

  private async media(id: string, token: string, since: number, until: number) {
    const items = new Map<string, InstagramMediaItem>();
    let after: string | undefined;
    let complete = false;
    let available = true;
    let fetched = 0;
    for (let page = 0; page < 3; page++) {
      const data = await this.graph(`${id}/media`, token, {
        fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count',
        limit: '100', ...(after ? { after } : {}),
      });
      if (!Array.isArray(data?.data)) { available = false; break; }
      fetched += data.data.length;
      for (const item of data.data) {
        const timestamp = Date.parse(item.timestamp) / 1000;
        if (timestamp >= since && timestamp < until) items.set(item.id, item);
      }
      const crossedStart = data.data.some((item: any) => Date.parse(item.timestamp) / 1000 < since);
      if (!data.paging?.next || crossedStart) { complete = true; break; }
      const cursor = data.paging?.cursors?.after;
      if (!cursor || cursor === after) break;
      after = cursor;
    }
    const recentMedia = [...items.values()].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    const sample = recentMedia.slice(0, 30);
    for (let index = 0; index < sample.length; index += 5) {
      await Promise.all(sample.slice(index, index + 5).map(async (item) => {
        const data = await this.graph(`${item.id}/insights`, token, { metric: 'reach,saved,shares,views' });
        const value = (name: string) => {
          const entry = data?.data?.find((metric: any) => metric.name === name);
          return numeric(entry?.total_value?.value ?? entry?.values?.[0]?.value);
        };
        item.insights = { reach: value('reach'), saved: value('saved'), shares: value('shares'), views: value('views') };
      }));
    }
    return { recentMedia, coverage: { complete, available, fetched, enriched: sample.length, limit: 30 } };
  }

  async getDashboard(id: string, token: string, days = 30, refresh = false): Promise<InstagramDashboardData> {
    if (![7, 30, 90].includes(days)) throw new BadRequestException('Escolha um período de 7, 30 ou 90 dias.');
    const until = Math.floor(Date.now() / (DAY * 1000)) * DAY;
    const key = `${id}:${createHash('sha256').update(token).digest('hex')}:${days}:${until}`;
    const cached = this.cache.get(key);
    if (!refresh && cached && cached.expires > Date.now()) return cached.data;
    const pending = this.pending.get(key);
    if (pending) return pending;
    const request = this.collect(id, token, days, until);
    this.pending.set(key, request);
    try {
      const data = await request;
      if (this.cache.size >= 100) this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(key, { data, expires: Date.now() + 5 * 60 * 1000 });
      return data;
    } finally { this.pending.delete(key); }
  }

  private async collect(id: string, token: string, days: number, until: number): Promise<InstagramDashboardData> {
    const since = until - days * DAY;
    const previousSince = since - days * DAY;
    const profile = await this.getProfile(id, token);
    const [overview, previousOverview, media, daily] = await Promise.all([
      this.getAccountInsights(id, token, since, until),
      this.getAccountInsights(id, token, previousSince, since),
      this.media(id, token, since, until),
      this.graph(`${id}/insights`, token, { metric: 'reach', period: 'day', metric_type: 'time_series', since: String(since), until: String(until) }),
    ]);
    const warnings: string[] = [];
    if (Object.values(overview).some(value => value === null)) warnings.push('Algumas métricas do período não foram disponibilizadas pela Meta. Elas aparecem como “—”, e não como zero.');
    if (Object.values(previousOverview).some(value => value === null)) warnings.push('A comparação está disponível apenas nas métricas retornadas para os dois períodos.');
    if (!media.coverage.available) warnings.push('A consulta de publicações falhou. O ranking pode estar incompleto.');
    else if (!media.coverage.complete) warnings.push('Foram consultadas até 300 publicações. O ranking representa apenas a amostra recuperada.');
    if (media.recentMedia.length > 30) warnings.push('Alcance, salvamentos e compartilhamentos consultados nas 30 publicações mais recentes do período.');
    if (media.recentMedia.slice(0, 30).some(item => item.insights?.reach == null || item.insights?.saved == null || item.insights?.shares == null)) warnings.push('Algumas publicações não retornaram todas as métricas. Confira a cobertura ao selecionar cada ranking.');
    const history = daily?.data?.find((item: any) => item.name === 'reach')?.values || [];
    return {
      account: profile,
      period: { days, since: new Date(since * 1000).toISOString(), until: new Date(until * 1000).toISOString(), timezone: 'UTC' },
      previousPeriod: { since: new Date(previousSince * 1000).toISOString(), until: new Date(since * 1000).toISOString() },
      overview: { ...overview, totalFollowers: numeric(profile.followers_count) }, previousOverview,
      syncedAt: new Date().toISOString(), warnings, mediaCoverage: media.coverage,
      insightsHistory: history.filter((item: any) => numeric(item.value) !== null && Number.isFinite(Date.parse(item.end_time)))
        .map((item: any) => ({ date: new Date(Date.parse(item.end_time) - DAY * 1000).toISOString().slice(0, 10), reach: item.value }))
        .filter((item: any) => Date.parse(item.date) / 1000 >= since && Date.parse(item.date) / 1000 < until),
      recentMedia: media.recentMedia,
    };
  }
}
