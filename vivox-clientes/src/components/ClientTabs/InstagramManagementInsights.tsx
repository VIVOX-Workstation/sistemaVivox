import { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Info, Sparkles, Target } from 'lucide-react';
import { comparison, managementInsights, mediaValue, numberLabel, periodLabel, rankedMedia } from './instagramInsights';
import type { ManagementData, RankingKey } from './instagramInsights';

export function MetricComparison({ current, previous }: { current?: number | null; previous?: number | null }) {
  const change = comparison(current, previous);
  return <div className="mt-2 flex flex-col items-center gap-1 text-xs">
    <span className={`rounded-full px-2 py-0.5 font-medium ${change.tone === 'up' ? 'bg-emerald-50 text-emerald-700' : change.tone === 'down' ? 'bg-amber-50 text-amber-800' : 'bg-stone-100 text-stone-500'}`}>{change.label}</span>
    {previous != null && <span className="text-stone-500">{numberLabel(previous)} no período anterior</span>}
  </div>;
}

export function InstagramManagementInsights({ data, loading, section = 'summary' }: { data: ManagementData | null; loading: boolean; section?: 'summary' | 'ranking' }) {
  const [rankingKey, setRankingKey] = useState<RankingKey>('interactions');
  const [expanded, setExpanded] = useState(false);
  if (loading && section === 'ranking') return null;
  if (loading) return <div role="status" className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">Preparando comparação e leitura do período…</div>;
  if (!data?.previousOverview || !data?.period?.since) return null;
  const insights = managementInsights(data);
  const ranking = rankedMedia(data, rankingKey);
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
          <p>Consulta concluída em {new Date(data.syncedAt).toLocaleString('pt-BR')}. Intervalos de dias completos em UTC; hoje não está incluído. Os dados são reutilizados por até 5 minutos. Use Atualizar para consultar novamente.</p>
          <p>Sugestões calculadas a partir dos dados disponíveis. São hipóteses para testar; não identificam a causa de uma mudança. Seguidores são o total atual, sem comparação histórica.</p>
          {data.warnings.map(warning => <p key={warning}>{warning}</p>)}
        </div>
      </details>
    </section>}

    {section === 'ranking' && <section className="rounded-2xl border border-[#E8E7E4] bg-white p-5 sm:p-6" aria-label="Ranking de conteúdos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="flex items-center gap-2 text-sm font-semibold text-stone-800"><CheckCircle2 className="h-4 w-4 text-[#B89455]" />Conteúdos que deram resultado</h3><p className="mt-1 text-xs text-stone-500">Publicados no período · métricas acumuladas até a consulta</p></div>
        <select aria-label="Ordenar ranking por" value={rankingKey} onChange={event => { setRankingKey(event.target.value as RankingKey); setExpanded(false); }} className="max-w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600">
          {Object.entries(labels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
        </select>
      </div>
      <p className="my-4 text-xs text-stone-500">{ranking.length} de {data.recentMedia.length} publicações recuperadas com dados de {labels[rankingKey].toLowerCase()}. {data.mediaCoverage.complete ? 'Busca de publicações concluída para o intervalo.' : 'Amostra parcial: não representa necessariamente todo o período.'} Valores ausentes não entram no ranking.</p>
      {ranking.length === 0 ? <div className="rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-500">Sem dados suficientes para este ranking. Experimente outra métrica ou período.</div> : <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-stone-100 text-xs text-stone-500"><th className="py-3 pr-4 font-medium">Conteúdo</th><th className="px-3 font-medium">Formato</th><th className="px-3 text-right font-medium">{labels[rankingKey]}</th><th className="pl-3"><span className="sr-only">Abrir publicação</span></th></tr></thead>
          <tbody>{ranking.slice(0, expanded ? 20 : 5).map((item, index) => <tr key={item.id} className="border-b border-stone-100 last:border-0">
            <td className="py-4 pr-4 min-w-48"><div className="flex gap-3"><span className="text-[#A28B64] tabular-nums">{index + 1}</span><div><p className="line-clamp-2 text-stone-700">{item.caption || 'Publicação sem legenda'}</p><p className="mt-1 text-xs text-stone-400">{new Date(item.timestamp).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p></div></div></td>
            <td className="px-3 text-xs text-stone-500">{item.media_type === 'CAROUSEL_ALBUM' ? 'Carrossel' : item.media_type === 'VIDEO' ? 'Vídeo' : 'Imagem'}</td>
            <td className="px-3 text-right font-semibold tabular-nums text-stone-800">{numberLabel(mediaValue(item, rankingKey))}</td>
            <td className="pl-3">{item.permalink && <a href={item.permalink} target="_blank" rel="noopener noreferrer" aria-label={`Abrir publicação ${index + 1} no Instagram`} className="inline-flex rounded-md p-2 text-[#8A6828] hover:bg-stone-50"><ArrowUpRight className="h-4 w-4" /></a>}</td>
          </tr>)}</tbody>
        </table>
        {ranking.length > 5 && <button onClick={() => setExpanded(!expanded)} className="mt-3 text-xs font-medium text-[#8A6828] cursor-pointer">{expanded ? 'Mostrar top 5' : `Ver top ${Math.min(20, ranking.length)}`}</button>}
      </div>}
    </section>}
  </div>;
}
