import { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  Info,
  Sparkles,
  Target,
  Play,
  Layers,
  Image as ImageIcon,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { metricDelta, managementInsights, mediaValue, numberLabel, periodLabel, rankedMedia } from './instagramInsights';
import type { ManagementData, RankingKey } from './instagramInsights';

export function MetricComparison({ current, previous, mode = 'percent' }: { current?: number | null; previous?: number | null; mode?: 'percent' | 'points' | 'absolute' }) {
  const change = metricDelta(current, previous, mode);
  const Icon = change?.tone === 'up' ? ArrowUpRight : change?.tone === 'down' ? ArrowDownRight : Minus;
  return <div className="mt-2 flex flex-col items-center gap-1 text-xs">
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${change?.tone === 'up' ? 'bg-emerald-50 text-emerald-700' : change?.tone === 'down' ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-500'}`}><Icon aria-hidden="true" className="h-3.5 w-3.5" />{change ? change.delta === 0 ? 'Sem alteração' : change.label : 'Sem comparação'}</span>
    {change && mode === 'percent' && previous! > 0 && <span className="text-stone-500">{change.absolute} em relação ao anterior</span>}
    {previous != null && <span className="text-stone-500">{numberLabel(previous)}{mode === 'points' ? '%' : ''} no período anterior</span>}
    {change && previous === 0 && current !== 0 && mode === 'percent' && <span className="text-stone-400">Base anterior zero · sem percentual</span>}
  </div>;
}

export function FollowersSummary({ data }: { data: ManagementData }) {
  const current = data.followers?.current;
  const previous = data.followers?.previous;
  const Icon = current?.net != null && current.net > 0 ? ArrowUpRight : current?.net != null && current.net < 0 ? ArrowDownRight : Minus;
  const date = (value: string) => new Date(value).toLocaleString('pt-BR', { timeZone: 'UTC' });
  return <div className="flex min-h-36 flex-col items-center justify-center rounded-xl bg-[#FAFAF9] px-4 py-5 text-center">
    <p className="text-sm font-medium text-stone-700">Saldo de seguidores</p>
    <p className={`mt-4 flex items-center gap-1 text-3xl font-semibold tabular-nums ${current?.net != null && current.net > 0 ? 'text-emerald-700' : current?.net != null && current.net < 0 ? 'text-red-700' : 'text-stone-700'}`}><Icon aria-hidden="true" className="h-5 w-5" />{current?.net != null ? `${current.net > 0 ? '+' : ''}${numberLabel(current.net)}` : '—'}</p>
    {current?.source === 'meta' && <p className="mt-2 text-xs text-stone-500">{numberLabel(current.gained)} ganhos · {numberLabel(current.lost)} perdidos</p>}
    {current?.net != null && previous?.net != null && current.source === 'meta' && previous.source === 'meta' && <MetricComparison current={current.net} previous={previous.net} mode="absolute" />}
    {current?.source === 'snapshots' ? <p className="mt-2 text-xs leading-relaxed text-stone-500">Variação observada entre {date(current.observedSince!)} e {date(current.observedUntil!)} (UTC). Aproximação pelos registros disponíveis.</p> : current?.net == null ? <p className="mt-2 text-xs leading-relaxed text-stone-500">A Meta não informou a variação. {data.followers?.historySince ? `Histórico local iniciado em ${date(data.followers.historySince)} (UTC); ainda faltam registros nas datas de comparação.` : 'Sem histórico suficiente para comparar.'}</p> : <p className="mt-2 text-xs text-stone-500">Entradas menos saídas no período</p>}
  </div>;
}

export function InstagramManagementInsights({ data, loading, section = 'summary' }: { data: ManagementData | null; loading: boolean; section?: 'summary' | 'ranking' }) {
  const [rankingKey, setRankingKey] = useState<RankingKey>('interactions');
  const [formatFilter, setFormatFilter] = useState<'TODOS' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'IMAGE'>('TODOS');
  const [expanded, setExpanded] = useState(false);
  if (loading && section === 'ranking') return null;
  if (loading) return <div role="status" className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">Preparando comparação e leitura do período…</div>;
  if (!data?.previousOverview || !data?.period?.since) return null;
  const insights = managementInsights(data);
  const allRanking = rankedMedia(data, rankingKey);
  const ranking = formatFilter === 'TODOS' ? allRanking : allRanking.filter(item => item.media_type === formatFilter);
  const labels: Record<RankingKey, string> = { interactions: 'Curtidas + comentários', reach: 'Alcance', saved: 'Salvamentos', shares: 'Compartilhamentos' };
  return <div className="space-y-5">
    {section === 'summary' && <section className="rounded-2xl border border-[#E8E7E4] bg-white p-5 sm:p-6" aria-label="Leitura do período">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="flex items-center gap-2 text-base font-semibold text-stone-800"><Sparkles className="h-4 w-4 text-[#B89455]" />O que merece sua atenção</h3>
          <p className="mt-1 text-xs text-stone-500">{periodLabel(data.period)} · comparação com {periodLabel(data.previousPeriod)}</p></div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#FAF7F0] px-2.5 py-1 text-xs text-[#8A6828]"><Target className="h-3 w-3" />Leitura para o gestor</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {insights.map((insight, index) => <article key={insight.title} className="flex flex-col rounded-xl border border-stone-100 p-4">
          <span className={`mb-3 text-xs font-medium ${insight.tone === 'positive' ? 'text-emerald-700' : insight.tone === 'attention' ? 'text-amber-700' : 'text-[#8A6828]'}`}>0{index + 1} · {insight.tone === 'positive' ? 'Destaque' : insight.tone === 'attention' ? 'Atenção' : 'Oportunidade'}</span>
          <h4 className="text-sm font-semibold text-stone-800">{insight.title}</h4>
          <p className="mt-2 mb-4 text-sm leading-relaxed text-stone-500">{insight.evidence}</p>
          <div className="mt-auto border-t border-stone-100 pt-3"><p className="text-xs font-semibold text-[#8A6828]">Próxima ação sugerida</p><p className="mt-1 text-sm leading-relaxed text-stone-600">{insight.action}</p></div>
        </article>)}
      </div>
      <details className="mt-4 text-xs text-stone-500">
        <summary className="cursor-pointer flex items-center gap-1.5"><Info className="h-3.5 w-3.5" />Dados e critérios desta análise {data.warnings.length > 0 ? '· disponibilidade parcial' : ''}</summary>
        <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
          <p>Consulta concluída em {new Date(data.syncedAt).toLocaleString('pt-BR')}. Datas em UTC. Se o intervalo inclui hoje, os resultados ainda são parciais. Os dados são reutilizados por até 5 minutos. Use Atualizar para consultar novamente.</p>
          <p>Sugestões calculadas a partir dos dados disponíveis. São hipóteses para testar; não identificam a causa de uma mudança. Seguidores são o total atual. O saldo do período usa entradas e saídas da Meta ou, quando indicado, a diferença entre registros locais próximos das datas selecionadas.</p>
          {data.warnings.map(warning => <p key={warning}>{warning}</p>)}
        </div>
      </details>
    </section>}

    {section === 'ranking' && <section className="rounded-2xl border border-[#E8E7E4] bg-white p-5 sm:p-6" aria-label="Ranking de conteúdos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-800">
            <CheckCircle2 className="h-4 w-4 text-[#B89455]" />
            Conteúdos que deram resultado
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            Publicados no período · métricas acumuladas até a consulta
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro por Formato */}
          <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-[#FAFAF9] p-1 text-xs">
            {(['TODOS', 'VIDEO', 'CAROUSEL_ALBUM', 'IMAGE'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => { setFormatFilter(fmt); setExpanded(false); }}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  formatFilter === fmt
                    ? 'bg-white text-[#8A6828] shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {fmt === 'TODOS' ? 'Todos' : fmt === 'VIDEO' ? 'Reels' : fmt === 'CAROUSEL_ALBUM' ? 'Carrossel' : 'Post'}
              </button>
            ))}
          </div>

          {/* Ordenação por Métrica */}
          <select
            aria-label="Ordenar ranking por"
            value={rankingKey}
            onChange={event => { setRankingKey(event.target.value as RankingKey); setExpanded(false); }}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 font-medium cursor-pointer"
          >
            {Object.entries(labels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
          </select>
        </div>
      </div>

      <p className="my-4 text-xs text-stone-500">
        {ranking.length} de {data.recentMedia.length} publicações recuperadas com dados de {labels[rankingKey].toLowerCase()}
        {formatFilter !== 'TODOS' ? ` (${formatFilter === 'VIDEO' ? 'Reels' : formatFilter === 'CAROUSEL_ALBUM' ? 'Carrossel' : 'Post'})` : ''}.
        {' '}{data.mediaCoverage.complete ? 'Busca de publicações concluída para o intervalo.' : 'Amostra parcial: não representa necessariamente todo o período.'} Valores ausentes não entram no ranking.
      </p>

      {ranking.length === 0 ? (
        <div className="rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-500">
          Sem publicações com dados suficientes para este filtro ou ranking. Experimente outro formato, métrica ou período.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs text-stone-500">
                <th className="py-3 pr-4 font-medium">Conteúdo</th>
                <th className="px-3 font-medium">Formato</th>
                <th className="px-3 text-right font-medium">{labels[rankingKey]}</th>
                <th className="pl-3 w-10"><span className="sr-only">Abrir publicação</span></th>
              </tr>
            </thead>
            <tbody>
              {ranking.slice(0, expanded ? 20 : 5).map((item, index) => {
                const thumbnailUrl = item.media_type === 'VIDEO'
                  ? (item.thumbnail_url || item.media_url)
                  : (item.media_url || item.thumbnail_url);
                return (
                  <tr key={item.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 pr-4 min-w-[280px]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FAF2E4] text-[11px] font-bold text-[#8A6828] border border-[#E8D4B4]/60">
                          #{index + 1}
                        </span>

                        {/* Miniatura do post */}
                        <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-[#FAF7F0] border border-stone-200/80 group/thumb">
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={item.caption || 'Publicação'}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover/thumb:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null}

                          {/* Fallback de ícone para quando não houver imagem ou ela falhar */}
                          <div className="absolute inset-0 -z-10 flex items-center justify-center bg-[#FAF7F0] text-[#A28B64]">
                            {item.media_type === 'VIDEO' ? (
                              <Play className="h-5 w-5" />
                            ) : item.media_type === 'CAROUSEL_ALBUM' ? (
                              <Layers className="h-5 w-5" />
                            ) : (
                              <ImageIcon className="h-5 w-5" />
                            )}
                          </div>

                          {/* Indicador sobre a miniatura se for vídeo ou carrossel */}
                          {item.media_type === 'VIDEO' && (
                            <div className="absolute bottom-1 right-1 rounded bg-black/60 p-0.5 text-white shadow-xs" title="Reels / Vídeo">
                              <Play className="h-2.5 w-2.5 fill-current" />
                            </div>
                          )}
                          {item.media_type === 'CAROUSEL_ALBUM' && (
                            <div className="absolute bottom-1 right-1 rounded bg-black/60 p-0.5 text-white shadow-xs" title="Carrossel">
                              <Layers className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </div>

                        {/* Legenda e Metadados inline */}
                        <div className="min-w-0 flex-1">
                          {item.permalink ? (
                            <a
                              href={item.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="line-clamp-2 text-xs font-semibold text-stone-800 leading-snug hover:text-[#8A6828] transition-colors"
                              title={item.caption}
                            >
                              {item.caption || 'Publicação sem legenda'}
                            </a>
                          ) : (
                            <p className="line-clamp-2 text-xs font-semibold text-stone-800 leading-snug" title={item.caption}>
                              {item.caption || 'Publicação sem legenda'}
                            </p>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-stone-400">
                            <span>{new Date(item.timestamp).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                            {(item.like_count != null || item.comments_count != null) && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-stone-600 font-medium" title="Curtidas">
                                  <Heart className="h-2.5 w-2.5 text-[#B83B32] fill-current" />
                                  {numberLabel(item.like_count ?? 0)}
                                </span>
                                <span className="flex items-center gap-1 text-stone-600 font-medium" title="Comentários">
                                  <MessageCircle className="h-2.5 w-2.5 text-sky-600" />
                                  {numberLabel(item.comments_count ?? 0)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 text-xs text-stone-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                        {item.media_type === 'CAROUSEL_ALBUM' ? (
                          <><Layers className="h-3 w-3 text-stone-500" />Carrossel</>
                        ) : item.media_type === 'VIDEO' ? (
                          <><Play className="h-3 w-3 fill-stone-500 text-stone-500" />Reels</>
                        ) : (
                          <><ImageIcon className="h-3 w-3 text-stone-500" />Post</>
                        )}
                      </span>
                    </td>

                    <td className="px-3 text-right font-semibold tabular-nums text-stone-800 whitespace-nowrap">
                      {numberLabel(mediaValue(item, rankingKey))}
                    </td>

                    <td className="pl-3">
                      {item.permalink && (
                        <a
                          href={item.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Abrir publicação ${index + 1} no Instagram`}
                          className="inline-flex rounded-md p-1.5 text-[#8A6828] hover:bg-[#FAF7F0] hover:text-[#6E5018] transition-colors"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {ranking.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-xs font-medium text-[#8A6828] hover:text-[#6E5018] cursor-pointer transition-colors"
            >
              {expanded ? 'Mostrar top 5' : `Ver top ${Math.min(20, ranking.length)}`}
            </button>
          )}
        </div>
      )}
    </section>}
  </div>;
}
