import { useState, useEffect, useMemo } from 'react';
import type { Cliente, GoogleDashboardResult } from '../../types';
import { api } from '../../api/client';
import {
  Search,
  Users,
  UserPlus,
  Activity,
  Eye,
  Clock,
  MousePointerClick,
  Percent,
  Award,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Flame,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Modal } from '../Modal';
import { Input } from '../Input';

interface Props {
  cliente: Cliente;
  onClienteUpdated?: (updated: Partial<Cliente>) => void;
}

export function GoogleAnalyticsDashboard({ cliente, onClienteUpdated }: Props) {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<GoogleDashboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [ga4IdInput, setGa4IdInput] = useState(cliente.ga4PropertyId || '');
  const [gscUrlInput, setGscUrlInput] = useState(cliente.gscSiteUrl || '');
  const [queryFilter, setQueryFilter] = useState('');
  const [pageFilter, setPageFilter] = useState('');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  useEffect(() => {
    setGa4IdInput(cliente.ga4PropertyId || '');
    setGscUrlInput(cliente.gscSiteUrl || '');
    loadDashboard(days, false);
  }, [cliente.id, days]);

  const loadDashboard = async (selectedDays: number, forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get(
        `/analytics/google/${cliente.id}?days=${selectedDays}${forceRefresh ? '&refresh=true' : ''}`
      );
      setData(res.data);
    } catch (error) {
      console.error('Erro ao carregar Google Dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await api.patch(`/analytics/google/${cliente.id}`, {
        ga4PropertyId: ga4IdInput,
        gscSiteUrl: gscUrlInput,
      });

      if (onClienteUpdated) {
        onClienteUpdated({
          ga4PropertyId: ga4IdInput,
          gscSiteUrl: gscUrlInput,
        });
      }

      setIsConfigModalOpen(false);
      loadDashboard(days, true);
    } catch (err) {
      alert('Erro ao salvar configurações do Google.');
      console.error(err);
    } finally {
      setSavingConfig(false);
    }
  };

  // Filtros de busca para tabelas de SEO
  const filteredQueries = useMemo(() => {
    if (!data?.gsc?.queries) return [];
    if (!queryFilter) return data.gsc.queries;
    return data.gsc.queries.filter(q =>
      q.query.toLowerCase().includes(queryFilter.toLowerCase())
    );
  }, [data?.gsc?.queries, queryFilter]);

  const filteredPages = useMemo(() => {
    if (!data?.gsc?.pages) return [];
    if (!pageFilter) return data.gsc.pages;
    return data.gsc.pages.filter(p =>
      p.page.toLowerCase().includes(pageFilter.toLowerCase())
    );
  }, [data?.gsc?.pages, pageFilter]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const serviceEmail = data?.serviceAccount?.clientEmail || 'Conta de serviço não configurada';

  if (loading && !data) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[#B89455] border-r-transparent"></div>
        <p className="text-xs font-semibold text-[#625746]">Consultando Google Analytics 4 e Search Console...</p>
      </div>
    );
  }

  const ga4 = data?.ga4;
  const gsc = data?.gsc;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER DE CONTROLE */}
      <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#1E1A16] tracking-tight">Desempenho Digital & SEO</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4]">
              Google APIs
            </span>
          </div>
          <p className="text-xs text-[#625746] mt-0.5">
            Métricas sincronizadas via Google Cloud Service Account.
            {data?.cachedAt && (
              <span className="ml-1 text-[#847663]">
                (Cache: {new Date(data.cachedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          {/* Seletor de Período */}
          <div className="bg-[#EEE7DC] p-1 rounded-lg flex items-center gap-1 border border-[#D8CBB8]">
            {[
              { label: '7 dias', val: 7 },
              { label: '30 dias', val: 30 },
              { label: '90 dias', val: 90 },
            ].map(p => (
              <button
                key={p.val}
                onClick={() => setDays(p.val)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  days === p.val
                    ? 'bg-[#B89455] text-[#1D160B] shadow-2xs font-bold'
                    : 'text-[#625746] hover:text-[#1E1A16]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Botão de Atualizar Cache */}
          <button
            onClick={() => loadDashboard(days, true)}
            disabled={refreshing}
            className="h-8 px-3 rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] hover:bg-[#EEE7DC] text-[#1E1A16] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B89455] ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>

          {/* Botão de Configuração de IDs */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="h-8 px-3 rounded-lg border border-[#D8CBB8] bg-[#EEE7DC] hover:bg-[#E5D9C8] text-[#1E1A16] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-[#625746]" />
            Configurar IDs
          </button>
        </div>
      </div>

      {/* BANNER INFORMATIVO DA SERVICE ACCOUNT */}
      <div className="bg-[#FAF6F0] border border-[#E5D9C8] rounded-[11px] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4] flex items-center justify-center shrink-0 font-black text-sm">
            G
          </div>
          <div>
            <span className="font-bold text-[#1E1A16]">Conta de Serviço da Agência (Service Account):</span>
            <p className="text-[#625746] font-mono text-[11px] mt-0.5 select-all">{serviceEmail}</p>
          </div>
        </div>

        <button
          onClick={() => handleCopyEmail(serviceEmail)}
          className="px-3 py-1.5 bg-[#FFFDF8] hover:bg-[#EEE7DC] border border-[#D8CBB8] text-[#1E1A16] font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 shrink-0 text-xs"
        >
          {copiedEmail ? <Check className="w-3.5 h-3.5 text-[#247A4A]" /> : <Copy className="w-3.5 h-3.5 text-[#847663]" />}
          {copiedEmail ? 'E-mail Copiado!' : 'Copiar E-mail para Convidar'}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: GOOGLE ANALYTICS 4 (GA4) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8CBB8]/70 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4] flex items-center justify-center font-bold text-xs">
              GA4
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1A16]">Google Analytics 4</h3>
              <p className="text-[11px] text-[#625746]">Métricas de tráfego, audiência, engajamento e conversões</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {ga4?.configured && ga4?.success ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F4EA] text-[#247A4A] border border-[#CEEAD6]">
                Propriedade #{ga4.propertyId}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]">
                {ga4?.propertyId ? 'Não Conectado' : 'Não Configurado'}
              </span>
            )}
          </div>
        </div>

        {/* ALERTA CASO NÃO ESTEJA CONECTADO */}
        {(!ga4?.configured || !ga4?.success) && (
          <div className="bg-[#FAF6F0] border border-[#E5D9C8] rounded-[11px] p-5 text-[#1E1A16] space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#B89455] shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-[#1E1A16]">
                  {!ga4?.propertyId ? 'Propriedade GA4 não informada' : 'Permissão Pendente no GA4'}
                </h4>
                <p className="text-xs text-[#625746] leading-relaxed">
                  {ga4?.error ||
                    'Para visualizar os dados de tráfego, adicione o ID da propriedade do GA4 e convide o e-mail da Conta de Serviço.'}
                </p>
                <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg p-3 text-xs space-y-1 text-[#625746]">
                  <p className="font-bold text-[#1E1A16]">Passo a passo rápido:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Acesse o <strong>Google Analytics</strong> na conta da agência.</li>
                    <li>Vá em <strong>Administrador ➔ Gerenciamento de Acesso à Conta</strong>.</li>
                    <li>Adicione <code>{serviceEmail}</code> como <strong>Leitor (Viewer)</strong>.</li>
                    <li>Copie o <strong>ID da Propriedade</strong> e clique em <strong>Configurar IDs</strong> acima.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MÉTRICAS GA4 CONECTADAS */}
        {ga4?.success && ga4?.overview && (
          <>
            {/* CARDS KPIS GA4 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] transition-colors">
                <div className="flex items-center justify-between text-[#847663] mb-1.5">
                  <span className="text-[11px] font-semibold">Usuários Ativos</span>
                  <Users className="w-3.5 h-3.5 text-[#B89455]" />
                </div>
                <h4 className="text-xl font-bold text-[#1E1A16] tracking-tight">
                  {ga4.overview.activeUsers.toLocaleString('pt-BR')}
                </h4>
                <p className="text-[10px] text-[#847663] mt-0.5">Visitantes no período</p>
              </div>

              <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] transition-colors">
                <div className="flex items-center justify-between text-[#847663] mb-1.5">
                  <span className="text-[11px] font-semibold">Novos Usuários</span>
                  <UserPlus className="w-3.5 h-3.5 text-[#247A4A]" />
                </div>
                <h4 className="text-xl font-bold text-[#1E1A16] tracking-tight">
                  {ga4.overview.newUsers.toLocaleString('pt-BR')}
                </h4>
                <p className="text-[10px] text-[#847663] mt-0.5">Primeiro acesso</p>
              </div>

              <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] transition-colors">
                <div className="flex items-center justify-between text-[#847663] mb-1.5">
                  <span className="text-[11px] font-semibold">Sessões</span>
                  <Activity className="w-3.5 h-3.5 text-[#3b82f6]" />
                </div>
                <h4 className="text-xl font-bold text-[#1E1A16] tracking-tight">
                  {ga4.overview.sessions.toLocaleString('pt-BR')}
                </h4>
                <p className="text-[10px] text-[#847663] mt-0.5">Visitas registradas</p>
              </div>

              <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] transition-colors">
                <div className="flex items-center justify-between text-[#847663] mb-1.5">
                  <span className="text-[11px] font-semibold">Pageviews</span>
                  <Eye className="w-3.5 h-3.5 text-[#8A6828]" />
                </div>
                <h4 className="text-xl font-bold text-[#1E1A16] tracking-tight">
                  {ga4.overview.screenPageViews.toLocaleString('pt-BR')}
                </h4>
                <p className="text-[10px] text-[#847663] mt-0.5">Visualizações</p>
              </div>

              <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] transition-colors">
                <div className="flex items-center justify-between text-[#847663] mb-1.5">
                  <span className="text-[11px] font-semibold">Engajamento</span>
                  <Percent className="w-3.5 h-3.5 text-[#B89455]" />
                </div>
                <h4 className="text-xl font-bold text-[#1E1A16] tracking-tight">
                  {ga4.overview.engagementRate}%
                </h4>
                <p className="text-[10px] text-[#847663] mt-0.5">Taxa de interação</p>
              </div>

              <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] transition-colors">
                <div className="flex items-center justify-between text-[#847663] mb-1.5">
                  <span className="text-[11px] font-semibold">Tempo Médio</span>
                  <Clock className="w-3.5 h-3.5 text-[#625746]" />
                </div>
                <h4 className="text-lg font-bold text-[#1E1A16] tracking-tight mt-0.5">
                  {formatDuration(ga4.overview.averageSessionDuration)}
                </h4>
                <p className="text-[10px] text-[#847663] mt-0.5">Por sessão</p>
              </div>
            </div>

            {/* GRÁFICO TEMPORAL DE VISITAS DIÁRIAS */}
            {ga4.timeline && ga4.timeline.length > 0 && (
              <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#1E1A16] text-xs">Evolução Diária de Usuários e Sessões</h4>
                    <p className="text-[11px] text-[#625746]">Acessos ao site ao longo dos dias</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#B89455] inline-block"></span>
                      <span className="text-[#1E1A16]">Usuários</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] inline-block"></span>
                      <span className="text-[#625746]">Sessões</span>
                    </div>
                  </div>
                </div>

                {/* SVG Chart com Degradê Dourado Vivox */}
                <div className="h-52 w-full pt-3 relative">
                  {(() => {
                    const points = ga4.timeline;
                    const maxVal = Math.max(...points.map(p => Math.max(p.activeUsers, p.sessions)), 10);
                    const width = 1000;
                    const height = 170;
                    const padding = 20;

                    const getX = (index: number) => {
                      if (points.length <= 1) return width / 2;
                      return padding + (index / (points.length - 1)) * (width - 2 * padding);
                    };

                    const getY = (val: number) => {
                      return height - padding - (val / maxVal) * (height - 2 * padding);
                    };

                    const usersPath = points
                      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.activeUsers)}`)
                      .join(' ');

                    const sessionsPath = points
                      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.sessions)}`)
                      .join(' ');

                    const usersArea = `${usersPath} L ${getX(points.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

                    return (
                      <div className="w-full h-full relative">
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          className="w-full h-full overflow-visible"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="vivoxGoldGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#B89455" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#B89455" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          {[0, 0.33, 0.66, 1].map((pct, idx) => {
                            const y = height - padding - pct * (height - 2 * padding);
                            return (
                              <g key={idx}>
                                <line
                                  x1={padding}
                                  y1={y}
                                  x2={width - padding}
                                  y2={y}
                                  stroke="#EEE7DC"
                                  strokeWidth="1"
                                  strokeDasharray="4 4"
                                />
                                <text x={padding - 5} y={y + 3} textAnchor="end" fontSize="9" fill="#847663">
                                  {Math.round(pct * maxVal)}
                                </text>
                              </g>
                            );
                          })}

                          {/* Area & Lines */}
                          <path d={usersArea} fill="url(#vivoxGoldGradient)" />
                          <path d={sessionsPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 3" />
                          <path d={usersPath} fill="none" stroke="#B89455" strokeWidth="2.5" />

                          {/* Interactive Points */}
                          {points.map((p, i) => (
                            <g
                              key={i}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredPointIndex(i)}
                              onMouseLeave={() => setHoveredPointIndex(null)}
                            >
                              <circle
                                cx={getX(i)}
                                cy={getY(p.activeUsers)}
                                r={hoveredPointIndex === i ? 5.5 : 3}
                                fill="#B89455"
                                stroke="#FFFDF8"
                                strokeWidth="2"
                              />
                            </g>
                          ))}
                        </svg>

                        {/* Tooltip */}
                        {hoveredPointIndex !== null && points[hoveredPointIndex] && (
                          <div
                            className="absolute bg-[#181612] text-[#F6F0E7] text-xs rounded-lg p-2.5 shadow-xl pointer-events-none -translate-x-1/2 -translate-y-full mb-3 z-10 whitespace-nowrap border border-[#373126]"
                            style={{
                              left: `${(getX(hoveredPointIndex) / width) * 100}%`,
                              top: `${(getY(points[hoveredPointIndex].activeUsers) / height) * 100}%`,
                            }}
                          >
                            <p className="font-bold text-[#C7A15F] border-b border-[#373126] pb-1 mb-1">
                              {points[hoveredPointIndex].date}
                            </p>
                            <div className="space-y-0.5 text-[11px]">
                              <p className="flex justify-between gap-3 text-[#F6F0E7]">
                                <span>Usuários:</span>
                                <span className="font-bold text-[#C7A15F]">{points[hoveredPointIndex].activeUsers}</span>
                              </p>
                              <p className="flex justify-between gap-3 text-[#B9AEA0]">
                                <span>Sessões:</span>
                                <span className="font-bold">{points[hoveredPointIndex].sessions}</span>
                              </p>
                              <p className="flex justify-between gap-3 text-[#B9AEA0]">
                                <span>Pageviews:</span>
                                <span className="font-bold">{points[hoveredPointIndex].screenPageViews}</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* GRID DE DETALHES: CANAIS, DISPOSITIVOS, CIDADES E CONVERSÕES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Canais */}
              <div className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Globe className="w-3.5 h-3.5 text-[#B89455]" />
                    <h4 className="font-bold text-[#1E1A16] text-xs">Origens de Tráfego</h4>
                  </div>
                  <div className="space-y-2.5">
                    {(ga4.trafficSources || []).slice(0, 5).map((source, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-[#1E1A16] truncate max-w-[140px]">{source.sourceMedium}</span>
                          <span className="text-[#625746] font-mono text-[11px]">{source.percentage}%</span>
                        </div>
                        <div className="w-full bg-[#EEE7DC] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#B89455] h-1.5 rounded-full"
                            style={{ width: `${Math.min(source.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dispositivos */}
              <div className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#B89455]" />
                    <h4 className="font-bold text-[#1E1A16] text-xs">Dispositivos</h4>
                  </div>
                  <div className="space-y-2">
                    {(ga4.devices || []).map((dev, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E5D9C8]">
                        <div className="flex items-center gap-2">
                          {dev.device.toLowerCase() === 'mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-[#247A4A]" />
                          ) : dev.device.toLowerCase() === 'desktop' ? (
                            <Monitor className="w-3.5 h-3.5 text-[#B89455]" />
                          ) : (
                            <Tablet className="w-3.5 h-3.5 text-[#8A6828]" />
                          )}
                          <span className="text-xs font-semibold text-[#1E1A16] capitalize">{dev.device}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#1E1A16]">{dev.percentage}%</span>
                          <p className="text-[9px] text-[#847663]">{dev.activeUsers} visitas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Cidades */}
              <div className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <MapPin className="w-3.5 h-3.5 text-[#B89455]" />
                    <h4 className="font-bold text-[#1E1A16] text-xs">Top Localização</h4>
                  </div>
                  <div className="space-y-2">
                    {(ga4.cities || []).slice(0, 5).map((city, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#EEE7DC] last:border-0">
                        <span className="text-[#1E1A16] font-medium truncate max-w-[130px]">{city.city}</span>
                        <span className="text-[#625746] font-semibold">{city.activeUsers} visitas</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Eventos Chave */}
              <div className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Flame className="w-3.5 h-3.5 text-[#B89455]" />
                    <h4 className="font-bold text-[#1E1A16] text-xs">Eventos Registrados</h4>
                  </div>
                  <div className="space-y-1.5">
                    {(ga4.events || []).slice(0, 5).map((ev, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#EEE7DC] last:border-0">
                        <span className="text-[#1E1A16] font-mono text-[11px] truncate max-w-[130px]">{ev.eventName}</span>
                        <span className="font-bold text-[#8A6828] bg-[#FAF2E4] border border-[#E8D4B4] px-1.5 py-0.5 rounded text-[10px]">
                          {ev.eventCount.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 2: GOOGLE SEARCH CONSOLE (GSC) */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-6 border-t border-[#D8CBB8]/70">
        <div className="flex items-center justify-between border-b border-[#D8CBB8]/70 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4] flex items-center justify-center font-bold text-xs">
              <Search className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1A16]">Google Search Console</h3>
              <p className="text-[11px] text-[#625746]">Desempenho orgânico no buscador do Google e termos ranqueados</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {gsc?.configured && gsc?.success ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F4EA] text-[#247A4A] border border-[#CEEAD6] truncate max-w-xs">
                {gsc.siteUrl}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]">
                {gsc?.siteUrl ? 'Não Conectado' : 'Não Configurado'}
              </span>
            )}
          </div>
        </div>

        {/* ALERTA CASO NÃO ESTEJA CONECTADO NO SEARCH CONSOLE */}
        {(!gsc?.configured || !gsc?.success) && (
          <div className="bg-[#FAF6F0] border border-[#E5D9C8] rounded-[11px] p-5 text-[#1E1A16] space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#B89455] shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-[#1E1A16]">
                  {!gsc?.siteUrl ? 'Site URL do Search Console não informado' : 'Permissão Pendente no Search Console'}
                </h4>
                <p className="text-xs text-[#625746] leading-relaxed">
                  {gsc?.error ||
                    'Para visualizar os cliques orgânicos e termos de busca, configure a URL do site e adicione a Conta de Serviço.'}
                </p>
                <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg p-3 text-xs space-y-1 text-[#625746]">
                  <p className="font-bold text-[#1E1A16]">Passo a passo rápido:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Acesse o <strong>Google Search Console</strong>.</li>
                    <li>Vá em <strong>Configurações ➔ Usuários e permissões</strong>.</li>
                    <li>Adicione <code>{serviceEmail}</code> como <strong>Usuário (Leitura/Total)</strong>.</li>
                    <li>Copie o formato da URL (ex: <code>https://www.site.com.br/</code>) e clique em <strong>Configurar IDs</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MÉTRICAS SEARCH CONSOLE CONECTADAS */}
        {gsc?.success && gsc?.overview && (
          <>
            {/* CARDS KPIS GSC */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] transition-colors">
                <div className="flex items-center justify-between text-[#847663] mb-1.5">
                  <span className="text-[11px] font-semibold">Total de Cliques</span>
                  <MousePointerClick className="w-3.5 h-3.5 text-[#3b82f6]" />
                </div>
                <h4 className="text-xl font-bold text-[#1E1A16] tracking-tight">
                  {gsc.overview.totalClicks.toLocaleString('pt-BR')}
                </h4>
                <p className="text-[10px] text-[#847663] mt-0.5">Visitantes do Google</p>
              </div>

              <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] transition-colors">
                <div className="flex items-center justify-between text-[#847663] mb-1.5">
                  <span className="text-[11px] font-semibold">Total de Impressões</span>
                  <Search className="w-3.5 h-3.5 text-[#B89455]" />
                </div>
                <h4 className="text-xl font-bold text-[#1E1A16] tracking-tight">
                  {gsc.overview.totalImpressions.toLocaleString('pt-BR')}
                </h4>
                <p className="text-[10px] text-[#847663] mt-0.5">Exibições na busca</p>
              </div>

              <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] transition-colors">
                <div className="flex items-center justify-between text-[#847663] mb-1.5">
                  <span className="text-[11px] font-semibold">CTR Médio</span>
                  <Percent className="w-3.5 h-3.5 text-[#247A4A]" />
                </div>
                <h4 className="text-xl font-bold text-[#1E1A16] tracking-tight">
                  {gsc.overview.averageCtr}%
                </h4>
                <p className="text-[10px] text-[#847663] mt-0.5">Taxa de clique</p>
              </div>

              <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] transition-colors">
                <div className="flex items-center justify-between text-[#847663] mb-1.5">
                  <span className="text-[11px] font-semibold">Posição Média</span>
                  <Award className="w-3.5 h-3.5 text-[#8A6828]" />
                </div>
                <h4 className="text-xl font-bold text-[#1E1A16] tracking-tight">
                  {gsc.overview.averagePosition > 0 ? `#${gsc.overview.averagePosition}` : '-'}
                </h4>
                <p className="text-[10px] text-[#847663] mt-0.5">Ranking no Google</p>
              </div>
            </div>

            {/* TABELAS DE SEO: PALAVRAS-CHAVE E PÁGINAS MAIS ACESSADAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Palavras-Chave */}
              <div className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-[#1E1A16] text-xs">Top Termos Pesquisados (SEO)</h4>
                    <p className="text-[11px] text-[#625746]">Palavras digitadas no Google</p>
                  </div>
                  <div className="w-full sm:w-40">
                    <input
                      placeholder="Filtrar termo..."
                      value={queryFilter}
                      onChange={e => setQueryFilter(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-[#FAF7F2] border border-[#D8CBB8] rounded-md text-[#1E1A16] outline-none focus:border-[#B89455]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#EEE7DC] text-[#625746] border-b border-[#D8CBB8]">
                      <tr>
                        <th className="py-2 px-2.5 font-bold">Palavra-chave</th>
                        <th className="py-2 px-2 text-right font-bold">Cliques</th>
                        <th className="py-2 px-2 text-right font-bold">Impr.</th>
                        <th className="py-2 px-2 text-right font-bold">CTR</th>
                        <th className="py-2 px-2.5 text-right font-bold">Posição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEE7DC]">
                      {filteredQueries.map((q, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="py-1.5 px-2.5 font-medium text-[#1E1A16] truncate max-w-[170px]">
                            {q.query}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-[#B89455]">{q.clicks}</td>
                          <td className="py-1.5 px-2 text-right text-[#625746]">{q.impressions}</td>
                          <td className="py-1.5 px-2 text-right text-[#847663]">{q.ctr}%</td>
                          <td className="py-1.5 px-2.5 text-right">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                q.position <= 3
                                  ? 'bg-[#E6F4EA] text-[#247A4A]'
                                  : q.position <= 10
                                  ? 'bg-[#FAF2E4] text-[#8A6828]'
                                  : 'bg-[#EEE7DC] text-[#625746]'
                              }`}
                            >
                              #{q.position}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredQueries.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-5 text-center text-[#847663] italic">
                            Nenhum termo encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Páginas */}
              <div className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-[#1E1A16] text-xs">Páginas Mais Acessadas</h4>
                    <p className="text-[11px] text-[#625746]">URLs de melhor ranking orgânico</p>
                  </div>
                  <div className="w-full sm:w-40">
                    <input
                      placeholder="Filtrar URL..."
                      value={pageFilter}
                      onChange={e => setPageFilter(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-[#FAF7F2] border border-[#D8CBB8] rounded-md text-[#1E1A16] outline-none focus:border-[#B89455]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#EEE7DC] text-[#625746] border-b border-[#D8CBB8]">
                      <tr>
                        <th className="py-2 px-2.5 font-bold">Página</th>
                        <th className="py-2 px-2 text-right font-bold">Cliques</th>
                        <th className="py-2 px-2 text-right font-bold">Impr.</th>
                        <th className="py-2 px-2.5 text-right font-bold">Posição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEE7DC]">
                      {filteredPages.map((p, idx) => {
                        const cleanPath = p.page.replace(/^https?:\/\/[^/]+/, '') || '/';
                        return (
                          <tr key={idx} className="hover:bg-[#FAF7F2] transition-colors">
                            <td className="py-1.5 px-2.5 font-medium text-[#1E1A16] truncate max-w-[190px]" title={p.page}>
                              <span className="font-mono text-[11px] text-[#B89455]">{cleanPath}</span>
                            </td>
                            <td className="py-1.5 px-2 text-right font-bold text-[#B89455]">{p.clicks}</td>
                            <td className="py-1.5 px-2 text-right text-[#625746]">{p.impressions}</td>
                            <td className="py-1.5 px-2.5 text-right">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  p.position <= 3
                                    ? 'bg-[#E6F4EA] text-[#247A4A]'
                                    : p.position <= 10
                                    ? 'bg-[#FAF2E4] text-[#8A6828]'
                                    : 'bg-[#EEE7DC] text-[#625746]'
                                }`}
                              >
                                #{p.position}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredPages.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-5 text-center text-[#847663] italic">
                            Nenhuma página encontrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL PARA CONFIGURAR OS IDS DO CLIENTE */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configurar Google Analytics & Search Console"
      >
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <p className="text-xs text-[#625746]">
            Informe os identificadores do cliente no Google para sincronizar as métricas automaticamente.
          </p>

          <div>
            <Input
              label="ID da Propriedade GA4"
              placeholder="Ex: 481928472"
              value={ga4IdInput}
              onChange={e => setGa4IdInput(e.target.value)}
            />
            <p className="text-[11px] text-[#847663] mt-1">
              Encontrado no GA4 em <strong>Administrador ➔ Detalhes da Propriedade</strong>.
            </p>
          </div>

          <div>
            <Input
              label="Site URL no Search Console"
              placeholder="Ex: https://www.cliente.com.br/ ou sc-domain:cliente.com.br"
              value={gscUrlInput}
              onChange={e => setGscUrlInput(e.target.value)}
            />
            <p className="text-[11px] text-[#847663] mt-1">
              URL ou Domínio cadastrado no Search Console (com https:// e barra final se for prefixo de URL).
            </p>
          </div>

          <div className="bg-[#FAF6F0] border border-[#E5D9C8] rounded-lg p-3 text-xs space-y-1 text-[#625746]">
            <span className="font-bold text-[#1E1A16]">Lembrete de Permissão:</span>
            <p>
              Certifique-se de que a Conta de Serviço (<code>{serviceEmail}</code>) foi adicionada como Leitor na conta do GA4 e no Search Console.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-[#D8CBB8] text-xs font-semibold text-[#625746] hover:bg-[#EEE7DC] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingConfig}
              className="px-4 py-1.5 rounded-lg bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] text-xs font-bold shadow-xs transition-colors"
            >
              {savingConfig ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
