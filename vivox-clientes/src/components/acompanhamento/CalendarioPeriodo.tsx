import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MESES_NOMES, deIso, paraIso } from './periodo';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface CalendarioPeriodoProps {
  inicial?: { inicio: string; fim: string };
  onAplicar: (inicio: string, fim: string) => void;
  onFechar: () => void;
}

function atalhos(): { label: string; inicio: string; fim: string }[] {
  const hoje = new Date();
  const diasAtras = (n: number) => paraIso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - n));
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  return [
    { label: 'Últimos 7 dias', inicio: diasAtras(6), fim: paraIso(hoje) },
    { label: 'Últimos 30 dias', inicio: diasAtras(29), fim: paraIso(hoje) },
    { label: 'Últimos 3 meses', inicio: paraIso(new Date(ano, mes - 2, 1)), fim: paraIso(new Date(ano, mes + 1, 0)) },
    { label: 'Mês passado', inicio: paraIso(new Date(ano, mes - 1, 1)), fim: paraIso(new Date(ano, mes, 0)) },
    { label: 'Este ano', inicio: `${ano}-01-01`, fim: paraIso(hoje) },
    { label: 'Ano passado', inicio: `${ano - 1}-01-01`, fim: `${ano - 1}-12-31` },
  ];
}

// Calendário de intervalo: 1º clique define o início, 2º clique o fim (invertido se vier antes)
export function CalendarioPeriodo({ inicial, onAplicar, onFechar }: CalendarioPeriodoProps) {
  const base = inicial ? deIso(inicial.inicio) : new Date();
  const [visivel, setVisivel] = useState({ ano: base.getFullYear(), mes: base.getMonth() });
  const [inicio, setInicio] = useState<string | null>(inicial?.inicio ?? null);
  const [fim, setFim] = useState<string | null>(inicial?.fim ?? null);
  const [hover, setHover] = useState<string | null>(null);

  const hoje = paraIso(new Date());

  const dias = useMemo(() => {
    const primeiro = new Date(visivel.ano, visivel.mes, 1);
    const totalDias = new Date(visivel.ano, visivel.mes + 1, 0).getDate();
    const vazios = Array.from({ length: primeiro.getDay() }, () => null);
    const datas = Array.from({ length: totalDias }, (_, i) => paraIso(new Date(visivel.ano, visivel.mes, i + 1)));
    return [...vazios, ...datas];
  }, [visivel]);

  const navegar = (delta: number) => {
    const d = new Date(visivel.ano, visivel.mes + delta, 1);
    setVisivel({ ano: d.getFullYear(), mes: d.getMonth() });
  };

  const clicarDia = (iso: string) => {
    if (!inicio || fim) {
      setInicio(iso);
      setFim(null);
      return;
    }
    if (iso < inicio) {
      setFim(inicio);
      setInicio(iso);
    } else {
      setFim(iso);
    }
  };

  // Enquanto escolhe o fim, o hover pré-visualiza o intervalo
  const fimEfetivo = fim ?? (inicio && hover ? hover : null);
  const [a, b] = inicio && fimEfetivo ? (fimEfetivo < inicio ? [fimEfetivo, inicio] : [inicio, fimEfetivo]) : [inicio, inicio];

  const fmt = (iso: string | null) => (iso ? deIso(iso).toLocaleDateString('pt-BR') : '—');

  return (
    <div className="w-[min(92vw,560px)] rounded-3xl bg-[#FFFDF8] border border-white/80 shadow-2xl p-4 text-[#1E1A16] animate-scale-in">
      <div className="flex items-center justify-between mb-3">
        <span className="font-archivo text-sm font-extrabold">Período personalizado</span>
        <button
          type="button"
          onClick={onFechar}
          className="pw-glass-control p-1.5 rounded-full text-[#5E574C] hover:text-[#1E1A16] cursor-pointer"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Atalhos */}
        <div className="flex sm:flex-col gap-1.5 flex-wrap sm:w-36 shrink-0">
          {atalhos().map((at) => (
            <button
              key={at.label}
              type="button"
              onClick={() => {
                setInicio(at.inicio);
                setFim(at.fim);
                const d = deIso(at.fim);
                setVisivel({ ano: d.getFullYear(), mes: d.getMonth() });
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-left transition-colors cursor-pointer ${
                inicio === at.inicio && fim === at.fim
                  ? 'bg-[#181512] text-[#C7A15F]'
                  : 'bg-white/70 border border-[#524B40]/10 text-[#5E574C] hover:text-[#1E1A16] hover:bg-white'
              }`}
            >
              {at.label}
            </button>
          ))}
        </div>

        {/* Mês */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => navegar(-1)}
              className="pw-glass-control p-1.5 rounded-xl text-[#5E574C] hover:text-[#1E1A16] cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold">
              {MESES_NOMES[visivel.mes]} de {visivel.ano}
            </span>
            <button
              type="button"
              onClick={() => navegar(1)}
              className="pw-glass-control p-1.5 rounded-xl text-[#5E574C] hover:text-[#1E1A16] cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center" onMouseLeave={() => setHover(null)}>
            {DIAS_SEMANA.map((d, i) => (
              <span key={i} className="text-[10px] font-bold text-[#8F8271] py-1">
                {d}
              </span>
            ))}
            {dias.map((iso, i) => {
              if (!iso) return <span key={`v${i}`} />;
              const ehPonta = iso === a || iso === b;
              const dentro = a && b && iso > a && iso < b;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => clicarDia(iso)}
                  onMouseEnter={() => setHover(iso)}
                  className={`h-9 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    ehPonta
                      ? 'bg-[#181512] text-[#C7A15F]'
                      : dentro
                        ? 'bg-[#FAF2E4] text-[#8A6828]'
                        : 'text-[#1E1A16] hover:bg-white'
                  } ${iso === hoje && !ehPonta ? 'ring-1 ring-[#C7A15F]' : ''}`}
                >
                  {deIso(iso).getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#524B40]/10 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs text-[#5E574C]">
          <strong className="text-[#1E1A16]">{fmt(inicio)}</strong> até{' '}
          <strong className="text-[#1E1A16]">{fmt(fim)}</strong>
          {inicio && !fim && <span className="ml-1 text-[#8F8271]">· escolha o dia final</span>}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="pw-glass-control px-3 py-1.5 rounded-xl text-xs font-bold text-[#5E574C] hover:text-[#1E1A16] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!inicio || !fim}
            onClick={() => inicio && fim && onAplicar(inicio, fim)}
            className="pw-glass-control pw-glass-gold px-4 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
