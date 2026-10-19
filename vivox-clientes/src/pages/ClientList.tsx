import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, ChevronRight, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { ClienteMono } from '../components/ClienteMono';
import { STATUS_CLIENTE } from '../utils/clean';

// Lista de clientes no layout clean (canvas › Clientes). Dados de GET /clientes.

type Filtro = 'all' | 'ATIVO' | 'PROSPECT' | 'PAUSADO' | 'ENCERRADO';

const STATUS_RANK: Record<string, number> = { ATIVO: 0, PROSPECT: 1, PAUSADO: 2, ENCERRADO: 3 };

const dateFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' });

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : dateFmt.format(d).replace('.', '').replace(' de ', ' ');
}

export function ClientList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Filtro>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadClientes = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
      setLoaded(true);
    } catch (e) {
      console.error('Erro ao carregar clientes', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const conta = useCallback((s: string) => clientes.filter((c) => c.status === s).length, [clientes]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clientes
      .filter((c) => {
        if (term) {
          const alvo = [c.nomeFantasia, c.razaoSocial, c.segmento, c.responsavel?.nome].filter(Boolean).join(' ').toLowerCase();
          if (!alvo.includes(term)) return false;
        }
        return statusFilter === 'all' || c.status === statusFilter;
      })
      .sort((a, b) => {
        const d = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
        return d !== 0 ? d : a.nomeFantasia.localeCompare(b.nomeFantasia, 'pt-BR');
      });
  }, [clientes, search, statusFilter]);

  const filtros: { id: Filtro; label: string; n: number }[] = [
    { id: 'all', label: 'Todos', n: clientes.length },
    { id: 'ATIVO', label: 'Ativos', n: conta('ATIVO') },
    { id: 'PROSPECT', label: 'Prospects', n: conta('PROSPECT') },
    { id: 'PAUSADO', label: 'Pausados', n: conta('PAUSADO') },
    { id: 'ENCERRADO', label: 'Encerrados', n: conta('ENCERRADO') },
  ];

  const limpar = () => {
    setSearch('');
    setStatusFilter('all');
  };

  return (
    <div className="vxp">
      <div className="pg">
        <div className="ph">
          <div>
            <h1>Clientes</h1>
            <p>Gerencie a carteira e abra o perfil de cada cliente.</p>
          </div>
          <div className="acts">
            <Link className="btn pri" to="/cliente/novo"><Plus className="i" aria-hidden="true" />Novo cliente</Link>
          </div>
        </div>

        {error && !loaded ? (
          <div className="card empty">
            <AlertTriangle className="i" aria-hidden="true" style={{ color: 'var(--bad)' }} />
            <b>Não foi possível carregar os clientes.</b>
            <button type="button" className="btn pri sm" onClick={loadClientes}>Tentar de novo</button>
          </div>
        ) : (
          <>
            {error && <p style={{ color: 'var(--bad)', fontSize: 12.5 }}>Falha ao atualizar; exibindo os últimos dados carregados.</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div className="srch">
                <Search className="i" aria-hidden="true" />
                <input
                  className="inp"
                  type="search"
                  placeholder="Buscar por nome, segmento ou responsável"
                  aria-label="Buscar clientes"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="chips" role="group" aria-label="Filtrar por status">
                {filtros.map((f) => (
                  <button
                    key={f.id}
                    className={f.id === statusFilter ? 'chip on' : 'chip'}
                    type="button"
                    aria-pressed={f.id === statusFilter}
                    onClick={() => setStatusFilter(f.id)}
                  >
                    {f.label} <em>{f.n}</em>
                  </button>
                ))}
              </div>
            </div>

            <section className="card">
              <div className="tw">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Cliente</th><th>Status</th><th>Serviços</th><th>Responsável</th><th>Cliente desde</th>
                      <th><span className="sr">Abrir</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && !loaded
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td colSpan={6}><div style={{ height: 40, borderRadius: 8, background: 'var(--sk)' }} /></td>
                          </tr>
                        ))
                      : filtered.map((c) => {
                          const [label, bd] = STATUS_CLIENTE[c.status] ?? [c.status, 'bd'];
                          const n = c._count?.servicosContratados;
                          const h = c._count?.ativosHospedagem;
                          return (
                            <tr key={c.id}>
                              <td>
                                <Link className="cl" to={`/cliente/${c.id}`}>
                                  <ClienteMono cliente={c} />
                                  <span style={{ minWidth: 0 }}>
                                    <b>{c.nomeFantasia}</b>
                                    <small>{c.segmento || 'Segmento não informado'}</small>
                                  </span>
                                </Link>
                              </td>
                              <td><span className={bd}>{label}</span></td>
                              <td>
                                {n === undefined ? '—' : `${n} ${n === 1 ? 'serviço' : 'serviços'}`}
                                {h ? <span className="mut"> · {h} {h === 1 ? 'hospedagem' : 'hospedagens'}</span> : null}
                              </td>
                              <td className="mut">{c.responsavel?.nome || 'Equipe'}</td>
                              <td className="mut">{formatDate(c.dataInicioContrato || c.createdAt) ?? '—'}</td>
                              <td className="r">
                                <Link className="btn sec sm" to={`/cliente/${c.id}?tab=propostas`} aria-label={`Propostas de ${c.nomeFantasia}`}>Propostas</Link>
                                <Link className="ib sm" to={`/cliente/${c.id}`} aria-label={`Abrir perfil de ${c.nomeFantasia}`}>
                                  <ChevronRight className="i" aria-hidden="true" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
              {loaded && filtered.length === 0 && (
                <div className="empty">
                  <b>{clientes.length === 0 ? 'Nenhum cliente cadastrado ainda' : 'Nenhum cliente encontrado'}</b>
                  <span>{clientes.length === 0 ? 'Cadastre o primeiro cliente para começar.' : 'Ajuste a busca ou limpe os filtros.'}</span>
                  {clientes.length === 0 ? (
                    <Link className="btn pri sm" to="/cliente/novo">Novo cliente</Link>
                  ) : (
                    <button className="btn sec sm" type="button" onClick={limpar}>Limpar filtros</button>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
