import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { MesComDados } from '../../api/acompanhamento';
import { MESES_NOMES } from './ResumoAcompanhamentoCards';

const MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

interface SeletorMesProps {
  ano: number;
  mes: number;
  onChangeMes: (ano: number, mes: number) => void;
  mesesComDados?: MesComDados[];
}

export function SeletorMes({ ano, mes, onChangeMes, mesesComDados = [] }: SeletorMesProps) {
  const nomeMes = MESES_NOMES[mes - 1] || `Mês ${mes}`;

  const handleAnterior = () => {
    if (mes === 1) {
      onChangeMes(ano - 1, 12);
    } else {
      onChangeMes(ano, mes - 1);
    }
  };

  const handleProximo = () => {
    if (mes === 12) {
      onChangeMes(ano + 1, 1);
    } else {
      onChangeMes(ano, mes + 1);
    }
  };

  const handleMesAtual = () => {
    const hoje = new Date();
    onChangeMes(hoje.getFullYear(), hoje.getMonth() + 1);
  };

  const hoje = new Date();
  const isMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth() + 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Controles de Navegação */}
        <div className="flex items-center gap-1.5 bg-white/70 p-1 rounded-2xl border border-[#524B40]/10 shadow-2xs">
          <button
            type="button"
            onClick={handleAnterior}
            className="pw-glass-control p-1.5 rounded-xl text-[#5E574C] hover:text-[#1E1A16] cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3 py-1 text-center min-w-[150px]">
            <span className="font-archivo text-sm font-extrabold text-[#1E1A16]">
              {nomeMes} de {ano}
            </span>
          </div>

          <button
            type="button"
            onClick={handleProximo}
            className="pw-glass-control p-1.5 rounded-xl text-[#5E574C] hover:text-[#1E1A16] cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Botão Mês Atual se não estiver nele */}
        {!isMesAtual && (
          <button
            type="button"
            onClick={handleMesAtual}
            className="pw-glass-control px-3 py-1.5 rounded-xl text-xs font-bold text-[#7A6440] hover:text-[#1E1A16] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Mês atual</span>
          </button>
        )}
      </div>

      {/* Chips dos Meses que contêm dados */}
      {mesesComDados.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 max-w-full">
          <span className="text-[11px] font-bold text-[#8F8271] uppercase tracking-wider shrink-0 mr-1">
            Histórico:
          </span>
          {mesesComDados.map((item) => {
            const isAtivo = item.ano === ano && item.mes === mes;
            const rotuloAbrev = `${MESES_ABREV[item.mes - 1] || item.mes}/${String(item.ano).slice(-2)}`;
            return (
              <button
                key={`${item.ano}-${item.mes}`}
                type="button"
                onClick={() => onChangeMes(item.ano, item.mes)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isAtivo
                    ? 'bg-[#181512] text-[#C7A15F] shadow-xs'
                    : 'bg-white/60 hover:bg-white text-[#5E574C] hover:text-[#1E1A16] border border-[#524B40]/10'
                }`}
                title={`${MESES_NOMES[item.mes - 1]} de ${item.ano} (${item.total} publicações)`}
              >
                <span>{rotuloAbrev}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isAtivo ? 'bg-[#C7A15F]/20 text-[#C7A15F]' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {item.total}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
