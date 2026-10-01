import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Search,
  ArrowUpRight,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Settings,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { CHART_COLORS, nf } from '../components/dashboard/DashboardShared';
import './planning-workspace.css';

type Filtro = 'all' | 'configurados' | 'ativos' | 'sem';

interface Sparkline {
  metrica: 'seguidores' | 'alcance' | null;
  rotulo: string;
  serie: { data: string; valor: number }[];
  ultimo: number | null;
  variacaoPct: number | null;
}
type SparklineMap = Record<string, Sparkline>;

const INTEGRACOES: { key: string; label: string; has: (c: Cliente) => boolean }[] = [
  { key: 'ga4', label: 'GA4', has: (c) => Boolean(c.ga4PropertyId) },
  { key: 'gsc', label: 'Search Console', has: (c) => Boolean(c.gscSiteUrl) },
  { key: 'openpanel', label: 'OpenPanel', has: (c) => Boolean(c.openpanelProjectId) },
  { key: 'instagram', label: 'Instagram', has: (c) => Boolean(c.instagramAccountId || c.instagramUsername) },
];

const integracoesDe = (c: Cliente) => INTEGRACOES.filter((i) => i.has(c));

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const pctFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Carregando analytics">
      <div className="pw-glass-panel h-14" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="pw-glass-card h-44" />
        ))}
      </div>
    </div>
  );
}

// Série decorativa determinística (por cliente) quando ainda não há dados reais
function serieDecorativa(id: string): number[] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const rnd = () => ((h = (h * 1664525 + 1013904223) >>> 0) / 4294967296);
  let v = 40 + rnd() * 20;
  return Array.from({ length: 16 }, () => (v += (rnd() - 0.38) * 14));
}

function CardChart({ spark, id }: { spark?: Sparkline; id: string }) {
  const real = Boolean(spark && spark.metrica && spark.serie?.length >= 2);
  const data = real ? spark!.serie.map((p) => p.valor) : serieDecorativa(id);
  if (data.length < 2) return null;
  const negativo = real && spark!.variacaoPct != null && spark!.variacaoPct < 0;
  const color = negativo ? CHART_COLORS.danger : '#C7A15F';
  const W = 100;
  const H = 40;
  const pad = 6;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    pad + (1 - (v - min) / range) * (H - pad * 2),
  ]);
  // curva suave (Catmull-Rom -> Bezier)
  let line = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    line += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="absolute left-0 right-0 bottom-0 w-full pointer-events-none"
      style={{ height: '50%', zIndex: 0 }}
    >
      <defs>
        <linearGradient id={`fade-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={real ? 0.28 : 0.14} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#fade-${id})`} />
      <path d={line} fill="none" stroke={color} strokeOpacity={real ? 0.45 : 0.22} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function AnalyticsIndex() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sparklines, setSparklines] = useState<SparklineMap>({});
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<Filtro>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  const loadClientes = useCallback(async () => {
    setLoading(true);
    setError(false);
    // Gráficos de fundo são opcionais: falha não afeta a página.
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
    loadClientes();
  }, [loadClientes]);

  const stats = useMemo(() => {
    const total = clientes.length;
    const configurados = clientes.filter((c) => integracoesDe(c).length > 0).length;
    return {
      total,
      configurados,
      sem: total - configurados,
      ativos: clientes.filter((c) => c.status === 'ATIVO').length,
    };
  }, [clientes]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clientes
      .filter((c) => {
        if (term) {
          const match =
            c.nomeFantasia.toLowerCase().includes(term) ||
            (c.segmento && c.segmento.toLowerCase().includes(term)) ||
            (c.responsavel?.nome && c.responsavel.nome.toLowerCase().includes(term));
          if (!match) return false;
        }
        const n = integracoesDe(c).length;
        if (filterType === 'configurados' && n === 0) return false;
        if (filterType === 'sem' && n > 0) return false;
        if (filterType === 'ativos' && c.status !== 'ATIVO') return false;
        return true;
      })
      .sort((a, b) => {
        const rank = (c: Cliente) =>
          (c.status === 'ATIVO' ? 0 : 2) + (integracoesDe(c).length > 0 ? 0 : 1);
        const d = rank(a) - rank(b);
        if (d !== 0) return d;
        const di = integracoesDe(b).length - integracoesDe(a).length;
        return di !== 0 ? di : a.nomeFantasia.localeCompare(b.nomeFantasia, 'pt-BR');
      });
  }, [clientes, search, filterType]);

  const pills: { id: Filtro; label: string; count: number }[] = [
    { id: 'all', label: 'Todos', count: stats.total },
    { id: 'configurados', label: 'Com analytics', count: stats.configurados },
    { id: 'ativos', label: 'Ativos', count: stats.ativos },
    { id: 'sem', label: 'Sem integração', count: stats.sem },
  ];

  const filtrosAtivos = filterType !== 'all' || search.trim() !== '';

  return (
    <div className="planning-workspace w-full space-y-6">
      <div className="pw-lg-scene" aria-hidden="true" />

      {/* CABEÇALHO */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="space-y-0.5 min-w-0">
          <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight">Analytics</h1>
          <p className="text-xs text-[#5E574C]">Escolha um cliente para ver o painel de métricas.</p>
        </div>
        <button
          type="button"
          onClick={loadClientes}
          disabled={loading}
          className="pw-glass-control px-3 py-2 text-xs font-semibold text-[#1E1A16] flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#7A6440] ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {loading && !loaded ? (
        <AnalyticsSkeleton />
      ) : error && !loaded ? (
        <div className="pw-glass-panel p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-6 h-6 text-[#B83B32]" />
          <p className="text-sm font-semibold text-[#1E1A16]">Não foi possível carregar os clientes.</p>
          <button
            type="button"
            onClick={loadClientes}
            className="pw-glass-control pw-glass-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tentar de novo
          </button>
        </div>
      ) : (
        <>
          {error && (
            <p className="text-xs text-[#B83B32] px-1">Falha ao atualizar; exibindo os últimos dados carregados.</p>
          )}

          {/* Busca e filtros */}
          <div className="pw-glass-panel p-4 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative lg:w-72">
              <Search className="w-3.5 h-3.5 text-[#8F8271] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, segmento ou responsável..."
                aria-label="Buscar clientes"
                className="pw-glass-control w-full h-9 pl-9 pr-8 text-xs text-[#1E1A16] outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8F8271] hover:text-[#1E1A16] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {pills.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFilterType(p.id)}
                  aria-pressed={filterType === p.id}
                  className={`pw-glass-pill px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    filterType === p.id ? 'pw-glass-primary' : 'text-[#1E1A16]'
                  }`}
                >
                  {p.label} ({nf.format(p.count)})
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-[#5E574C] lg:ml-auto">
              Exibindo <strong className="text-[#1E1A16]">{filtered.length}</strong> de {stats.total} clientes
            </span>
          </div>

          {/* Grade de clientes */}
          {filtered.length === 0 ? (
            <div className="pw-glass-panel p-10 flex flex-col items-center gap-2 text-center">
              <BarChart2 className="w-8 h-8 text-[#C7A15F] opacity-70" />
              <p className="text-sm font-bold text-[#1E1A16]">
                {stats.total === 0 ? 'Nenhum cliente cadastrado ainda' : 'Nenhum cliente encontrado'}
              </p>
              <p className="text-xs text-[#5E574C]">
                {stats.total === 0
                  ? 'Cadastre um cliente para começar a acompanhar as métricas.'
                  : 'Tente ajustar os filtros ou pesquisar por outro nome.'}
              </p>
              {filtrosAtivos && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setFilterType('all');
                  }}
                  className="pw-glass-control px-3 py-1.5 text-xs font-semibold text-[#1E1A16] cursor-pointer mt-1"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filtered.map((cliente) => {
                const conectadas = integracoesDe(cliente);
                const ativo = cliente.status === 'ATIVO';
                const spark = sparklines[cliente.id];
                const temGrafico = Boolean(spark && spark.metrica && spark.serie?.length >= 2);
                const variacao = spark?.variacaoPct ?? null;
                return (
                  <div
                    key={cliente.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/analytics/${cliente.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/analytics/${cliente.id}`);
                    }}
                    className="pw-glass-card group relative overflow-hidden p-5 flex flex-col gap-3 cursor-pointer min-w-0"
                  >
                    <CardChart spark={spark} id={cliente.id} />

                    <div className="relative flex items-start gap-3">
                      <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/60 border border-[#E5D9C8] flex items-center justify-center overflow-hidden">
                        {cliente.logoUrl ? (
                          <img
                            src={resolveMediaUrl(cliente.logoUrl)}
                            alt={cliente.nomeFantasia}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BarChart2 className="w-6 h-6 text-[#C7A15F]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-[#1E1A16] leading-tight truncate">
                          {cliente.nomeFantasia}
                        </h3>
                        <p className="text-xs text-[#5E574C] truncate mt-0.5">
                          {cliente.segmento || 'Segmento não informado'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          ativo
                            ? 'text-[#247A4A] bg-[#EEF8F2] border-[#C9E8D5]'
                            : 'text-[#5E574C] bg-white/50 border-[#D8CBB8]'
                        }`}
                      >
                        {ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="relative flex-1 min-h-[2.5rem]">
                      {conectadas.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {conectadas.map((i) => (
                            <span
                              key={i.key}
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#C7A15F]/20 text-[#8A6828] border border-[#C7A15F]/35"
                            >
                              {i.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-[#E8B4B0] bg-[#FDF2F2]/70 px-3 py-2">
                          <span className="text-xs font-semibold text-[#B83B32] flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Sem integração
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/analytics/${cliente.id}`);
                            }}
                            className="pw-glass-pill px-2.5 py-1 text-[11.5px] font-semibold text-[#1E1A16] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Settings className="w-3 h-3" /> Configurar
                          </button>
                        </div>
                      )}
                    </div>

                    {temGrafico && spark && spark.ultimo != null && (
                      <div className="relative flex items-baseline gap-1.5 text-xs text-[#5E574C]">
                        <span className="font-semibold">{spark.rotulo}</span>
                        <span className="font-bold text-[#1E1A16]">{compact.format(spark.ultimo)}</span>
                        {variacao != null && (
                          <span
                            className="font-bold"
                            style={{ color: variacao < 0 ? CHART_COLORS.danger : CHART_COLORS.success }}
                          >
                            {variacao < 0 ? '▼' : '▲'} {pctFmt.format(Math.abs(variacao))}%
                          </span>
                        )}
                      </div>
                    )}

                    <div className="relative pt-3 border-t border-[#E5D9C8]/70 flex items-center justify-between gap-2 text-xs">
                      <span className="text-[#5E574C] font-semibold flex items-center gap-1 min-w-0">
                        <UserCheck className="w-3 h-3 text-[#C7A15F] shrink-0" />
                        <span className="truncate">{cliente.responsavel?.nome || 'Equipe'}</span>
                      </span>
                      <span className="font-bold text-[#7A6440] flex items-center gap-1 group-hover:underline shrink-0">
                        Ver analytics <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
