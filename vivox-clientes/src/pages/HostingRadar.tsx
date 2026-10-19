import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import type { RadarHospedagemResult, AtivoHospedagem } from '../types';
import { api } from '../api/client';
import { formatarDataBR, calcularDiasRestantes } from '../utils/hospedagemCalculo';
import { nf } from '../components/dashboard/DashboardShared';

// Radar de renovações no layout clean (canvas › Hospedagens). Dados de GET /hospedagens/radar.

type Urgencia = 'CRITICO' | 'ATENCAO' | 'EM_DIA' | 'SEM_DATA';
type Filtro = 'TODOS' | Urgencia;

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface Linha {
  ativo: AtivoHospedagem;
  nivel: Urgencia;
  menor: number | null;
  tipo: 'VPS' | 'DOMINIO' | null;
  dataProxima: string | null;
  diasVps: number | null;
  diasDom: number | null;
}

function montarLinha(ativo: AtivoHospedagem): Linha {
  const diasVps =
    typeof ativo.diasParaVps === 'number' ? ativo.diasParaVps : calcularDiasRestantes(ativo.dataRenovacaoVps);
  const diasDom =
    typeof ativo.diasParaDominio === 'number'
      ? ativo.diasParaDominio
      : calcularDiasRestantes(ativo.dataExpiracaoDominio);

  let tipo: Linha['tipo'] = null;
  let menor: number | null = null;
  if (diasVps !== null && (diasDom === null || diasVps <= diasDom)) {
    tipo = 'VPS';
    menor = diasVps;
  } else if (diasDom !== null) {
    tipo = 'DOMINIO';
    menor = diasDom;
  }
  if (typeof ativo.menorDias === 'number') menor = ativo.menorDias;

  const nivel: Urgencia =
    ativo.nivelUrgencia ??
    (menor === null ? 'SEM_DATA' : menor <= 7 ? 'CRITICO' : menor <= 30 ? 'ATENCAO' : 'EM_DIA');

  return {
    ativo,
    nivel,
    menor,
    tipo,
    dataProxima: tipo === 'VPS' ? ativo.dataRenovacaoVps ?? null : tipo === 'DOMINIO' ? ativo.dataExpiracaoDominio ?? null : null,
    diasVps,
    diasDom,
  };
}

function textoDias(dias: number | null): string {
  if (dias === null) return 'Sem data definida';
  if (dias === 0) return 'Vence hoje';
  if (dias < 0) return `há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}`;
  return `em ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

function badge(nivel: Urgencia, menor: number | null): [string, string] {
  if (nivel === 'CRITICO') return [menor !== null && menor < 0 ? 'Vencido' : 'Até 7 dias', 'bd bad'];
  if (nivel === 'ATENCAO') return ['Até 30 dias', 'bd warn'];
  if (nivel === 'EM_DIA') return ['Em dia', 'bd ok'];
  return ['Sem data', 'bd plain'];
}

export function HostingRadar() {
  const [radar, setRadar] = useState<RadarHospedagemResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('TODOS');

  const loadRadar = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/hospedagens/radar');
      setRadar(res.data);
    } catch (err) {
      console.error('Erro ao carregar radar de renovações:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRadar();
  }, [loadRadar]);

  // Mais urgente primeiro; sem data por último
  const linhas = useMemo(() => {
    const base = (radar?.proximasRenovacoes ?? []).map(montarLinha);
    return base.sort((a, b) => {
      if (a.menor === null && b.menor === null) return 0;
      if (a.menor === null) return 1;
      if (b.menor === null) return -1;
      return a.menor - b.menor;
    });
  }, [radar?.proximasRenovacoes]);

  const contagem = useMemo(() => {
    const c: Record<Urgencia, number> = { CRITICO: 0, ATENCAO: 0, EM_DIA: 0, SEM_DATA: 0 };
    linhas.forEach((l) => {
      c[l.nivel]++;
    });
    return c;
  }, [linhas]);

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return linhas.filter(({ ativo, nivel }) => {
      const alvo = [ativo.titulo, ativo.url, ativo.dominio, ativo.cliente?.nomeFantasia].filter(Boolean).join(' ').toLowerCase();
      return (!q || alvo.includes(q)) && (filtro === 'TODOS' || nivel === filtro);
    });
  }, [linhas, search, filtro]);

  // Vencimentos (hospedagem e domínio) por mês nos próximos 6 meses
  const porMes = useMemo(() => {
    const hoje = new Date();
    const meses = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MESES[d.getMonth()], n: 0 };
    });
    const idx = new Map(meses.map((m, i) => [m.key, i]));
    linhas.forEach(({ ativo, diasVps, diasDom }) => {
      if (diasVps !== null && diasVps >= 0 && ativo.dataRenovacaoVps) {
        const i = idx.get(ativo.dataRenovacaoVps.slice(0, 7));
        if (i !== undefined) meses[i].n++;
      }
      if (diasDom !== null && diasDom >= 0 && ativo.dataExpiracaoDominio) {
        const i = idx.get(ativo.dataExpiracaoDominio.slice(0, 7));
        if (i !== undefined) meses[i].n++;
      }
    });
    return meses;
  }, [linhas]);

  const clientesUnicos = useMemo(() => new Set(linhas.map((l) => l.ativo.clienteId)).size, [linhas]);
  const vencidos = linhas.filter((l) => l.menor !== null && l.menor < 0).length;

  const filtros: { id: Filtro; label: string; n: number }[] = [
    { id: 'TODOS', label: 'Todas', n: linhas.length },
    { id: 'CRITICO', label: 'Até 7 dias', n: contagem.CRITICO },
    { id: 'ATENCAO', label: '30 dias', n: contagem.ATENCAO },
    { id: 'EM_DIA', label: 'Em dia', n: contagem.EM_DIA },
    { id: 'SEM_DATA', label: 'Sem data', n: contagem.SEM_DATA },
  ];

  return (
    <div className="vxp">
      <div className="pg">
        <div className="ph">
          <div>
            <span className="kick">Radar de renovações</span>
            <h1 style={{ marginTop: 6 }}>Hospedagens e domínios</h1>
            <p>Hospedagens e domínios das landing pages dos clientes, por data de vencimento.</p>
          </div>
          <div className="acts">
            <button className="btn sec" type="button" onClick={loadRadar} disabled={loading}>
              <RefreshCw className={`i ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>

        {loading && !radar ? (
          <div className="grid g4 animate-pulse" aria-busy="true" aria-label="Carregando radar">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card" style={{ height: 96 }} />)}
          </div>
        ) : error && !radar ? (
          <div className="card empty">
            <AlertTriangle className="i" aria-hidden="true" style={{ color: 'var(--bad)' }} />
            <b>Não foi possível carregar o radar de renovações.</b>
            <button type="button" className="btn pri sm" onClick={loadRadar}>Tentar de novo</button>
          </div>
        ) : radar ? (
          <>
            {error && <p style={{ color: 'var(--bad)', fontSize: 12.5 }}>Falha ao atualizar; exibindo os últimos dados carregados.</p>}
            <div className="grid g4">
              <div className="card kpi">
                <span>Itens monitorados</span><b>{nf.format(radar.totalAtivos)}</b>
                <small>em {clientesUnicos} {clientesUnicos === 1 ? 'cliente' : 'clientes'}</small>
              </div>
              <div className={`card kpi ${radar.criticos7Dias > 0 ? 'alert' : ''}`}>
                <span>Críticos</span><b>{nf.format(radar.criticos7Dias)}</b>
                <small>{vencidos > 0 ? `${vencidos} ${vencidos === 1 ? 'vencido' : 'vencidos'}, renovar hoje` : 'vencem em até 7 dias'}</small>
              </div>
              <div className="card kpi">
                <span>Vencem em 30 dias</span><b>{nf.format(radar.atencao30Dias)}</b><small>planeje a renovação</small>
              </div>
              <div className="card kpi">
                <span>Em dia</span><b>{nf.format(radar.emDia)}</b>
                <small>{contagem.SEM_DATA > 0 ? `${contagem.SEM_DATA} sem data cadastrada` : 'sem ação agora'}</small>
              </div>
            </div>

            <section className="card cp" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="sec-t"><h2>Próximos 6 meses</h2><span className="mut" style={{ fontSize: 12.5 }}>Cada quadrado é um vencimento</span></div>
              <div className="months">
                {porMes.map((m) => (
                  <div className="mo" key={m.key}>
                    <span>{m.label}</span>
                    <b>{m.n}</b>
                    <div className="pips">{Array.from({ length: Math.min(m.n, 24) }).map((_, i) => <i key={i} />)}</div>
                  </div>
                ))}
              </div>
            </section>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div className="srch">
                <Search className="i" aria-hidden="true" />
                <input className="inp" type="search" placeholder="Buscar por cliente ou domínio" aria-label="Buscar renovações" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="chips" role="group" aria-label="Filtrar por urgência">
                {filtros.map((f) => (
                  <button key={f.id} className={f.id === filtro ? 'chip on' : 'chip'} type="button" aria-pressed={f.id === filtro} onClick={() => setFiltro(f.id)}>
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
                      <th>Cliente</th><th>Domínio ou serviço</th><th>Tipo</th><th>Vence em</th><th>Prazo</th><th>Urgência</th>
                      <th><span className="sr">Ação</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((l) => {
                      const [txt, bd] = badge(l.nivel, l.menor);
                      return (
                        <tr key={l.ativo.id}>
                          <td>
                            <span className="strong">{l.ativo.cliente?.nomeFantasia || 'Cliente'}</span>
                            <small className="mut" style={{ display: 'block', fontSize: 12 }}>{l.ativo.titulo}</small>
                          </td>
                          <td>
                            {l.ativo.url ? (
                              <a href={l.ativo.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--acc-ink)' }}>
                                {l.ativo.dominio || l.ativo.url.replace(/^https?:\/\//, '')}
                                <ExternalLink className="i" aria-hidden="true" style={{ width: 13, height: 13 }} />
                              </a>
                            ) : (
                              l.ativo.dominio || '—'
                            )}
                          </td>
                          <td className="mut">{l.tipo === 'VPS' ? 'Hospedagem' : l.tipo === 'DOMINIO' ? 'Domínio' : '—'}</td>
                          <td>{l.dataProxima ? formatarDataBR(l.dataProxima) : '—'}</td>
                          <td className="mut">{textoDias(l.menor)}</td>
                          <td><span className={bd}>{txt}</span></td>
                          <td className="r">
                            <Link className="btn gh sm" to={`/cliente/${l.ativo.clienteId}?tab=services`}>Abrir cliente</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtradas.length === 0 && (
                <div className="empty">
                  <b>{linhas.length === 0 ? 'Nenhuma hospedagem cadastrada ainda' : 'Nada encontrado'}</b>
                  <span>{linhas.length === 0 ? 'Cadastre hospedagens no perfil de cada cliente.' : 'Ajuste a busca ou limpe os filtros.'}</span>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
