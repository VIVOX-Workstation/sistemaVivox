import React from 'react';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  Eye, 
  Repeat2,
  Sparkles,
  BarChart3
} from 'lucide-react';
import type { ResumoAcompanhamento, TipoPublicacao } from '../../api/acompanhamento';
import { TIPOS_PUBLICACAO } from './periodo';

interface ResumoAcompanhamentoCardsProps {
  resumo: ResumoAcompanhamento;
  /** Ex.: "Em janeiro de 2025" ou "De 16 de janeiro a 28 de fevereiro de 2025" */
  textoPeriodo: string;
  tiposFiltrados?: TipoPublicacao[];
}

export function ResumoAcompanhamentoCards({ resumo, textoPeriodo, tiposFiltrados = [] }: ResumoAcompanhamentoCardsProps) {
  const rotulosFiltro = TIPOS_PUBLICACAO.filter((t) => tiposFiltrados.includes(t.id)).map((t) => t.label);

  // Montar partes por tipo
  const partesTipos: string[] = [];
  if (resumo.porTipo.POST > 0) {
    partesTipos.push(`${resumo.porTipo.POST} ${resumo.porTipo.POST === 1 ? 'post' : 'posts'}`);
  }
  if (resumo.porTipo.REELS > 0) {
    partesTipos.push(`${resumo.porTipo.REELS} reels`);
  }
  if (resumo.porTipo.CARROSSEL > 0) {
    partesTipos.push(`${resumo.porTipo.CARROSSEL} ${resumo.porTipo.CARROSSEL === 1 ? 'carrossel' : 'carrosséis'}`);
  }
  if (resumo.porTipo.VIDEO > 0) {
    partesTipos.push(`${resumo.porTipo.VIDEO} ${resumo.porTipo.VIDEO === 1 ? 'vídeo' : 'vídeos'}`);
  }
  if (resumo.porTipo.STORY > 0) {
    partesTipos.push(`${resumo.porTipo.STORY} ${resumo.porTipo.STORY === 1 ? 'story' : 'stories'}`);
  }

  const textoTipos = partesTipos.length > 0 ? ` (${partesTipos.join(', ')})` : '';

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  return (
    <div className="space-y-4">
      {/* Frase síntese do relatório */}
      <div className="pw-glass-panel p-4 sm:p-5 rounded-2xl border border-white/70 shadow-2xs bg-white/75 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center text-[#8A6828] shrink-0">
          <Sparkles className="w-5 h-5 text-[#8A6828]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1E1A16] leading-relaxed">
            <span className="text-[#8A6828]">{textoPeriodo}</span> foram postadas{' '}
            <strong className="text-base text-[#1E1A16] font-extrabold">{resumo.total}</strong>{' '}
            {resumo.total === 1 ? 'publicação' : 'publicações'}
            {textoTipos}.
          </p>
          {rotulosFiltro.length > 0 && (
            <p className="text-[11px] font-semibold text-[#8F8271] mt-0.5">
              Filtrando por tipo: {rotulosFiltro.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Grid de Totais das Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Curtidas */}
        <div className="pw-glass-panel p-3.5 rounded-2xl border border-white/60 bg-white/60 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shrink-0">
            <Heart className="w-4 h-4 fill-rose-500/20" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#5E574C] block uppercase tracking-wider">
              Curtidas
            </span>
            <span className="text-base font-extrabold text-[#1E1A16]">
              {formatNumber(resumo.totais.curtidas)}
            </span>
          </div>
        </div>

        {/* Comentários */}
        <div className="pw-glass-panel p-3.5 rounded-2xl border border-white/60 bg-white/60 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#5E574C] block uppercase tracking-wider">
              Comentários
            </span>
            <span className="text-base font-extrabold text-[#1E1A16]">
              {formatNumber(resumo.totais.comentarios)}
            </span>
          </div>
        </div>

        {/* Reposts */}
        <div className="pw-glass-panel p-3.5 rounded-2xl border border-white/60 bg-white/60 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600 shrink-0">
            <Repeat2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#5E574C] block uppercase tracking-wider">
              Reposts
            </span>
            <span className="text-base font-extrabold text-[#1E1A16]">
              {formatNumber(resumo.totais.reposts)}
            </span>
          </div>
        </div>

        {/* Envios */}
        <div className="pw-glass-panel p-3.5 rounded-2xl border border-white/60 bg-white/60 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#5E574C] block uppercase tracking-wider">
              Envios
            </span>
            <span className="text-base font-extrabold text-[#1E1A16]">
              {formatNumber(resumo.totais.compartilhamentos)}
            </span>
          </div>
        </div>

        {/* Salvamentos */}
        <div className="pw-glass-panel p-3.5 rounded-2xl border border-white/60 bg-white/60 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
            <Bookmark className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#5E574C] block uppercase tracking-wider">
              Salvamentos
            </span>
            <span className="text-base font-extrabold text-[#1E1A16]">
              {formatNumber(resumo.totais.salvamentos)}
            </span>
          </div>
        </div>

        {/* Visualizações */}
        <div className="pw-glass-panel p-3.5 rounded-2xl border border-white/60 bg-white/60 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#5E574C] block uppercase tracking-wider">
              Visualizações
            </span>
            <span className="text-base font-extrabold text-[#1E1A16]">
              {formatNumber(resumo.totais.visualizacoes)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
