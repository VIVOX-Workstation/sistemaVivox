import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import type { RadarHospedagemResult, AtivoHospedagem } from '../types';
import { api } from '../api/client';
import {
  Globe,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarOff,
  Search,
  ExternalLink,
  Building2,
  RefreshCw,
  Server,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { formatarDataBR, calcularDiasRestantes } from '../utils/hospedagemCalculo';
import { Panel, EmptyChart, CHART_COLORS, CHART_HEIGHT, nf } from '../components/dashboard/DashboardShared';
import './planning-workspace.css';

type Urgencia = 'CRITICO' | 'ATENCAO' | 'EM_DIA' | 'SEM_DATA';
type Filtro = 'TODOS' | Urgencia;

const URGENCIA_META: Record<Urgencia, { label: string; color: string; badge: string }> = {
  CRITICO: { label: 'Críticos', color: CHART_COLORS.danger, badge: 'text-[#B83B32] bg-[#FDF2F2] border-[#FCDAD7]' },
  ATENCAO: { label: 'Atenção', color: CHART_COLORS.gold, badge: 'text-[#8A6828] bg-[#FAF2E4] border-[#E8D4B4]' },
  EM_DIA: { label: 'Em dia', color: CHART_COLORS.success, badge: 'text-[#247A4A] bg-[#E6F4EA] border-[#CEEAD6]' },
  SEM_DATA: { label: 'Sem data', color: CHART_COLORS.taupe, badge: 'text-[#5E574C] bg-[#EEE7DC] border-[#D8CBB8]' },
};

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

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
  if (dias < 0) return `Venceu há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}`;
  return `em ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

function UrgenciaBadge({ nivel, menor }: { nivel: Urgencia; menor: number | null }) {
  const meta = URGENCIA_META[nivel];
  const Icon = nivel === 'CRITICO' ? AlertTriangle : nivel === 'ATENCAO' ? Clock : nivel === 'EM_DIA' ? CheckCircle2 : CalendarOff;
  const texto =
    nivel === 'CRITICO' ? (menor !== null && menor < 0 ? 'Vencido' : 'Crítico') : nivel === 'ATENCAO' ? 'Atenção' : nivel === 'EM_DIA' ? 'Em dia' : 'Sem data';
  return (
    <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${meta.badge}`}>
      <Icon className="w-3 h-3 shrink-0" /> {texto}
    </span>
  );
}

function TipoTag({ tipo }: { tipo: Linha['tipo'] }) {
  if (!tipo) return <span className="text-[#8F8271]">-</span>;
  const Icon = tipo === 'VPS' ? Server : Globe;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E1A16] whitespace-nowrap">
      <Icon className="w-3.5 h-3.5 text-[#7A6440]" /> {tipo === 'VPS' ? 'Hospedagem (VPS)' : 'Domínio'}
    </span>
  );
}

function RadarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Carregando radar">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="pw-glass-card h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="pw-glass-panel h-72 lg:col-span-2" />
        <div className="pw-glass-panel h-72" />
      </div>
      <div className="pw-glass-panel h-80" />
    </div>
  );
}

interface KpiProps {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  color?: string;
  active: boolean;
  onClick: () => void;
}

function Kpi({ label, value, hint, icon, color, active, onClick }: KpiProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`pw-glass-card p-4 text-left flex flex-col gap-1.5 cursor-pointer min-w-0 ${
        active ? 'ring-2 ring-[#C7A15F]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
        <span className="truncate text-[#5E574C]">{label}</span>
        <span style={{ color: color ?? '#7A6440' }}>{icon}</span>
      </div>
      <span className="text-2xl font-bold" style={{ color: color ?? '#1E1A16' }}>
        {nf.format(value)}
      </span>
      <span className="text-[11.5px] text-[#5E574C] truncate">{hint}</span>
    </button>
  );
}

export function HostingRadar() {
  const [radar, setRadar] = useState<RadarHospedagemResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filterUrgencia, setFilterUrgencia] = useState<Filtro>('TODOS');
  const navigate = useNavigate();

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

  // Todas as linhas, ordenadas por urgência (menor prazo primeiro; sem data por último)
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
      const matchSearch =
        !q ||
        ativo.titulo.toLowerCase().includes(q) ||
        ativo.url.toLowerCase().includes(q) ||
        (ativo.dominio && ativo.dominio.toLowerCase().includes(q)) ||
        (ativo.cliente?.nomeFantasia && ativo.cliente.nomeFantasia.toLowerCase().includes(q));
      const matchUrgencia = filterUrgencia === 'TODOS' ? true : nivel === filterUrgencia;
      return matchSearch && matchUrgencia;
    });
  }, [linhas, search, filterUrgencia]);

  // Vencimentos (hospedagem e domínio) por mês nos próximos 6 meses
  const porMes = useMemo(() => {
    const hoje = new Date();
    const meses = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, vps: 0, dominio: 0 };
    });
    const idx = new Map(meses.map((m, i) => [m.key, i]));
    linhas.forEach(({ ativo, diasVps, diasDom }) => {
      if (diasVps !== null && diasVps >= 0 && ativo.dataRenovacaoVps) {
        const i = idx.get(ativo.dataRenovacaoVps.slice(0, 7));
        if (i !== undefined) meses[i].vps++;
      }
      if (diasDom !== null && diasDom >= 0 && ativo.dataExpiracaoDominio) {
        const i = idx.get(ativo.dataExpiracaoDominio.slice(0, 7));
        if (i !== undefined) meses[i].dominio++;
      }
    });
    return meses;
  }, [linhas]);
  const temVencimentos = porMes.some((m) => m.vps + m.dominio > 0);

  const donutData = (['CRITICO', 'ATENCAO', 'EM_DIA', 'SEM_DATA'] as Urgencia[])
    .filter((k) => contagem[k] > 0)
    .map((k) => ({ id: k, value: contagem[k], label: URGENCIA_META[k].label, color: URGENCIA_META[k].color }));

  const pills: { id: Filtro; label: string; count: number }[] = [
    { id: 'TODOS', label: 'Todos', count: linhas.length },
    { id: 'CRITICO', label: 'Críticos', count: contagem.CRITICO },
    { id: 'ATENCAO', label: 'Atenção', count: contagem.ATENCAO },
    { id: 'EM_DIA', label: 'Em dia', count: contagem.EM_DIA },
    { id: 'SEM_DATA', label: 'Sem data', count: contagem.SEM_DATA },
  ];

  const abrirCliente = (clienteId: string) => navigate(`/cliente/${clienteId}?tab=services`);
  const toggle = (f: Filtro) => setFilterUrgencia((cur) => (cur === f ? 'TODOS' : f));

  return (
    <div className="planning-workspace w-full space-y-6">
      <div className="pw-lg-scene" aria-hidden="true" />

      {/* CABEÇALHO */}
      <div className="pw-glass-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <span className="pw-section-label">Radar de renovações</span>
          <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight">Hospedagens e domínios</h1>
          <p className="text-xs text-[#5E574C]">
            Acompanhe os vencimentos de hospedagem e domínio das landing pages dos clientes, do mais urgente ao mais tranquilo.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRadar}
          disabled={loading}
          className="pw-glass-control px-3 py-2 text-xs font-semibold text-[#1E1A16] flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#7A6440] ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {loading && !radar ? (
        <RadarSkeleton />
      ) : error && !radar ? (
        <div className="pw-glass-panel p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-6 h-6 text-[#B83B32]" />
          <p className="text-sm font-semibold text-[#1E1A16]">Não foi possível carregar o radar de renovações.</p>
          <button
            type="button"
            onClick={loadRadar}
            className="pw-glass-control pw-glass-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tentar de novo
          </button>
        </div>
      ) : radar ? (
        <>
          {error && <p className="text-xs text-[#B83B32] px-1">Falha ao atualizar; exibindo os últimos dados carregados.</p>}

          {/* KPIs clicáveis */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Kpi
              label="Total de ativos"
              value={radar.totalAtivos}
              hint="Mostrar todos"
              icon={<Layers className="w-4 h-4" />}
              active={filterUrgencia === 'TODOS'}
              onClick={() => setFilterUrgencia('TODOS')}
            />
            <Kpi
              label="Críticos (≤ 7 dias)"
              value={radar.criticos7Dias}
              hint="Inclui vencidos"
              icon={<AlertTriangle className="w-4 h-4" />}
              color={radar.criticos7Dias > 0 ? CHART_COLORS.danger : undefined}
              active={filterUrgencia === 'CRITICO'}
              onClick={() => toggle('CRITICO')}
            />
            <Kpi
              label="Atenção (≤ 30 dias)"
              value={radar.atencao30Dias}
              hint="Planeje a renovação"
              icon={<Clock className="w-4 h-4" />}
              color={CHART_COLORS.goldDark}
              active={filterUrgencia === 'ATENCAO'}
              onClick={() => toggle('ATENCAO')}
            />
            <Kpi
              label="Em dia (> 30 dias)"
              value={radar.emDia}
              hint="Sem pendência próxima"
              icon={<CheckCircle2 className="w-4 h-4" />}
              color={CHART_COLORS.success}
              active={filterUrgencia === 'EM_DIA'}
              onClick={() => toggle('EM_DIA')}
            />
            <Kpi
              label="Sem data"
              value={contagem.SEM_DATA}
              hint="Cadastre os vencimentos"
              icon={<CalendarOff className="w-4 h-4" />}
              active={filterUrgencia === 'SEM_DATA'}
              onClick={() => toggle('SEM_DATA')}
            />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Vencimentos nos próximos 6 meses" className="lg:col-span-2">
              {temVencimentos ? (
                <BarChart
                  height={CHART_HEIGHT}
                  xAxis={[{ scaleType: 'band', data: porMes.map((m) => m.label) }]}
                  series={[
                    { data: porMes.map((m) => m.vps), label: 'Hospedagem', color: CHART_COLORS.gold, stack: 'v' },
                    { data: porMes.map((m) => m.dominio), label: 'Domínio', color: CHART_COLORS.brown, stack: 'v' },
                  ]}
                  margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
                />
              ) : (
                <EmptyChart message="Nenhum vencimento de hospedagem ou domínio previsto para os próximos 6 meses." />
              )}
            </Panel>

            <Panel title="Distribuição por urgência">
              {donutData.length > 0 ? (
                <PieChart
                  height={CHART_HEIGHT}
                  series={[{ innerRadius: 50, paddingAngle: 2, cornerRadius: 4, data: donutData }]}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                />
              ) : (
                <EmptyChart message="Nenhum ativo de hospedagem cadastrado." />
              )}
            </Panel>
          </div>

          {/* Filtros e busca */}
          <div className="pw-glass-panel p-4 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 relative min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8271]" />
              <input
                type="search"
                placeholder="Buscar por cliente, título, URL ou domínio..."
                aria-label="Buscar renovações"
                className="pw-glass-control w-full h-9 pl-9 pr-3 text-xs text-[#1E1A16] outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {pills.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFilterUrgencia(p.id)}
                  aria-pressed={filterUrgencia === p.id}
                  className={`pw-glass-pill px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    filterUrgencia === p.id ? 'pw-glass-primary' : 'text-[#1E1A16]'
                  }`}
                >
                  {p.label} ({p.count})
                </button>
              ))}
            </div>
          </div>

          {/* Lista priorizada */}
          <div className="pw-glass-panel p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-[#D8CBB8]/60 text-xs font-semibold text-[#5E574C]">
              {filtradas.length} {filtradas.length === 1 ? 'resultado' : 'resultados'}
              {filtradas.length !== linhas.length && ` de ${linhas.length}`}
            </div>

            {filtradas.length === 0 ? (
              <div className="py-14 px-4 text-center text-xs text-[#8F8271]">
                {linhas.length === 0
                  ? 'Nenhuma hospedagem ativa cadastrada ainda.'
                  : 'Nenhuma hospedagem encontrada para os filtros selecionados.'}
              </div>
            ) : (
              <>
                {/* Tabela (desktop) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="text-[#5E574C] border-b border-[#D8CBB8]/60">
                      <tr>
                        <th className="py-3 px-5 font-bold">Cliente</th>
                        <th className="py-3 px-3 font-bold">Domínio / URL</th>
                        <th className="py-3 px-3 font-bold">Vence primeiro</th>
                        <th className="py-3 px-3 font-bold">Data</th>
                        <th className="py-3 px-3 font-bold">Prazo</th>
                        <th className="py-3 px-3 font-bold">Urgência</th>
                        <th className="py-3 px-5 text-right font-bold">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8CBB8]/40">
                      {filtradas.map((l) => (
                        <tr key={l.ativo.id} className="hover:bg-white/50 transition-colors">
                          <td className="py-3 px-5">
                            <button
                              type="button"
                              onClick={() => abrirCliente(l.ativo.clienteId)}
                              className="font-bold text-[#1E1A16] hover:text-[#8A6828] flex items-center gap-1.5 text-left cursor-pointer"
                            >
                              <Building2 className="w-3.5 h-3.5 text-[#7A6440] shrink-0" />
                              {l.ativo.cliente?.nomeFantasia || 'Cliente'}
                            </button>
                            <div className="text-[11.5px] text-[#5E574C] mt-0.5 truncate max-w-[220px]" title={l.ativo.titulo}>
                              {l.ativo.titulo}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {l.ativo.dominio && (
                              <div className="font-mono text-[11.5px] text-[#1E1A16] truncate max-w-[200px]" title={l.ativo.dominio}>
                                {l.ativo.dominio}
                              </div>
                            )}
                            <a
                              href={l.ativo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#8A6828] hover:underline font-mono text-[11.5px] flex items-center gap-1 truncate max-w-[200px]"
                              title={l.ativo.url}
                            >
                              {l.ativo.url.replace(/^https?:\/\//, '')}
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </td>
                          <td className="py-3 px-3">
                            <TipoTag tipo={l.tipo} />
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#1E1A16] whitespace-nowrap">
                            {l.dataProxima ? formatarDataBR(l.dataProxima) : '-'}
                          </td>
                          <td className="py-3 px-3 text-[#1E1A16] whitespace-nowrap">{textoDias(l.menor)}</td>
                          <td className="py-3 px-3">
                            <UrgenciaBadge nivel={l.nivel} menor={l.menor} />
                          </td>
                          <td className="py-3 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => abrirCliente(l.ativo.clienteId)}
                              className="pw-glass-pill px-2.5 py-1 text-[11.5px] font-semibold text-[#1E1A16] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              Abrir cliente <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards (mobile) */}
                <ul className="md:hidden divide-y divide-[#D8CBB8]/40">
                  {filtradas.map((l) => (
                    <li key={l.ativo.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#1E1A16] truncate">{l.ativo.cliente?.nomeFantasia || 'Cliente'}</p>
                          <p className="text-[11.5px] text-[#5E574C] truncate">{l.ativo.titulo}</p>
                        </div>
                        <UrgenciaBadge nivel={l.nivel} menor={l.menor} />
                      </div>
                      <a
                        href={l.ativo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#8A6828] font-mono text-[11.5px] flex items-center gap-1 truncate"
                      >
                        {l.ativo.dominio || l.ativo.url.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5">
                          <TipoTag tipo={l.tipo} />
                          <p className="text-[#1E1A16]">
                            {l.dataProxima ? `${formatarDataBR(l.dataProxima)}, ` : ''}
                            {textoDias(l.menor)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => abrirCliente(l.ativo.clienteId)}
                          className="pw-glass-pill px-2.5 py-1.5 text-[11.5px] font-semibold text-[#1E1A16] inline-flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          Abrir cliente <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
