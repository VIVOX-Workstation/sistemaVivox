export type MetricKey = 'reach' | 'views' | 'accountsEngaged' | 'profileViews';
export type Overview = Record<MetricKey, number | null>;
export interface InsightMedia {
  id: string; caption?: string; timestamp: string; permalink?: string; media_type: string;
  media_url?: string; thumbnail_url?: string;
  like_count?: number; comments_count?: number;
  insights?: { reach?: number | null; saved?: number | null; shares?: number | null; views?: number | null };
}
export interface ManagementData {
  followers?: {
    current: FollowerChange;
    previous: FollowerChange;
    historySince?: string;
  };
  period: { days: number; since: string; until: string; timezone: string };
  previousPeriod: { since: string; until: string };
  overview: Overview;
  previousOverview: Overview;
  recentMedia: InsightMedia[];
  syncedAt: string;
  warnings: string[];
  mediaCoverage: { complete: boolean; available: boolean; enriched: number; limit: number };
}
export interface FollowerChange {
  gained: number | null; lost: number | null; net: number | null;
  source: 'meta' | 'snapshots' | 'unavailable';
  observedSince?: string; observedUntil?: string;
}
export const numberLabel = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
export function comparison(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null) return { label: 'Sem comparação', tone: 'neutral', percent: null };
  if (previous === 0) return { label: current === 0 ? 'Sem alteração' : 'Base anterior zero', tone: 'neutral', percent: null };
  const percent = (current - previous) / previous * 100;
  return { label: percent === 0 ? 'Sem alteração' : `${percent > 0 ? '+' : '−'}${numberLabel(Math.abs(percent))}%`, tone: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral', percent };
}
export function metricDelta(current: number | null | undefined, previous: number | null | undefined, mode: 'percent' | 'points' | 'absolute' = 'percent') {
  if (current == null || previous == null || !Number.isFinite(current) || !Number.isFinite(previous)) return null;
  const delta = current - previous;
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const absolute = `${sign}${numberLabel(Math.abs(delta))}${mode === 'points' ? ' p.p.' : ''}`;
  return { delta, absolute, label: mode === 'percent' && previous > 0 ? `${sign}${numberLabel(Math.abs(delta / previous * 100))}%` : absolute, tone: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral' };
}
export function periodLabel(period: { since: string; until: string }) {
  const format = (date: Date) => date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  return `${format(new Date(period.since))} a ${format(new Date(Date.parse(period.until) - 1))}`;
}
export type RankingKey = 'interactions' | 'reach' | 'saved' | 'shares';
export function mediaValue(media: InsightMedia, key: RankingKey): number | null {
  if (key === 'interactions') return media.like_count == null || media.comments_count == null ? null : media.like_count + media.comments_count;
  return media.insights?.[key] ?? null;
}
export function rankedMedia(data: ManagementData, key: RankingKey) {
  return data.recentMedia.filter(media => {
    const date = Date.parse(media.timestamp);
    return date >= Date.parse(data.period.since) && date < Date.parse(data.period.until) && mediaValue(media, key) !== null;
  }).sort((a, b) => mediaValue(b, key)! - mediaValue(a, key)! || Date.parse(b.timestamp) - Date.parse(a.timestamp) || a.id.localeCompare(b.id));
}
export interface ManagementInsight { title: string; evidence: string; action: string; tone: 'positive' | 'attention' | 'neutral' }
export function managementInsights(data: ManagementData): ManagementInsight[] {
  const result: ManagementInsight[] = [];
  const reach = comparison(data.overview.reach, data.previousOverview.reach);
  if (reach.percent !== null) {
    result.push({
      title: reach.percent > 0 ? 'Seu alcance cresceu' : reach.percent < 0 ? 'O alcance merece atenção' : 'O alcance ficou estável',
      evidence: `${numberLabel(data.overview.reach)} contas alcançadas, frente a ${numberLabel(data.previousOverview.reach)} no período anterior (${reach.label.toLowerCase()}).`,
      action: reach.percent < 0 ? 'Revise a frequência e os temas publicados. Teste uma mudança por vez no próximo período.' : 'Observe os temas dos conteúdos com maior alcance e teste uma nova publicação sobre eles.',
      tone: reach.percent > 0 ? 'positive' : reach.percent < 0 ? 'attention' : 'neutral',
    });
  } else {
    result.push({ title: 'Antes de concluir, confira a base', evidence: data.overview.reach == null ? 'A Meta não disponibilizou o alcance para este intervalo.' : `Alcance atual: ${numberLabel(data.overview.reach)}. ${data.previousOverview.reach === 0 ? 'A base anterior é zero; não é possível calcular crescimento percentual.' : 'O alcance anterior não está disponível.'}`, action: 'Consulte outro período e confira as permissões da conexão se a ausência de dados persistir.', tone: 'neutral' });
  }
  const ranking = rankedMedia(data, 'interactions');
  const best = ranking[0];
  if (best && mediaValue(best, 'interactions')! > 0) {
    const tied = ranking.filter(item => mediaValue(item, 'interactions') === mediaValue(best, 'interactions')).length;
    result.push({ title: tied > 1 ? 'Há conteúdos empatados no destaque' : 'Um conteúdo para estudar', evidence: `${tied > 1 ? `${tied} publicações têm` : 'O primeiro conteúdo do ranking tem'} ${numberLabel(mediaValue(best, 'interactions'))} curtidas + comentários, entre ${ranking.length} publicações com dados.`, action: 'Abra o ranking abaixo e avalie o tema e a chamada desses conteúdos antes de planejar o próximo teste.', tone: 'positive' });
  } else {
    result.push({ title: 'Conteúdo: ainda sem destaque mensurável', evidence: !data.mediaCoverage.available ? 'A consulta de publicações não foi concluída.' : data.recentMedia.length === 0 ? 'Nenhuma publicação foi encontrada na amostra deste período.' : 'A amostra não tem curtidas e comentários suficientes para apontar um destaque.', action: 'Confira o período e o calendário editorial. Defina um conteúdo com objetivo claro para acompanhar no próximo relatório.', tone: 'neutral' });
  }
  const visits = comparison(data.overview.profileViews, data.previousOverview.profileViews);
  result.push(visits.percent !== null ? {
    title: visits.percent > 0 ? 'Mais visitas ao perfil' : visits.percent < 0 ? 'Menos visitas ao perfil' : 'Visitas ao perfil estáveis',
    evidence: `${numberLabel(data.overview.profileViews)} visitas, frente a ${numberLabel(data.previousOverview.profileViews)} (${visits.label.toLowerCase()}). Visitas não equivalem a contatos ou vendas.`,
    action: 'Revise a bio e a chamada para contato. Use links identificados para medir quais visitas geram oportunidades.', tone: visits.percent < 0 ? 'attention' : 'neutral',
  } : { title: 'Próximo passo: medir oportunidades', evidence: 'Estes dados mostram desempenho no Instagram. Contatos e vendas ainda não são medidos neste painel.', action: 'Defina uma chamada para contato e um link rastreável para conectar o conteúdo ao objetivo comercial.', tone: 'neutral' });
  return result;
}
