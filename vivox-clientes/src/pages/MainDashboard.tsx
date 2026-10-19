import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { normalizeDashboard, type DashboardData } from '../types/dashboard';
import { formatarDataBR } from '../utils/hospedagemCalculo';
import {
  STATUS_TAREFA_LABEL,
  PRIORIDADE_LABEL,
  formatDiaMes,
  formatMes,
  humanize,
  nf,
} from '../components/dashboard/DashboardShared';

// Dashboard no layout clean (canvas "Sistema VIVOX — interface clean" › Dashboard).
// Tudo vem de GET /analytics/dashboard-executivo; nada é inventado no front.

type Aba = 'gp' | 'ana' | 'cli';
interface Barra { l: string; v: number }

const ETAPA_COR: Record<string, string> = {
  BACKLOG: '#7A7A80',
  A_FAZER: '#7A7A80',
  EM_ANDAMENTO: '#C88700',
  EM_REVISAO: '#1B79E3',
  CONCLUIDA: '#0E9F4F',
  CANCELADA: '#B83B32',
};

function Grafico({ dados, rotulo, vazio }: { dados: Barra[]; rotulo: string; vazio: string }) {
  const max = Math.max(0, ...dados.map((d) => d.v));
  if (max === 0) return <div className="empty"><span>{vazio}</span></div>;
  return (
    <div className="chart" role="img" aria-label={rotulo}>
      {dados.map((d, i) => (
        <div className="chart-c" key={i} title={`${d.l}: ${nf.format(d.v)}`}>
          <div className="chart-b" style={{ height: `${Math.max(2, Math.round((d.v / max) * 100))}%` }} />
          <span>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

function BarraH({ label, valor, max, cor }: { label: string; valor: number; max: number; cor?: string }) {
  const w = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0;
  return (
    <div className="hb">
      <span>{label}</span>
      <div className="bar"><i style={{ width: `${w}%`, background: cor }} /></div>
      <b style={{ textAlign: 'right' }}>{nf.format(valor)}</b>
    </div>
  );
}

const Seta = () => <ChevronRight className="i" aria-hidden="true" style={{ color: 'var(--ink3)' }} />;

function semanasDaSerie(serie: DashboardData['analytics']['serieAlcance']): Barra[] {
  const out: Barra[] = [];
  for (let i = 0; i < serie.length; i += 7) {
    const bloco = serie.slice(i, i + 7);
    out.push({ l: formatDiaMes(bloco[0].data), v: bloco.reduce((s, x) => s + x.alcance, 0) });
  }
  return out;
}

function Atencao({ data }: { data: DashboardData }) {
  const { tarefas, chamados, landingPages } = data;
  const hosp = landingPages.proximosVencimentos.filter(
    (h) => h.nivelUrgencia === 'CRITICO' || h.nivelUrgencia === 'ATENCAO',
  );
  const total = tarefas.atrasadasLista.length + chamados.recentes.length + hosp.length;
  return (
    <section className="card" aria-labelledby="t-atencao">
      <div className="ch">
        <h2 id="t-atencao">Precisa de atenção hoje</h2>
        <span className="mut" style={{ fontSize: 12.5 }}>{total} {total === 1 ? 'item' : 'itens'}</span>
      </div>
      {total === 0 && (
        <div className="empty"><b>Tudo em dia</b><span>Nenhuma tarefa atrasada, chamado aberto ou renovação crítica.</span></div>
      )}
      {tarefas.atrasadasLista.map((t) => (
        <Link key={t.id} className="row" to={`/gp/tarefa/${t.id}`}>
          <span className="bd bad">Atrasada</span>
          <div className="t">
            <b>{t.titulo}{t.cliente ? ` · ${t.cliente.nomeFantasia}` : ''}</b>
            <small>
              Prazo {formatarDataBR(t.prazo)}
              {t.responsavel ? ` · ${t.responsavel.nome}` : ''} · {PRIORIDADE_LABEL[t.prioridade] ?? humanize(t.prioridade)}
            </small>
          </div>
          <Seta />
        </Link>
      ))}
      {chamados.recentes.map((c) => (
        <Link key={c.id} className="row" to="/gp/workspace/all">
          {c.slaVencido ? (
            <span className="bd warn">SLA vencido</span>
          ) : c.slaVencimento ? (
            <span className="bd plain">SLA {formatarDataBR(c.slaVencimento)}</span>
          ) : (
            <span className="bd info">Sem SLA</span>
          )}
          <div className="t">
            <b>{c.titulo}{c.cliente ? ` · ${c.cliente.nomeFantasia}` : ''}</b>
            <small>Chamado · {humanize(c.urgencia)} · {humanize(c.status)}</small>
          </div>
          <Seta />
        </Link>
      ))}
      {hosp.map((h) => (
        <Link key={h.id} className="row" to={`/cliente/${h.clienteId}`}>
          <span className={`bd ${h.nivelUrgencia === 'CRITICO' ? 'bad' : 'warn'}`}>
            {typeof h.diasRestantes === 'number' && h.diasRestantes < 0
              ? 'Vencido'
              : `Vence em ${h.diasRestantes} ${h.diasRestantes === 1 ? 'dia' : 'dias'}`}
          </span>
          <div className="t">
            <b>{h.dominio || h.url || h.titulo}</b>
            <small>{h.titulo} · {h.cliente?.nomeFantasia}</small>
          </div>
          <Seta />
        </Link>
      ))}
    </section>
  );
}

function VisaoPorModulo({ data }: { data: DashboardData }) {
  const [aba, setAba] = useState<Aba>('gp');
  const { tarefas, analytics, clientes, ultimosClientes } = data;
  const abas: Array<{ id: Aba; label: string }> = [
    { id: 'gp', label: 'Tarefas' },
    { id: 'ana', label: 'Analytics' },
    { id: 'cli', label: 'Clientes' },
  ];
  const etapas = tarefas.porStatus.filter((s) => s.total > 0);
  const maxEtapa = Math.max(0, ...etapas.map((e) => e.total));
  const integ = [
    { l: 'Google Analytics 4', v: analytics.clientesComGa4 },
    { l: 'Instagram', v: analytics.clientesComInstagram },
    { l: 'OpenPanel', v: analytics.clientesComOpenpanel },
  ];
  const h3 = { fontSize: 13, fontWeight: 600 } as const;
  const col = { display: 'flex', flexDirection: 'column', gap: 12 } as const;

  return (
    <section className="card" aria-labelledby="t-visao">
      <div className="ch" style={{ paddingBottom: 0, borderBottom: 0 }}><h2 id="t-visao">Visão por módulo</h2></div>
      <div className="tabs" role="tablist" aria-label="Visão por módulo" style={{ padding: '0 12px' }}>
        {abas.map((a) => (
          <button
            key={a.id}
            className={a.id === aba ? 'tab on' : 'tab'}
            type="button"
            role="tab"
            aria-selected={a.id === aba}
            onClick={() => setAba(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'gp' && (
        <div className="grid g2 cp" style={{ gap: 24 }}>
          <div style={{ ...col, gap: 8 }}>
            <h3 style={h3}>Tarefas concluídas por semana</h3>
            <Grafico
              dados={tarefas.concluidasPorSemana.map((s) => ({ l: formatDiaMes(s.semana), v: s.total }))}
              rotulo="Tarefas concluídas nas últimas 8 semanas"
              vazio="Nenhuma tarefa concluída nas últimas 8 semanas."
            />
          </div>
          <div style={col}>
            <h3 style={h3}>Tarefas por etapa</h3>
            {etapas.length === 0 && <span className="mut">Nenhuma tarefa cadastrada.</span>}
            {etapas.map((e) => (
              <BarraH
                key={e.status}
                label={STATUS_TAREFA_LABEL[e.status] ?? humanize(e.status)}
                valor={e.total}
                max={maxEtapa}
                cor={ETAPA_COR[e.status]}
              />
            ))}
            <Link to="/gp/minhas-tarefas" className="btn sec sm" style={{ alignSelf: 'flex-start', marginTop: 4 }}>Abrir tarefas</Link>
          </div>
        </div>
      )}

      {aba === 'ana' && (
        <div className="grid g2 cp" style={{ gap: 24 }}>
          <div style={{ ...col, gap: 8 }}>
            <h3 style={h3}>Alcance nos últimos 30 dias</h3>
            <Grafico
              dados={semanasDaSerie(analytics.serieAlcance)}
              rotulo="Alcance somado dos clientes por semana"
              vazio="Ainda não há dados de alcance nos últimos 30 dias."
            />
            <span className="mut" style={{ fontSize: 12.5 }}>
              Alcance {nf.format(analytics.alcance30d)} · Engajamento {nf.format(analytics.engajamento30d)}
            </span>
          </div>
          <div style={col}>
            <h3 style={h3}>Clientes ativos com integração</h3>
            {integ.map((x) => <BarraH key={x.l} label={x.l} valor={x.v} max={clientes.ativos} />)}
            <Link to="/analytics" className="btn sec sm" style={{ alignSelf: 'flex-start', marginTop: 4 }}>Abrir Analytics</Link>
          </div>
        </div>
      )}

      {aba === 'cli' && (
        <div className="grid g2 cp" style={{ gap: 24 }}>
          <div style={{ ...col, gap: 8 }}>
            <h3 style={h3}>Novos clientes por mês</h3>
            <Grafico
              dados={clientes.novosPorMes.map((m) => ({ l: formatMes(m.mes), v: m.total }))}
              rotulo="Novos clientes por mês nos últimos 6 meses"
              vazio="Nenhum cliente novo nos últimos 6 meses."
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ ...h3, paddingBottom: 4 }}>Últimos cadastrados</h3>
            {ultimosClientes.length === 0 && <span className="mut">Nenhum cliente cadastrado ainda.</span>}
            {ultimosClientes.map((c) => {
              const st = c.status?.toUpperCase();
              return (
                <Link key={c.id} className="row" to={`/cliente/${c.id}`} style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <span className="mono">{c.nomeFantasia.slice(0, 2).toUpperCase()}</span>
                  <div className="t">
                    <b>{c.nomeFantasia}</b>
                    <small>{c.segmento} · cadastrado em {formatDiaMes(c.createdAt)}</small>
                  </div>
                  <span className={`bd ${st === 'ATIVO' ? 'ok' : st === 'PROSPECT' ? 'info' : 'plain'}`}>{humanize(c.status)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export function MainDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useAuth();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/analytics/dashboard-executivo');
      setData(normalizeDashboard(res.data));
    } catch (err) {
      console.error('Erro ao carregar Dashboard Executivo:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const primeiro = user?.nome ? user.nome.split(' ')[0] : 'equipe';
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const dataLonga = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hoje = dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1);
  const d = data;
  const linha = { display: 'flex', justifyContent: 'space-between' } as const;

  return (
    <div className="vxp">
      <div className="pg">
        <div className="ph">
          <div>
            <span className="kick">{hoje}</span>
            <h1 style={{ marginTop: 6 }}>{saudacao}, {primeiro}</h1>
            <p>O que pede atenção hoje na agência.</p>
          </div>
          <div className="acts">
            <button className="btn sec" type="button" onClick={loadDashboard} disabled={loading}>
              <RefreshCw className={`i ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
            <Link className="btn pri" to="/cliente/novo"><Plus className="i" aria-hidden="true" />Novo cliente</Link>
          </div>
        </div>

        {loading && !d ? (
          <div className="grid g6 animate-pulse" aria-busy="true" aria-label="Carregando dashboard">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card" style={{ height: 96 }} />)}
          </div>
        ) : error && !d ? (
          <div className="card empty">
            <AlertTriangle className="i" aria-hidden="true" style={{ color: 'var(--bad)' }} />
            <b>Não foi possível carregar o dashboard.</b>
            <button type="button" className="btn pri sm" onClick={loadDashboard}>Tentar de novo</button>
          </div>
        ) : d ? (
          <>
            {error && (
              <p style={{ color: 'var(--bad)', fontSize: 12.5 }}>Falha ao atualizar; exibindo os últimos dados carregados.</p>
            )}
            <div className="grid g6">
              <Link className="card kpi" to="/clientes">
                <span>Clientes ativos</span><b>{nf.format(d.clientes.ativos)}</b>
                <small>{nf.format(d.clientes.prospects)} prospects</small>
              </Link>
              <Link className="card kpi" to="/clientes">
                <span>Serviços ativos</span><b>{nf.format(d.servicos.ativos)}</b>
                <small>em {d.servicos.porTipo.length} {d.servicos.porTipo.length === 1 ? 'tipo' : 'tipos'}</small>
              </Link>
              <Link className="card kpi" to="/gp/minhas-tarefas">
                <span>Tarefas abertas</span><b>{nf.format(d.tarefas.abertas)}</b>
                <small>{nf.format(d.tarefas.vencendoSemana)} vencem em 7 dias</small>
              </Link>
              <Link className={`card kpi ${d.tarefas.atrasadas > 0 ? 'alert' : ''}`} to="/gp/minhas-tarefas">
                <span>Tarefas atrasadas</span><b>{nf.format(d.tarefas.atrasadas)}</b>
                <small>{d.tarefas.atrasadas > 0 ? 'exigem ação hoje' : 'nenhuma atrasada'}</small>
              </Link>
              <Link className={`card kpi ${d.chamados.slaVencidos > 0 ? 'alert' : ''}`} to="/gp/workspace/all">
                <span>Chamados abertos</span><b>{nf.format(d.chamados.abertos)}</b>
                <small>{d.chamados.slaVencidos > 0 ? `${d.chamados.slaVencidos} com SLA vencido` : 'SLA em dia'}</small>
              </Link>
              <Link className={`card kpi ${d.landingPages.criticos7Dias > 0 ? 'alert' : ''}`} to="/hospedagens">
                <span>Hospedagens críticas</span><b>{nf.format(d.landingPages.criticos7Dias)}</b>
                <small>vencem em 7 dias · {d.landingPages.atencao30Dias} em atenção</small>
              </Link>
            </div>

            <div className="grid vxp-2-1">
              <Atencao data={d} />
              <section className="card" aria-labelledby="t-semana">
                <div className="ch"><h2 id="t-semana">Esta semana</h2><Link to="/gp/minhas-tarefas">Ver tarefas</Link></div>
                <div className="cp" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={linha}><span className="mut">Vencendo em 7 dias</span><b>{nf.format(d.tarefas.vencendoSemana)}</b></div>
                  <div style={linha}><span className="mut">Concluídas</span><b>{nf.format(d.tarefas.concluidasSemana)}</b></div>
                  <div style={linha}><span className="mut">Horas registradas</span><b>{nf.format(Math.round(d.tarefas.horasGastas * 10) / 10)} h</b></div>
                  <div style={linha}><span className="mut">Chamados resolvidos no mês</span><b>{nf.format(d.chamados.resolvidosMes)}</b></div>
                </div>
              </section>
            </div>

            <VisaoPorModulo data={d} />
          </>
        ) : null}
      </div>
    </div>
  );
}
