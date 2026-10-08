import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { MesComDados, TipoPublicacao } from '../../api/acompanhamento';
import { CalendarioPeriodo } from './CalendarioPeriodo';
import { PopoverAncorado } from '../ui/PopoverAncorado';
import { MESES_ABREV, MESES_NOMES, TIPOS_PUBLICACAO, type Periodo, deIso, limites, mesAtual, rotuloCurto } from './periodo';

interface FiltrosAcompanhamentoProps {
  periodo: Periodo;
  tipos: TipoPublicacao[];
  mesesComDados?: MesComDados[];
  onChangePeriodo: (periodo: Periodo) => void;
  onChangeTipos: (tipos: TipoPublicacao[]) => void;
}

export function FiltrosAcompanhamento({
  periodo,
  tipos,
  mesesComDados = [],
  onChangePeriodo,
  onChangeTipos,
}: FiltrosAcompanhamentoProps) {
  const anoDoPeriodo = periodo.modo === 'mes' ? periodo.ano : deIso(periodo.inicio).getFullYear();
  const [anoVisivel, setAnoVisivel] = useState(anoDoPeriodo);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const botaoPeriodoRef = useRef<HTMLButtonElement>(null);

  // Acompanha o ano quando o período muda por fora (URL, atalhos)
  useEffect(() => setAnoVisivel(anoDoPeriodo), [anoDoPeriodo]);


  const fecharCalendario = useCallback(() => setCalendarioAberto(false), []);

  const totalDoMes = (mes: number) =>
    mesesComDados.find((m) => m.ano === anoVisivel && m.mes === mes)?.total ?? 0;

  const hoje = mesAtual();
  const personalizado = periodo.modo === 'personalizado';

  const alternarTipo = (tipo: TipoPublicacao) => {
    onChangeTipos(tipos.includes(tipo) ? tipos.filter((t) => t !== tipo) : [...tipos, tipo]);
  };

  return (
    // z-20: o calendário do período precisa ficar por cima do resumo e da tabela
    // (cada pw-glass-panel cria seu próprio contexto de empilhamento)
    <div className="pw-glass-panel z-20 p-4 rounded-3xl border border-white/60 shadow-2xs space-y-3">
      {/* Ano + período personalizado */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white/70 p-1 rounded-2xl border border-[#524B40]/10 shadow-2xs">
          <button
            type="button"
            onClick={() => setAnoVisivel((a) => a - 1)}
            className="pw-glass-control p-1.5 rounded-xl text-[#5E574C] hover:text-[#1E1A16] cursor-pointer"
            title="Ano anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-archivo text-sm font-extrabold text-[#1E1A16] px-3 min-w-[64px] text-center">
            {anoVisivel}
          </span>
          <button
            type="button"
            onClick={() => setAnoVisivel((a) => a + 1)}
            className="pw-glass-control p-1.5 rounded-xl text-[#5E574C] hover:text-[#1E1A16] cursor-pointer"
            title="Próximo ano"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <button
              ref={botaoPeriodoRef}
              type="button"
              onClick={() => setCalendarioAberto((v) => !v)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                personalizado
                  ? 'bg-[#181512] text-[#C7A15F] shadow-xs'
                  : 'pw-glass-control text-[#5E574C] hover:text-[#1E1A16] shadow-2xs'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>{personalizado ? rotuloCurto(periodo) : 'Período personalizado'}</span>
            </button>
            {personalizado && (
              <button
                type="button"
                onClick={() => onChangePeriodo(mesAtual())}
                className="pw-glass-control p-2 rounded-xl text-[#5E574C] hover:text-[#B83B32] cursor-pointer"
                title="Limpar período personalizado"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <PopoverAncorado ancoraRef={botaoPeriodoRef} aberto={calendarioAberto} onFechar={fecharCalendario}>
            <CalendarioPeriodo
              inicial={limites(periodo)}
              onFechar={fecharCalendario}
              onAplicar={(inicio, fim) => {
                onChangePeriodo({ modo: 'personalizado', inicio, fim });
                setCalendarioAberto(false);
              }}
            />
          </PopoverAncorado>
        </div>
      </div>

      {/* Os 12 meses sempre visíveis */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
        {MESES_ABREV.map((abrev, i) => {
          const mes = i + 1;
          const total = totalDoMes(mes);
          const ativo = periodo.modo === 'mes' && periodo.ano === anoVisivel && periodo.mes === mes;
          const ehAtual = hoje.modo === 'mes' && hoje.ano === anoVisivel && hoje.mes === mes;
          return (
            <button
              key={abrev}
              type="button"
              onClick={() => onChangePeriodo({ modo: 'mes', ano: anoVisivel, mes })}
              title={`${MESES_NOMES[i]} de ${anoVisivel}${total ? ` · ${total} ${total === 1 ? 'publicação' : 'publicações'}` : ''}`}
              className={`relative px-2 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                ativo
                  ? 'bg-[#181512] text-[#C7A15F] shadow-xs'
                  : total > 0
                    ? 'bg-white/80 text-[#1E1A16] border border-[#C7A15F]/40 hover:bg-white'
                    : 'bg-white/40 text-[#8F8271] border border-[#524B40]/10 hover:bg-white/80 hover:text-[#1E1A16]'
              } ${ehAtual && !ativo ? 'ring-1 ring-[#C7A15F]' : ''}`}
            >
              <span>{abrev}</span>
              <span className={`text-[10px] font-semibold ${ativo ? 'text-[#C7A15F]/80' : total > 0 ? 'text-[#8A6828]' : 'text-[#B9AEA0]'}`}>
                {total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtro por tipo */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        <span className="text-[11px] font-bold text-[#8F8271] uppercase tracking-wider mr-1">Tipo:</span>
        <button
          type="button"
          onClick={() => onChangeTipos([])}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tipos.length === 0
              ? 'bg-[#181512] text-[#C7A15F] shadow-xs'
              : 'bg-white/60 text-[#5E574C] border border-[#524B40]/10 hover:bg-white hover:text-[#1E1A16]'
          }`}
        >
          Todos
        </button>
        {TIPOS_PUBLICACAO.map((t) => {
          const ativo = tipos.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => alternarTipo(t.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                ativo
                  ? 'bg-[#FAF2E4] text-[#8A6828] border border-[#C7A15F]/60 shadow-2xs'
                  : 'bg-white/60 text-[#5E574C] border border-[#524B40]/10 hover:bg-white hover:text-[#1E1A16]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
