import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { MesComDados, TipoPublicacao } from '../../api/acompanhamento';
import { CalendarioPeriodo } from './CalendarioPeriodo';
import { PopoverAncorado } from '../ui/PopoverAncorado';
import { MESES_ABREV, MESES_NOMES, TIPOS_PUBLICACAO, type Periodo, deIso, limites, mesAtual, rotuloCurto } from './periodo';

// Filtros do acompanhamento no layout clean: ano, 12 meses, período personalizado e tipo.

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
  const totalDoMes = (mes: number) => mesesComDados.find((m) => m.ano === anoVisivel && m.mes === mes)?.total ?? 0;
  const hoje = mesAtual();
  const personalizado = periodo.modo === 'personalizado';
  const alternarTipo = (tipo: TipoPublicacao) =>
    onChangeTipos(tipos.includes(tipo) ? tipos.filter((t) => t !== tipo) : [...tipos, tipo]);

  return (
    <section className="card cp" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div className="per" role="group" aria-label="Ano">
          <button className="ib sm" type="button" aria-label="Ano anterior" onClick={() => setAnoVisivel((a) => a - 1)}>
            <ChevronLeft className="i" aria-hidden="true" />
          </button>
          <b>{anoVisivel}</b>
          <button className="ib sm" type="button" aria-label="Próximo ano" onClick={() => setAnoVisivel((a) => a + 1)}>
            <ChevronRight className="i" aria-hidden="true" />
          </button>
        </div>
        <div className="acts">
          <button ref={botaoPeriodoRef} type="button" className={personalizado ? 'chip on' : 'chip'} onClick={() => setCalendarioAberto((v) => !v)}>
            <CalendarRange className="i" aria-hidden="true" style={{ width: 14, height: 14 }} />
            {personalizado ? rotuloCurto(periodo) : 'Período personalizado'}
          </button>
          {personalizado && (
            <button className="ib sm" type="button" aria-label="Limpar período personalizado" onClick={() => onChangePeriodo(mesAtual())}>
              <X className="i" aria-hidden="true" />
            </button>
          )}
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

      <div className="meses">
        {MESES_ABREV.map((abrev, i) => {
          const mes = i + 1;
          const total = totalDoMes(mes);
          const ativo = periodo.modo === 'mes' && periodo.ano === anoVisivel && periodo.mes === mes;
          const ehAtual = hoje.modo === 'mes' && hoje.ano === anoVisivel && hoje.mes === mes;
          return (
            <button
              key={abrev}
              type="button"
              aria-pressed={ativo}
              className={`mes${ativo ? ' on' : ''}${total ? ' tem' : ''}${ehAtual ? ' hoje' : ''}`}
              onClick={() => onChangePeriodo({ modo: 'mes', ano: anoVisivel, mes })}
              title={`${MESES_NOMES[i]} de ${anoVisivel}${total ? ` · ${total} ${total === 1 ? 'publicação' : 'publicações'}` : ''}`}
            >
              <span>{abrev}</span>
              <em>{total}</em>
            </button>
          );
        })}
      </div>

      <div className="chips" role="group" aria-label="Filtrar por tipo">
        <button type="button" className={tipos.length === 0 ? 'chip on' : 'chip'} aria-pressed={tipos.length === 0} onClick={() => onChangeTipos([])}>Todos</button>
        {TIPOS_PUBLICACAO.map((t) => (
          <button key={t.id} type="button" className={tipos.includes(t.id) ? 'chip on' : 'chip'} aria-pressed={tipos.includes(t.id)} onClick={() => alternarTipo(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
    </section>
  );
}
