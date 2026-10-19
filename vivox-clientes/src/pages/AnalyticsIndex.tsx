import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { ClienteMono } from '../components/ClienteMono';

// Analytics no layout clean (canvas › Analytics). Clientes de GET /clientes;
// números de GET /analytics/sparklines (opcional: sem ele os cards mostram só as integrações).

type Filtro = 'all' | 'com' | 'sem' | 'ativos';

interface Sparkline {
  metrica: 'seguidores' | 'alcance' | null;
  rotulo: string;
  serie: { data: string; valor: number }[];
  ultimo: number | null;
  variacaoPct: number | null;
}

const INTEGRACOES: { key: string; label: string; has: (c: Cliente) => boolean }[] = [
  { key: 'ga4', label: 'GA4', has: (c) => Boolean(c.ga4PropertyId) },
  { key: 'gsc', label: 'Search Console', has: (c) => Boolean(c.gscSiteUrl) },
  { key: 'openpanel', label: 'OpenPanel', has: (c) => Boolean(c.openpanelProjectId) },
  { key: 'instagram', label: 'Instagram', has: (c) => Boolean(c.instagramAccountId || c.instagramUsername) },
];

const nIntegracoes = (c: Cliente) => INTEGRACOES.filter((i) => i.has(c)).length;
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const pctFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function AnalyticsIndex() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, Sparkline>>({});
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    api
      .get('/analytics/sparklines')
      .then((res) => setSparklines(res.data && typeof res.data === 'object' ? res.data : {}))
      .catch(() => setSparklines({}));
    try {
      const res = await api.get('/clientes');
      setClientes(res.data);
      setLoaded(true);
    } catch (e) {
      console.error('Erro ao carregar clientes:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const conta = useMemo(() => {
    const com = clientes.filter((c) => nIntegracoes(c) > 0).length;
    return { all: clientes.length, com, sem: clientes.length - com, ativos: clientes.filter((c) => c.status === 'ATIVO').length };
  }, [clientes]);

  const lista = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clientes
      .filter((c) => {
        if (q && ![c.nomeFantasia, c.segmento, c.responsavel?.nome].filter(Boolean).join(' ').toLowerCase().includes(q)) return false;
        const n = nIntegracoes(c);
        if (filtro === 'com') return n > 0;
        if (filtro === 'sem') return n === 0;
        if (filtro === 'ativos') return c.status === 'ATIVO';
        return true;
      })
      .sort((a, b) => {
        const rank = (c: Cliente) => (c.status === 'ATIVO' ? 0 : 2) + (nIntegracoes(c) > 0 ? 0 : 1);
        return rank(a) - rank(b) || nIntegracoes(b) - nIntegracoes(a) || a.nomeFantasia.localeCompare(b.nomeFantasia, 'pt-BR');
      });
  }, [clientes, search, filtro]);

  const filtros: { id: Filtro; label: string; n: number }[] = [
    { id: 'all', label: 'Todos', n: conta.all },
    { id: 'com', label: 'Com integração', n: conta.com },
    { id: 'sem', label: 'Sem integração', n: conta.sem },
    { id: 'ativos', label: 'Ativos', n: conta.ativos },
  ];

  return (
    <div className="vxp">
      <div className="pg">
        <div className="ph">
          <div>
            <h1>Analytics</h1>
            <p>Escolha um cliente para ver o painel de métricas do site e das redes.</p>
          </div>
          <div className="acts">
            <button className="btn sec" type="button" onClick={load} disabled={loading}>
              <RefreshCw className={`i ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>

        {error && !loaded ? (
          <div className="card empty">
            <AlertTriangle className="i" aria-hidden="true" style={{ color: 'var(--bad)' }} />
            <b>Não foi possível carregar os clientes.</b>
            <button type="button" className="btn pri sm" onClick={load}>Tentar de novo</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div className="srch">
                <Search className="i" aria-hidden="true" />
                <input className="inp" type="search" placeholder="Buscar cliente" aria-label="Buscar cliente" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="chips" role="group" aria-label="Filtrar clientes">
                {filtros.map((f) => (
                  <button key={f.id} className={f.id === filtro ? 'chip on' : 'chip'} type="button" aria-pressed={f.id === filtro} onClick={() => setFiltro(f.id)}>
                    {f.label} <em>{f.n}</em>
                  </button>
                ))}
              </div>
            </div>

            {loading && !loaded ? (
              <div className="grid g3 animate-pulse">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card" style={{ height: 150 }} />)}</div>
            ) : lista.length === 0 ? (
              <div className="card empty">
                <b>{clientes.length === 0 ? 'Nenhum cliente cadastrado ainda' : 'Nenhum cliente encontrado'}</b>
                <span>{clientes.length === 0 ? 'Cadastre um cliente para acompanhar as métricas.' : 'Ajuste a busca ou limpe os filtros.'}</span>
              </div>
            ) : (
              <div className="grid g3">
                {lista.map((c) => {
                  const sp = sparklines[c.id];
                  const temNumero = sp && sp.metrica && sp.ultimo != null;
                  return (
                    <Link className="card ac" key={c.id} to={`/analytics/${c.id}`}>
                      <div className="ac-h">
                        <ClienteMono cliente={c} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <b>{c.nomeFantasia}</b>
                          <small>{c.segmento || 'Segmento não informado'}</small>
                        </span>
                        <ChevronRight className="i" aria-hidden="true" style={{ color: 'var(--ink3)' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                        <span className="mut" style={{ fontSize: 12.5 }}>{temNumero ? sp.rotulo : 'Sem métricas recentes'}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
                          {temNumero && sp.variacaoPct != null && (
                            <small style={{ fontSize: 12, fontWeight: 600, color: sp.variacaoPct < 0 ? 'var(--bad)' : 'var(--ok)' }}>
                              {sp.variacaoPct < 0 ? '−' : '+'}{pctFmt.format(Math.abs(sp.variacaoPct))}%
                            </small>
                          )}
                          <b style={{ fontSize: 18, fontWeight: 620 }}>{temNumero ? compact.format(sp.ultimo as number) : '—'}</b>
                        </span>
                      </div>
                      <div className="ints">
                        {INTEGRACOES.map((i) => (
                          <span key={i.key} className={i.has(c) ? 'int' : 'int off'}>{i.label}</span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
