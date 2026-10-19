import { useMemo, useState } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import type { Tarefa } from '../../types';
import { calcularDiasRestantes } from '../../utils/hospedagemCalculo';

// Minhas tarefas no layout clean (canvas › MinhasTarefas). Recebe as tarefas já
// carregadas pelo VivoxGP (GET /tarefas?responsavelId=eu); abrir/criar usa os modais do GP.

interface Props {
  tarefas: Tarefa[];
  loading: boolean;
  erro: boolean;
  onSelect: (t: Tarefa) => void;
  onNova: () => void;
  onRecarregar: () => void;
}

type Filtro = 'todas' | 'exec' | 'urg' | 'conc';
type Vista = 'lista' | 'prazos';

const ETAPA_TAREFA: Record<string, [string, string]> = {
  BACKLOG: ['Backlog', '#7A7A80'],
  A_FAZER: ['A fazer', '#7A7A80'],
  EM_ANDAMENTO: ['Em andamento', '#C88700'],
  EM_REVISAO: ['Em revisão', '#1B79E3'],
  CONCLUIDA: ['Concluída', '#0E9F4F'],
  CANCELADA: ['Cancelada', '#B23A30'],
};

const PRIORIDADE_TAREFA: Record<string, [string, string]> = {
  URGENTE: ['Urgente', 'bd bad'],
  ALTA: ['Alta', 'bd bad plain'],
  MEDIA: ['Média', 'bd warn plain'],
  BAIXA: ['Baixa', 'bd plain'],
};

const curto = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });

function prazoTxt(t: Tarefa): { txt: string; late: boolean; grupo: string } {
  if (!t.prazo) return { txt: '—', late: false, grupo: 'sem' };
  const d = calcularDiasRestantes(t.prazo);
  const aberta = t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA';
  if (d === null) return { txt: '—', late: false, grupo: 'sem' };
  const late = aberta && d < 0;
  const txt = d === 0 ? 'Hoje' : d === -1 ? 'Ontem' : d === 1 ? 'Amanhã' : curto.format(new Date(t.prazo)).replace('.', '').replace(' de ', ' ');
  const grupo = !aberta ? 'feito' : d < 0 ? 'atr' : d === 0 ? 'hoje' : d <= 7 ? 'semana' : 'depois';
  return { txt, late, grupo };
}

function horas(h?: number) {
  if (!h) return '—';
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

const GRUPOS: { id: string; nome: string; cor: string }[] = [
  { id: 'atr', nome: 'Atrasadas', cor: '#B23A30' },
  { id: 'hoje', nome: 'Hoje', cor: '#C88700' },
  { id: 'semana', nome: 'Próximos 7 dias', cor: '#1B79E3' },
  { id: 'depois', nome: 'Depois', cor: '#7A7A80' },
  { id: 'sem', nome: 'Sem prazo', cor: '#B9AE9F' },
  { id: 'feito', nome: 'Concluídas', cor: '#0E9F4F' },
];

export function MinhasTarefasView({ tarefas, loading, erro, onSelect, onNova, onRecarregar }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [vista, setVista] = useState<Vista>('lista');
  const [busca, setBusca] = useState('');

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return tarefas
      .filter((t) => {
        if (q && ![t.titulo, t.cliente?.nomeFantasia, t.projeto?.nome].filter(Boolean).join(' ').toLowerCase().includes(q)) return false;
        if (filtro === 'exec') return t.status === 'EM_ANDAMENTO';
        if (filtro === 'urg') return t.prioridade === 'URGENTE';
        if (filtro === 'conc') return t.status === 'CONCLUIDA';
        return true;
      })
      .sort((a, b) => {
        const fa = a.status === 'CONCLUIDA' ? 1 : 0;
        const fb = b.status === 'CONCLUIDA' ? 1 : 0;
        if (fa !== fb) return fa - fb;
        const pa = a.prazo ? new Date(a.prazo).getTime() : Infinity;
        const pb = b.prazo ? new Date(b.prazo).getTime() : Infinity;
        return pa - pb;
      });
  }, [tarefas, busca, filtro]);

  const filtros: { id: Filtro; label: string; n: number }[] = [
    { id: 'todas', label: 'Todas', n: tarefas.length },
    { id: 'exec', label: 'Em execução', n: tarefas.filter((t) => t.status === 'EM_ANDAMENTO').length },
    { id: 'urg', label: 'Urgentes', n: tarefas.filter((t) => t.prioridade === 'URGENTE').length },
    { id: 'conc', label: 'Concluídas', n: tarefas.filter((t) => t.status === 'CONCLUIDA').length },
  ];

  const origem = (t: Tarefa) => [t.cliente?.nomeFantasia, t.projeto?.nome].filter(Boolean).join(' · ') || 'Sem cliente';

  return (
    <div className="vxp">
      <div className="pg">
        <div className="ph">
          <div>
            <h1>Minhas tarefas</h1>
            <p>Tudo o que está com você, em todos os workspaces.</p>
          </div>
          <div className="acts">
            <button className="btn sec" type="button" onClick={onRecarregar} disabled={loading}>
              <RefreshCw className={`i ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />Atualizar
            </button>
            <button className="btn pri" type="button" onClick={onNova}><Plus className="i" aria-hidden="true" />Nova tarefa</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="seg" role="group" aria-label="Visualização">
            {(['lista', 'prazos'] as Vista[]).map((v) => (
              <button key={v} type="button" className={v === vista ? 'on' : ''} aria-pressed={v === vista} onClick={() => setVista(v)}>
                {v === 'lista' ? 'Lista' : 'Prazos'}
              </button>
            ))}
          </div>
          <div className="chips" role="group" aria-label="Filtrar tarefas">
            {filtros.map((f) => (
              <button key={f.id} className={f.id === filtro ? 'chip on' : 'chip'} type="button" aria-pressed={f.id === filtro} onClick={() => setFiltro(f.id)}>
                {f.label} <em>{f.n}</em>
              </button>
            ))}
          </div>
          <div className="srch" style={{ marginLeft: 'auto', maxWidth: 280 }}>
            <Search className="i" aria-hidden="true" />
            <input className="inp" type="search" placeholder="Buscar tarefa ou cliente" aria-label="Buscar tarefas" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>

        {erro && <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>Não foi possível carregar as tarefas. Tente atualizar.</p>}

        {loading && tarefas.length === 0 ? (
          <div className="card animate-pulse" style={{ height: 320 }} aria-busy="true" aria-label="Carregando tarefas" />
        ) : lista.length === 0 ? (
          <div className="card empty">
            <b>{tarefas.length === 0 ? 'Nenhuma tarefa com você' : 'Nada encontrado'}</b>
            <span>{tarefas.length === 0 ? 'As tarefas em que você for responsável aparecem aqui.' : 'Ajuste a busca ou os filtros.'}</span>
          </div>
        ) : vista === 'lista' ? (
          <section className="card">
            <div className="tw">
              <table className="tbl">
                <thead><tr><th>Tarefa</th><th>Etapa</th><th>Prioridade</th><th>Prazo</th><th>Horas</th></tr></thead>
                <tbody>
                  {lista.map((t) => {
                    const [etapa, cor] = ETAPA_TAREFA[t.status] ?? [t.status, '#7A7A80'];
                    const [prio, prBd] = PRIORIDADE_TAREFA[t.prioridade] ?? [t.prioridade, 'bd plain'];
                    const p = prazoTxt(t);
                    return (
                      <tr key={t.id}>
                        <td><button className="tr" type="button" onClick={() => onSelect(t)}><b>{t.titulo}</b><small>{origem(t)}</small></button></td>
                        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}><span className="dot" style={{ background: cor }} />{etapa}</span></td>
                        <td><span className={prBd}>{prio}</span></td>
                        <td className={p.late ? 'late' : ''} style={{ whiteSpace: 'nowrap' }}>{p.txt}</td>
                        <td className="mut" style={{ whiteSpace: 'nowrap' }}>{horas(t.horasGastas)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="card" style={{ overflow: 'hidden' }}>
            {GRUPOS.map((g) => {
              const itens = lista.filter((t) => prazoTxt(t).grupo === g.id);
              if (!itens.length) return null;
              return (
                <div key={g.id}>
                  <div className="grp-t"><span className="dot" style={{ background: g.cor }} />{g.nome} · {itens.length}</div>
                  {itens.map((t) => {
                    const [prio, prBd] = PRIORIDADE_TAREFA[t.prioridade] ?? [t.prioridade, 'bd plain'];
                    const p = prazoTxt(t);
                    return (
                      <div className="row" key={t.id}>
                        <button className="tr" type="button" onClick={() => onSelect(t)} style={{ flex: 1, minWidth: 0 }}>
                          <b>{t.titulo}</b>
                          <small>{origem(t)} · {(ETAPA_TAREFA[t.status] ?? [t.status])[0]}</small>
                        </button>
                        <span className={prBd}>{prio}</span>
                        <span className={p.late ? 'late' : 'mut'} style={{ width: 90, textAlign: 'right' }}>{p.txt}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
