import type { ResumoAcompanhamento, TipoPublicacao } from '../../api/acompanhamento';
import { TIPOS_PUBLICACAO } from './periodo';

// Resumo do período no layout clean (KPIs .card.kpi). Precisa estar dentro de .vxp.

interface ResumoAcompanhamentoCardsProps {
  resumo: ResumoAcompanhamento;
  /** Ex.: "Em janeiro de 2025" ou "De 16 de janeiro a 28 de fevereiro de 2025" */
  textoPeriodo: string;
  tiposFiltrados?: TipoPublicacao[];
}

const nf = new Intl.NumberFormat('pt-BR');

export function ResumoAcompanhamentoCards({ resumo, textoPeriodo, tiposFiltrados = [] }: ResumoAcompanhamentoCardsProps) {
  const rotulosFiltro = TIPOS_PUBLICACAO.filter((t) => tiposFiltrados.includes(t.id)).map((t) => t.label);
  const p = resumo.porTipo;
  const partes = [
    p.POST && `${p.POST} ${p.POST === 1 ? 'post' : 'posts'}`,
    p.REELS && `${p.REELS} reels`,
    p.CARROSSEL && `${p.CARROSSEL} ${p.CARROSSEL === 1 ? 'carrossel' : 'carrosséis'}`,
    p.VIDEO && `${p.VIDEO} ${p.VIDEO === 1 ? 'vídeo' : 'vídeos'}`,
    p.STORY && `${p.STORY} ${p.STORY === 1 ? 'story' : 'stories'}`,
  ].filter(Boolean) as string[];
  const t = resumo.totais;
  const interacoes = t.curtidas + t.comentarios + t.compartilhamentos + t.reposts;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="mut" style={{ fontSize: 13 }}>
        {textoPeriodo} foram postadas <b style={{ color: 'var(--ink)' }}>{resumo.total}</b> {resumo.total === 1 ? 'publicação' : 'publicações'}
        {partes.length ? ` (${partes.join(', ')})` : ''}.
        {rotulosFiltro.length > 0 && ` Filtro: ${rotulosFiltro.join(', ')}.`}
      </p>
      <div className="grid g4">
        <div className="card kpi"><span>Publicações</span><b>{nf.format(resumo.total)}</b><small>{partes.join(', ') || 'nenhuma no período'}</small></div>
        <div className="card kpi"><span>Visualizações</span><b>{nf.format(t.visualizacoes)}</b><small>somadas no período</small></div>
        <div className="card kpi">
          <span>Interações</span><b>{nf.format(interacoes)}</b>
          <small>{nf.format(t.curtidas)} curtidas · {nf.format(t.comentarios)} comentários · {nf.format(t.compartilhamentos)} envios</small>
        </div>
        <div className="card kpi"><span>Salvamentos</span><b>{nf.format(t.salvamentos)}</b><small>{nf.format(t.reposts)} reposts</small></div>
      </div>
    </div>
  );
}
