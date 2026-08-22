import { useState, useEffect, useMemo } from 'react';
import type { Cliente, OpenPanelDashboardResult } from '../../types';
import { api } from '../../api/client';
import {
  Globe,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  Radio,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Settings,
  Eye,
  Activity,
  Users,
  Layers,
  Clock,
  AlertCircle,
  X,
  MessageCircle,
  TrendingUp,
  Sparkles,
  Search,
  ExternalLink,
  Target,
  Cpu,
  Compass,
  ArrowUpRight,
  Share2,
} from 'lucide-react';

interface Props {
  cliente: Cliente;
  onClienteUpdated?: (updated: Partial<Cliente>) => void;
}

type MetricaGrafico = 'visualizacoes' | 'visitantes' | 'sessoes';
type AbaTrafego = 'canais' | 'campanhas' | 'tecnologia' | 'localizacao';

export function ClientPerformanceDashboard({ cliente, onClienteUpdated }: Props) {
  const [periodo, setPeriodo] = useState<string>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshRealtime, setAutoRefreshRealtime] = useState(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toLocaleTimeString('pt-BR'));
  const [openpanelData, setOpenpanelData] = useState<OpenPanelDashboardResult | null>(null);

  // Controles de Visualização Interativa
  const [metricaGrafico, setMetricaGrafico] = useState<MetricaGrafico>('visualizacoes');
  const [abaTrafego, setAbaTrafego] = useState<AbaTrafego>('canais');
  const [termoBuscaPagina, setTermoBuscaPagina] = useState<string>('');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Modal de Configuração do Projeto OpenPanel
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [projectIdInput, setProjectIdInput] = useState(cliente.openpanelProjectId || '');
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  const loadMetrics = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get(
        `/analytics/openpanel/${cliente.id}?range=${periodo}${forceRefresh ? '&refresh=true' : ''}`
      );
      setOpenpanelData(res.data);
      setLastUpdatedTime(new Date().toLocaleTimeString('pt-BR'));
    } catch (err) {
      console.warn('OpenPanel não disponível ou offline, usando fallback:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setProjectIdInput(cliente.openpanelProjectId || '');
    setClientIdInput('');
    setClientSecretInput('');
    loadMetrics(false);
  }, [cliente.id, periodo]);

  // Polling automático a cada 15 segundos
  useEffect(() => {
    if (!autoRefreshRealtime) return;

    const interval = setInterval(() => {
      loadMetrics(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefreshRealtime, cliente.id, periodo]);

  const handleRefresh = () => {
    loadMetrics(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const payload: Record<string, string> = {
        openpanelProjectId: projectIdInput.trim(),
      };
      if (clientIdInput.trim()) payload.openpanelClientId = clientIdInput.trim();
      if (clientSecretInput.trim()) payload.openpanelClientSecret = clientSecretInput.trim();

      await api.patch(`/analytics/openpanel/${cliente.id}`, payload);

      if (onClienteUpdated) {
        onClienteUpdated({ openpanelProjectId: projectIdInput.trim() });
      }

      setClientIdInput('');
      setClientSecretInput('');
      setIsConfigOpen(false);
      loadMetrics(true);
    } catch (err) {
      console.error('Erro ao salvar configuração do OpenPanel:', err);
      alert('Erro ao salvar configuração do OpenPanel.');
    } finally {
      setSavingConfig(false);
    }
  };

  const op = openpanelData?.openpanel;
  const isRealData = Boolean(op?.success && op?.overview);

  // Formata segundos em HH:MM:SS
  const formatSeconds = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hrs = Math.floor(mins / 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins % 60)}:${pad(secs)}`;
  };

  // Métricas Principais
  const metricas = useMemo(() => {
    if (isRealData && op?.overview) {
      const ov = op.overview;
      const whatsappCount = op?.whatsappClicksCount ?? 0;
      const taxaConversaoWhats = ov.uniqueVisitors > 0 
        ? Math.round((whatsappCount / ov.uniqueVisitors) * 1000) / 10 
        : 0;

      return {
        visualizacoes: ov.totalScreenViews,
        sessoes: ov.totalSessions,
        usuarios: ov.uniqueVisitors,
        paginasPorSessao: ov.viewsPerSession,
        duracaoMedia: formatSeconds(ov.avgSessionDuration),
        taxaRejeicao: ov.bounceRate,
        whatsappCliques: whatsappCount,
        taxaConversaoWhats,
      };
    }

    return {
      visualizacoes: 3451,
      sessoes: 2573,
      usuarios: 2318,
      paginasPorSessao: 1.34,
      duracaoMedia: '00:01:14',
      taxaRejeicao: 63.8,
      whatsappCliques: 128,
      taxaConversaoWhats: 5.5,
    };
  }, [op, isRealData]);

  // Timeline Diária de Acessos
  const timelineData = useMemo(() => {
    if (isRealData && op?.timeline && op.timeline.length > 0) {
      return op.timeline.map((point) => {
        const parts = point.date.split('-');
        let diaFormatado = point.date;
        let dataCompleta = point.date;
        if (parts.length === 3) {
          const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
          const mesNum = parseInt(parts[1], 10) - 1;
          diaFormatado = `${parts[2]}/${meses[mesNum] || parts[1]}`;
          dataCompleta = `${parts[2]} de ${meses[mesNum] || parts[1]} de ${parts[0]}`;
        }
        return {
          dia: diaFormatado,
          dataCompleta,
          rawDate: point.date,
          visualizacoes: point.totalScreenViews || 0,
          visitantes: point.uniqueVisitors || 0,
          sessoes: point.totalSessions || 0,
        };
      });
    }

    // Mock realista de 16 pontos no período
    const mockDias = [
      { dia: '01/ago', date: '2026-08-01', v: 82, u: 64, s: 71 },
      { dia: '03/ago', date: '2026-08-03', v: 102, u: 85, s: 92 },
      { dia: '05/ago', date: '2026-08-05', v: 45, u: 38, s: 41 },
      { dia: '07/ago', date: '2026-08-07', v: 189, u: 142, s: 160 },
      { dia: '09/ago', date: '2026-08-09', v: 97, u: 79, s: 88 },
      { dia: '11/ago', date: '2026-08-11', v: 21, u: 18, s: 19 },
      { dia: '13/ago', date: '2026-08-13', v: 18, u: 15, s: 16 },
      { dia: '15/ago', date: '2026-08-15', v: 209, u: 168, s: 185 },
      { dia: '17/ago', date: '2026-08-17', v: 195, u: 155, s: 172 },
      { dia: '19/ago', date: '2026-08-19', v: 68, u: 54, s: 60 },
      { dia: '21/ago', date: '2026-08-21', v: 55, u: 44, s: 49 },
      { dia: '23/ago', date: '2026-08-23', v: 336, u: 260, s: 295 },
      { dia: '25/ago', date: '2026-08-25', v: 86, u: 70, s: 78 },
      { dia: '27/ago', date: '2026-08-27', v: 24, u: 20, s: 22 },
      { dia: '29/ago', date: '2026-08-29', v: 295, u: 232, s: 261 },
      { dia: '31/ago', date: '2026-08-31', v: 60, u: 48, s: 53 },
    ];

    return mockDias.map((d) => ({
      dia: d.dia,
      dataCompleta: `${d.dia} de 2026`,
      rawDate: d.date,
      visualizacoes: d.v,
      visitantes: d.u,
      sessoes: d.s,
    }));
  }, [op, isRealData]);

  // Valor atual para a métrica selecionada no gráfico
  const getValorMetrica = (ponto: (typeof timelineData)[0]) => {
    if (metricaGrafico === 'visitantes') return ponto.visitantes;
    if (metricaGrafico === 'sessoes') return ponto.sessoes;
    return ponto.visualizacoes;
  };

  const valoresAtuais = timelineData.map(getValorMetrica);
  const maxValorGrafico = Math.max(...valoresAtuais, 1);
  const mediaDiaria = Math.round(
    valoresAtuais.reduce((acc, curr) => acc + curr, 0) / Math.max(valoresAtuais.length, 1)
  );

  // Paleta de Cores Vivox Dourada & Neutra
  const coresCanais = ['#B89455', '#8A6828', '#D8CBB8', '#4A4032', '#247A4A', '#5C4418', '#625746'];

  // Canais de Origem / Referrers
  const canaisOrigem = useMemo(() => {
    if (isRealData && op?.referrers && op.referrers.length > 0) {
      return op.referrers.slice(0, 6).map((r, idx) => ({
        nome: r.name,
        porcentagem: r.percentage,
        cor: coresCanais[idx % coresCanais.length],
        sessoes: r.sessions,
        pageviews: r.pageviews,
      }));
    }

    return [
      { nome: '(direto / links salvos)', porcentagem: 40.2, cor: '#B89455', sessoes: 1034, pageviews: 1386 },
      { nome: 'Google Orgânico', porcentagem: 32.5, cor: '#8A6828', sessoes: 836, pageviews: 1120 },
      { nome: 'Instagram (Stories & Bio)', porcentagem: 17.6, cor: '#D8CBB8', sessoes: 452, pageviews: 605 },
      { nome: 'Meta Ads (Tráfego Pago)', porcentagem: 6.8, cor: '#4A4032', sessoes: 175, pageviews: 235 },
      { nome: 'WhatsApp Links', porcentagem: 2.9, cor: '#247A4A', sessoes: 76, pageviews: 105 },
    ];
  }, [op, isRealData]);

  // Campanhas UTM
  const utmSources = useMemo(() => {
    if (isRealData && op?.utmSources && op.utmSources.length > 0) {
      return op.utmSources;
    }
    return [
      { name: 'instagram_ads', sessions: 210, pageviews: 280, percentage: 54.0 },
      { name: 'google_cpc', sessions: 115, pageviews: 160, percentage: 29.5 },
      { name: 'link_bio', sessions: 64, pageviews: 85, percentage: 16.5 },
    ];
  }, [op, isRealData]);

  const utmMediums = useMemo(() => {
    if (isRealData && op?.utmMediums && op.utmMediums.length > 0) {
      return op.utmMediums;
    }
    return [
      { name: 'cpc / patrocinado', sessions: 280, pageviews: 380, percentage: 72.0 },
      { name: 'social_bio', sessions: 75, pageviews: 98, percentage: 19.3 },
      { name: 'newsletter', sessions: 34, pageviews: 45, percentage: 8.7 },
    ];
  }, [op, isRealData]);

  const utmCampaigns = useMemo(() => {
    if (isRealData && op?.utmCampaigns && op.utmCampaigns.length > 0) {
      return op.utmCampaigns;
    }
    return [
      { name: 'campanha_institucional_2026', sessions: 195, pageviews: 260, percentage: 50.1 },
      { name: 'captacao_leads_promo', sessions: 130, pageviews: 180, percentage: 33.4 },
      { name: 'remarketing_whatsapp', sessions: 64, pageviews: 83, percentage: 16.5 },
    ];
  }, [op, isRealData]);

  // Dispositivos
  const dispositivos = useMemo(() => {
    if (isRealData && op?.devices && op.devices.length > 0) {
      return op.devices;
    }
    return [
      { name: 'mobile', sessions: 1860, pageviews: 2480, percentage: 72.3 },
      { name: 'desktop', sessions: 620, pageviews: 840, percentage: 24.1 },
      { name: 'tablet', sessions: 93, pageviews: 131, percentage: 3.6 },
    ];
  }, [op, isRealData]);

  // Navegadores
  const navegadores = useMemo(() => {
    if (isRealData && op?.browsers && op.browsers.length > 0) {
      return op.browsers.slice(0, 5);
    }
    return [
      { name: 'Chrome', sessions: 1420, pageviews: 1900, percentage: 55.2 },
      { name: 'Safari', sessions: 850, pageviews: 1140, percentage: 33.0 },
      { name: 'Edge', sessions: 180, pageviews: 240, percentage: 7.0 },
      { name: 'Firefox', sessions: 80, pageviews: 110, percentage: 3.1 },
      { name: 'Opera', sessions: 43, pageviews: 61, percentage: 1.7 },
    ];
  }, [op, isRealData]);

  // Sistemas Operacionais
  const sistemasOperacionais = useMemo(() => {
    if (isRealData && op?.os && op.os.length > 0) {
      return op.os.slice(0, 5);
    }
    return [
      { name: 'iOS (iPhone)', sessions: 1350, pageviews: 1810, percentage: 52.5 },
      { name: 'Android', sessions: 600, pageviews: 800, percentage: 23.3 },
      { name: 'Windows', sessions: 450, pageviews: 610, percentage: 17.5 },
      { name: 'macOS', sessions: 150, pageviews: 200, percentage: 5.8 },
      { name: 'Linux', sessions: 23, pageviews: 31, percentage: 0.9 },
    ];
  }, [op, isRealData]);

  // Top Países
  const paisesTop = useMemo(() => {
    if (isRealData && op?.countries && op.countries.length > 0) {
      return op.countries.slice(0, 6);
    }
    return [
      { name: 'Brasil (BR)', sessions: 2420, pageviews: 3250, percentage: 94.1 },
      { name: 'Estados Unidos (US)', sessions: 98, pageviews: 125, percentage: 3.8 },
      { name: 'Portugal (PT)', sessions: 35, pageviews: 48, percentage: 1.4 },
      { name: 'Outros', sessions: 20, pageviews: 28, percentage: 0.7 },
    ];
  }, [op, isRealData]);

  // Cliques no WhatsApp
  const whatsappClicks = isRealData ? op?.whatsappClicks || [] : [];
  const whatsappClicksCount = isRealData ? op?.whatsappClicksCount ?? 0 : metricas.whatsappCliques;

  const formatRelativeTime = (isoDate: string) => {
    if (!isoDate) return '';
    const data = new Date(isoDate.replace(' ', 'T') + (isoDate.includes('Z') ? '' : 'Z'));
    if (isNaN(data.getTime())) return '';
    const diffMs = Date.now() - data.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `há ${diffH}h`;
    return `há ${Math.floor(diffH / 24)}d`;
  };

  // Páginas Acessadas com Busca e Identificação de Tipo
  const paginasAcessadas = useMemo(() => {
    let list: Array<{ caminho: string; visualizacoes: number; sessoes: number; tipo: string; badgeCor: string }> = [];

    if (isRealData && op?.pages && op.pages.length > 0) {
      list = op.pages.map((p) => {
        const path = p.path.toLowerCase();
        let tipo = 'Institucional';
        let badgeCor = 'bg-[#4A4032]/10 text-[#4A4032] border-[#4A4032]/30';

        if (path === '/' || path === '') {
          tipo = 'Página Inicial';
          badgeCor = 'bg-[#B89455]/15 text-[#8A6828] border-[#B89455]/40';
        } else if (path.includes('lp') || path.includes('landing') || path.includes('oferta') || path.includes('plano') || path.includes('consulta')) {
          tipo = 'Landing Page';
          badgeCor = 'bg-[#247A4A]/15 text-[#247A4A] border-[#247A4A]/40 font-bold';
        } else if (path.includes('bio') || path.includes('link') || path.includes('instagram')) {
          tipo = 'Link da Bio';
          badgeCor = 'bg-[#8A6828]/15 text-[#8A6828] border-[#8A6828]/40';
        } else if (path.includes('blog') || path.includes('artigo') || path.includes('noticia')) {
          tipo = 'Blog / Artigo';
          badgeCor = 'bg-[#3B82F6]/15 text-[#2563EB] border-[#3B82F6]/30';
        }

        return {
          caminho: p.path,
          visualizacoes: p.pageviews,
          sessoes: p.sessions,
          tipo,
          badgeCor,
        };
      });
    } else {
      list = [
        { caminho: '/', visualizacoes: 1420, sessoes: 1100, tipo: 'Página Inicial', badgeCor: 'bg-[#B89455]/15 text-[#8A6828] border-[#B89455]/40' },
        { caminho: '/lp-consulta-avancada', visualizacoes: 1250, sessoes: 920, tipo: 'Landing Page', badgeCor: 'bg-[#247A4A]/15 text-[#247A4A] border-[#247A4A]/40 font-bold' },
        { caminho: '/links-bio', visualizacoes: 480, sessoes: 340, tipo: 'Link da Bio', badgeCor: 'bg-[#8A6828]/15 text-[#8A6828] border-[#8A6828]/40' },
        { caminho: '/sobre-nos', visualizacoes: 180, sessoes: 130, tipo: 'Institucional', badgeCor: 'bg-[#4A4032]/10 text-[#4A4032] border-[#4A4032]/30' },
        { caminho: '/blog/novidades-2026', visualizacoes: 121, sessoes: 83, tipo: 'Blog / Artigo', badgeCor: 'bg-[#3B82F6]/15 text-[#2563EB] border-[#3B82F6]/30' },
      ];
    }

    if (!termoBuscaPagina.trim()) return list;

    return list.filter((item) =>
      item.caminho.toLowerCase().includes(termoBuscaPagina.toLowerCase()) ||
      item.tipo.toLowerCase().includes(termoBuscaPagina.toLowerCase())
    );
  }, [op, isRealData, termoBuscaPagina]);

  const maxPaginaVisualizacoes = useMemo(() => {
    return Math.max(...paginasAcessadas.map((p) => p.visualizacoes), 1);
  }, [paginasAcessadas]);

  // Ícone por tipo de dispositivo
  const deviceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('mobile') || n.includes('phone')) return <Smartphone className="w-3.5 h-3.5 text-[#247A4A]" />;
    if (n.includes('tablet') || n.includes('ipad')) return <Tablet className="w-3.5 h-3.5 text-[#8A6828]" />;
    return <Monitor className="w-3.5 h-3.5 text-[#B89455]" />;
  };

  // Insights Rápidos Automáticos
  const topCanalNome = canaisOrigem[0]?.nome || 'Direto';
  const topCanalPct = canaisOrigem[0]?.porcentagem || 0;
  const mobilePct = dispositivos.find((d) => d.name.toLowerCase().includes('mobile'))?.percentage || 70;

  return (
    <div className="space-y-6 w-full">
      {/* CABEÇALHO PRINCIPAL VIVOX LUXURY (STICKY) */}
      <div className="sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14120E]/95 backdrop-blur-md text-[#F6F0E7] p-4 sm:p-5 rounded-[11px] border border-[#2B261F] shadow-lg">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C7A15F] animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C7A15F]">
              Tráfego & Landing Pages • {cliente.nomeFantasia}
            </span>
            {isRealData ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#247A4A]/25 text-[#4ADE80] border border-[#247A4A]/50 shadow-xs">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Dados Reais OpenPanel · {op?.projectId}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#C7A15F]/20 text-[#C7A15F] border border-[#C7A15F]/35">
                Modo Demonstrativo
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#FAF7F2] mt-1 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#C7A15F]" />
            VISITANTES SITE & LANDING PAGES
          </h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[#24201A] border border-[#4A4032] text-xs font-semibold text-[#C7A15F] focus:outline-none focus:border-[#C7A15F] cursor-pointer shadow-inner"
          >
            <option value="7d">🗓️ Últimos 7 dias</option>
            <option value="30d">🗓️ Últimos 30 dias</option>
            <option value="90d">🗓️ Últimos 90 dias</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="h-9 px-3 rounded-lg border border-[#4A4032] bg-[#24201A] hover:bg-[#2F2A22] text-[#F6F0E7] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sincronizar dados mais recentes"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C7A15F] ${refreshing || loading ? 'animate-spin' : ''}`} />
            {refreshing ? 'Sincronizando...' : 'Atualizar'}
          </button>

          <button
            onClick={() => setIsConfigOpen(true)}
            className="h-9 px-3 rounded-lg border border-[#4A4032] bg-[#24201A] hover:bg-[#2F2A22] text-[#C7A15F] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configurar Projeto e Credenciais do OpenPanel"
          >
            <Settings className="w-3.5 h-3.5 text-[#C7A15F]" />
            <span className="hidden sm:inline">Configurar OpenPanel</span>
          </button>
        </div>
      </div>

      {/* MINI-PAINEL DE INSIGHTS AUTOMÁTICOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#FFFDF8] border border-[#D8CBB8] p-3.5 rounded-[11px] shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#B89455]/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#8A6828]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#847663] uppercase tracking-wider">Origem Principal</p>
            <p className="text-xs font-bold text-[#1E1A16] truncate">
              {topCanalNome} ({topCanalPct}%)
            </p>
          </div>
        </div>

        <div className="bg-[#FFFDF8] border border-[#D8CBB8] p-3.5 rounded-[11px] shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#247A4A]/15 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-[#247A4A]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#847663] uppercase tracking-wider">Mobile Share</p>
            <p className="text-xs font-bold text-[#1E1A16] truncate">
              {mobilePct}% dos acessos via celular
            </p>
          </div>
        </div>

        <div className="bg-[#FFFDF8] border border-[#D8CBB8] p-3.5 rounded-[11px] shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#22C55E]/15 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#847663] uppercase tracking-wider">Taxa Conv. WhatsApp</p>
            <p className="text-xs font-bold text-[#16A34A] truncate">
              {metricas.taxaConversaoWhats}% ({metricas.whatsappCliques} leads)
            </p>
          </div>
        </div>

        <div className="bg-[#FFFDF8] border border-[#D8CBB8] p-3.5 rounded-[11px] shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#8A6828]/15 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-[#8A6828]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#847663] uppercase tracking-wider">Média de Tráfego</p>
            <p className="text-xs font-bold text-[#1E1A16] truncate">
              ~{mediaDiaria} visitas por dia
            </p>
          </div>
        </div>
      </div>

      {/* CARD: VISITANTES ATIVOS AGORA (TEMPO REAL) */}
      <div className="bg-[#FFFDF8] border border-[#D8CBB8] text-[#1E1A16] p-5 sm:p-6 rounded-[11px] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEE7DC] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${(op?.liveVisitors || 0) > 0 ? 'bg-[#22C55E]' : 'bg-[#B89455]'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${(op?.liveVisitors || 0) > 0 ? 'bg-[#22C55E]' : 'bg-[#B89455]'}`}></span>
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1A16] flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${(op?.liveVisitors || 0) > 0 ? 'text-[#22C55E]' : 'text-[#8A6828]'}`} />
                Visitantes Ativos Agora no Site / Landing Pages
              </h3>
              <span className="text-[10px] text-[#847663] font-mono">Última checagem: {lastUpdatedTime}</span>
            </div>
          </div>

          <button
            onClick={() => setAutoRefreshRealtime(!autoRefreshRealtime)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
              autoRefreshRealtime
                ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#16A34A]'
                : 'bg-[#FAF7F2] border-[#D8CBB8] text-[#847663]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshRealtime ? 'bg-[#22C55E] animate-pulse' : 'bg-[#847663]'}`} />
            {autoRefreshRealtime ? 'Auto-Sync 15s Ativo' : 'Auto-Sync Pausado'}
          </button>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-6xl font-light text-[#1E1A16] font-mono tracking-tight">
            {op?.liveVisitors ?? 0}
          </span>
          <span className="text-xs text-[#847663] font-medium">
            usuários com sessões abertas neste instante
          </span>
        </div>
      </div>

      {/* LINHA 1: KPIS PRINCIPAIS (COM CONVERSÃO DE WHATSAPP) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#847663] mb-1">
            <span className="text-[11px] font-semibold">Visualizações</span>
            <Eye className="w-3.5 h-3.5 text-[#8A6828]" />
          </div>
          <h3 className="text-xl font-black text-[#1E1A16]">{metricas.visualizacoes.toLocaleString('pt-BR')}</h3>
        </div>

        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#847663] mb-1">
            <span className="text-[11px] font-semibold">Sessões</span>
            <Activity className="w-3.5 h-3.5 text-[#3b82f6]" />
          </div>
          <h3 className="text-xl font-black text-[#1E1A16]">{metricas.sessoes.toLocaleString('pt-BR')}</h3>
        </div>

        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#847663] mb-1">
            <span className="text-[11px] font-semibold">Visitantes Únicos</span>
            <Users className="w-3.5 h-3.5 text-[#B89455]" />
          </div>
          <h3 className="text-xl font-black text-[#1E1A16]">{metricas.usuarios.toLocaleString('pt-BR')}</h3>
        </div>

        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#847663] mb-1">
            <span className="text-[11px] font-semibold">Páginas/Sessão</span>
            <Layers className="w-3.5 h-3.5 text-[#625746]" />
          </div>
          <h3 className="text-xl font-black text-[#1E1A16]">{metricas.paginasPorSessao}</h3>
        </div>

        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#847663] mb-1">
            <span className="text-[11px] font-semibold">Duração Média</span>
            <Clock className="w-3.5 h-3.5 text-[#625746]" />
          </div>
          <h3 className="text-lg font-black text-[#1E1A16] mt-0.5">{metricas.duracaoMedia}</h3>
        </div>

        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#847663] mb-1">
            <span className="text-[11px] font-semibold">Taxa de Rejeição</span>
            <AlertCircle className="w-3.5 h-3.5 text-[#B83B32]" />
          </div>
          <h3 className="text-xl font-black text-[#1E1A16]">{metricas.taxaRejeicao}%</h3>
        </div>

        {/* CARD ESPECIAL: CONVERSÃO DE WHATSAPP */}
        <div className="bg-gradient-to-br from-[#F3FBF6] to-[#FFFDF8] p-3.5 rounded-[11px] border border-[#22C55E]/30 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#16A34A] mb-1">
            <span className="text-[11px] font-bold">Conv. WhatsApp</span>
            <MessageCircle className="w-3.5 h-3.5 text-[#16A34A]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#16A34A]">{metricas.taxaConversaoWhats}%</h3>
            <span className="text-[10px] text-[#847663] font-mono">{metricas.whatsappCliques} cliques</span>
          </div>
        </div>
      </div>

      {/* LINHA 2: GRÁFICO DIÁRIO MULTI-MÉTRICA COM TOOLTIP INTERATIVO */}
      <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEE7DC] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B89455]/15 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-[#8A6828]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
                Linha do Tempo Diária de Tráfego
              </h3>
              <p className="text-[10px] text-[#847663]">
                Pico: <strong>{maxValorGrafico}</strong> • Média diária: <strong>~{mediaDiaria}</strong>
              </p>
            </div>
          </div>

          {/* SELETOR DE MÉTRICA DO GRÁFICO */}
          <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-lg border border-[#D8CBB8]/70">
            <button
              onClick={() => setMetricaGrafico('visualizacoes')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                metricaGrafico === 'visualizacoes'
                  ? 'bg-[#14120E] text-[#C7A15F] shadow-xs'
                  : 'text-[#625746] hover:text-[#1E1A16]'
              }`}
            >
              Visualizações
            </button>
            <button
              onClick={() => setMetricaGrafico('visitantes')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                metricaGrafico === 'visitantes'
                  ? 'bg-[#14120E] text-[#C7A15F] shadow-xs'
                  : 'text-[#625746] hover:text-[#1E1A16]'
              }`}
            >
              Visitantes Únicos
            </button>
            <button
              onClick={() => setMetricaGrafico('sessoes')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                metricaGrafico === 'sessoes'
                  ? 'bg-[#14120E] text-[#C7A15F] shadow-xs'
                  : 'text-[#625746] hover:text-[#1E1A16]'
              }`}
            >
              Sessões
            </button>
          </div>
        </div>

        {/* CONTAINER DO GRÁFICO DE BARRAS */}
        <div className="relative pt-6">
          <div className="h-56 flex items-end justify-between gap-1 sm:gap-2 pb-2 border-b border-[#EEE7DC]">
            {timelineData.map((d, index) => {
              const valor = getValorMetrica(d);
              const heightPercent = Math.max((valor / maxValorGrafico) * 100, 6);
              const isPico = valor > 0 && valor >= maxValorGrafico * 0.75;
              const isHovered = hoveredPointIndex === index;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredPointIndex(index)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                >
                  {/* TOOLTIP FLUTUANTE DE ALTA RESOLUÇÃO */}
                  {isHovered && (
                    <div className="absolute -top-20 z-40 bg-[#14120E] text-[#FAF7F2] border border-[#C7A15F]/40 p-2.5 rounded-lg shadow-xl text-left pointer-events-none min-w-[140px] animate-fade-in">
                      <p className="text-[10px] font-bold text-[#C7A15F] uppercase tracking-wider">{d.dataCompleta}</p>
                      <p className="text-xs font-black text-[#FAF7F2] mt-0.5">
                        {valor.toLocaleString('pt-BR')}{' '}
                        <span className="text-[9px] font-normal text-[#D8CBB8]">
                          {metricaGrafico === 'visualizacoes' ? 'views' : metricaGrafico === 'visitantes' ? 'visitantes' : 'sessões'}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 text-[9px] text-[#A89880] mt-1 pt-1 border-t border-[#2B261F]">
                        <span>Views: {d.visualizacoes}</span>
                        <span>•</span>
                        <span>Únicos: {d.visitantes}</span>
                      </div>
                    </div>
                  )}

                  <span
                    className={`text-[9px] font-bold mb-1 transition-opacity ${
                      isPico || isHovered ? 'text-[#8A6828] opacity-100' : 'text-[#847663] opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {valor}
                  </span>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-200 ${
                      isHovered
                        ? 'bg-[#8A6828] shadow-md scale-y-102'
                        : isPico
                        ? 'bg-gradient-to-t from-[#B89455] to-[#D8CBB8] shadow-xs'
                        : valor > 0
                        ? 'bg-[#B89455]/75 hover:bg-[#B89455]'
                        : 'bg-[#EEE7DC]'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* DATAS NO EIXO X */}
          <div className="flex justify-between text-[9px] text-[#847663] font-mono pt-2 overflow-hidden">
            {timelineData.map((d, index) => (
              <span key={index} className="truncate max-w-[36px] text-center">
                {d.dia}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* LINHA 3: ORIGENS DE TRÁFEGO, CAMPANHAS UTMS, TECNOLOGIA & GEOLOCALIZAÇÃO (ABAS) */}
      <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEE7DC] pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#B89455]" />
            <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
              Segmentação Detalhada de Tráfego
            </h3>
          </div>

          {/* ABAS DE SEGMENTAÇÃO */}
          <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-lg border border-[#D8CBB8]/70 overflow-x-auto">
            <button
              onClick={() => setAbaTrafego('canais')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                abaTrafego === 'canais' ? 'bg-[#14120E] text-[#C7A15F] shadow-xs' : 'text-[#625746] hover:text-[#1E1A16]'
              }`}
            >
              Canais & Redes
            </button>
            <button
              onClick={() => setAbaTrafego('campanhas')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                abaTrafego === 'campanhas' ? 'bg-[#14120E] text-[#C7A15F] shadow-xs' : 'text-[#625746] hover:text-[#1E1A16]'
              }`}
            >
              <Share2 className="w-3 h-3" />
              Campanhas UTM
            </button>
            <button
              onClick={() => setAbaTrafego('tecnologia')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                abaTrafego === 'tecnologia' ? 'bg-[#14120E] text-[#C7A15F] shadow-xs' : 'text-[#625746] hover:text-[#1E1A16]'
              }`}
            >
              <Cpu className="w-3 h-3" />
              Tecnologia & OS
            </button>
            <button
              onClick={() => setAbaTrafego('localizacao')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                abaTrafego === 'localizacao' ? 'bg-[#14120E] text-[#C7A15F] shadow-xs' : 'text-[#625746] hover:text-[#1E1A16]'
              }`}
            >
              <MapPin className="w-3 h-3" />
              Localização
            </button>
          </div>
        </div>

        {/* CONTEÚDO DA ABA SELECIONADA */}
        {abaTrafego === 'canais' && (
          <div className="space-y-4 animate-fade-in">
            {/* Barra Visual de Proporção de Canais */}
            <div className="h-4 w-full rounded-full overflow-hidden flex shadow-2xs">
              {canaisOrigem.map((c, i) => (
                <div
                  key={i}
                  style={{ width: `${Math.max(c.porcentagem, 2)}%`, backgroundColor: c.cor }}
                  title={`${c.nome}: ${c.porcentagem}% (${c.sessoes} sessões)`}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {canaisOrigem.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#E5D9C8]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1E1A16] truncate">{c.nome}</p>
                      <p className="text-[10px] text-[#847663]">{c.pageviews.toLocaleString('pt-BR')} visualizações</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-[#1E1A16] text-xs">{c.porcentagem}%</span>
                    <p className="text-[9px] text-[#847663] font-mono">{c.sessoes} sessões</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaTrafego === 'campanhas' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            {/* UTM Sources */}
            <div className="bg-[#FAF7F2] p-3.5 rounded-lg border border-[#E5D9C8] space-y-2">
              <h4 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B89455]"></span>
                UTM Source (Origens)
              </h4>
              <div className="space-y-1.5">
                {utmSources.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#FFFDF8] border border-[#EEE7DC] text-xs">
                    <span className="font-mono text-[11px] text-[#8A6828] truncate max-w-[120px]">{item.name}</span>
                    <div className="text-right">
                      <span className="font-bold text-[#1E1A16]">{item.percentage}%</span>
                      <p className="text-[9px] text-[#847663]">{item.sessions} sessões</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UTM Mediums */}
            <div className="bg-[#FAF7F2] p-3.5 rounded-lg border border-[#E5D9C8] space-y-2">
              <h4 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8A6828]"></span>
                UTM Medium (Mídias)
              </h4>
              <div className="space-y-1.5">
                {utmMediums.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#FFFDF8] border border-[#EEE7DC] text-xs">
                    <span className="font-mono text-[11px] text-[#8A6828] truncate max-w-[120px]">{item.name}</span>
                    <div className="text-right">
                      <span className="font-bold text-[#1E1A16]">{item.percentage}%</span>
                      <p className="text-[9px] text-[#847663]">{item.sessions} sessões</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UTM Campaigns */}
            <div className="bg-[#FAF7F2] p-3.5 rounded-lg border border-[#E5D9C8] space-y-2">
              <h4 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#247A4A]"></span>
                UTM Campaign (Campanhas)
              </h4>
              <div className="space-y-1.5">
                {utmCampaigns.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#FFFDF8] border border-[#EEE7DC] text-xs">
                    <span className="font-mono text-[11px] text-[#8A6828] truncate max-w-[120px]">{item.name}</span>
                    <div className="text-right">
                      <span className="font-bold text-[#1E1A16]">{item.percentage}%</span>
                      <p className="text-[9px] text-[#847663]">{item.sessions} sessões</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {abaTrafego === 'tecnologia' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            {/* Dispositivos */}
            <div className="bg-[#FAF7F2] p-3.5 rounded-lg border border-[#E5D9C8] space-y-2">
              <h4 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#B89455]" />
                Dispositivos
              </h4>
              <div className="space-y-1.5">
                {dispositivos.map((dev, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#FFFDF8] border border-[#EEE7DC]">
                    <div className="flex items-center gap-2">
                      {deviceIcon(dev.name)}
                      <span className="text-xs font-semibold text-[#1E1A16] capitalize">{dev.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1E1A16]">{dev.percentage}%</span>
                      <p className="text-[9px] text-[#847663]">{dev.sessions} sessões</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sistemas Operacionais */}
            <div className="bg-[#FAF7F2] p-3.5 rounded-lg border border-[#E5D9C8] space-y-2">
              <h4 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#8A6828]" />
                Sistemas Operacionais
              </h4>
              <div className="space-y-1.5">
                {sistemasOperacionais.map((osItem, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#FFFDF8] border border-[#EEE7DC]">
                    <span className="text-xs font-semibold text-[#1E1A16]">{osItem.name}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1E1A16]">{osItem.percentage}%</span>
                      <p className="text-[9px] text-[#847663]">{osItem.sessions} sessões</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navegadores */}
            <div className="bg-[#FAF7F2] p-3.5 rounded-lg border border-[#E5D9C8] space-y-2">
              <h4 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#247A4A]" />
                Navegadores
              </h4>
              <div className="space-y-1.5">
                {navegadores.map((nav, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#FFFDF8] border border-[#EEE7DC]">
                    <span className="text-xs font-semibold text-[#1E1A16]">{nav.name}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1E1A16]">{nav.percentage}%</span>
                      <p className="text-[9px] text-[#847663]">{nav.sessions} sessões</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {abaTrafego === 'localizacao' && (
          <div className="space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {paisesTop.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#E5D9C8] text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#B89455]" />
                    <span className="font-bold text-[#1E1A16]">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#1E1A16]">{c.percentage}%</span>
                    <p className="text-[9px] text-[#847663]">{c.sessions} sessões</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LINHA 4: PÁGINAS & LANDING PAGES COM CLASSIFICAÇÃO INTELIGENTE */}
      <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEE7DC] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#B89455]" />
            <div>
              <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
                Páginas & Landing Pages Mais Acessadas
              </h3>
              <p className="text-[10px] text-[#847663]">Ranking por volume de visualizações e engajamento</p>
            </div>
          </div>

          {/* BARRA DE PESQUISA DE PÁGINAS */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#847663] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={termoBuscaPagina}
              onChange={(e) => setTermoBuscaPagina(e.target.value)}
              placeholder="Filtrar páginas ou tipo..."
              className="h-8 pl-8 pr-3 rounded-lg bg-[#FAF7F2] border border-[#D8CBB8] text-xs text-[#1E1A16] placeholder:text-[#847663] focus:outline-none focus:border-[#8A6828] w-full sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF7F2] text-[#625746] border-b border-[#D8CBB8]">
              <tr>
                <th className="py-2.5 px-3 font-bold">Caminho da Rota</th>
                <th className="py-2.5 px-3 font-bold">Tipo</th>
                <th className="py-2.5 px-3 font-bold text-center">Share Visual</th>
                <th className="py-2.5 px-3 text-right font-bold">Visualizações</th>
                <th className="py-2.5 px-3 text-right font-bold">Sessões</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE7DC]">
              {paginasAcessadas.map((p, i) => {
                const percentualShare = Math.round((p.visualizacoes / maxPaginaVisualizacoes) * 100);

                return (
                  <tr key={i} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#8A6828] max-w-[240px] truncate">
                      <div className="flex items-center gap-1.5">
                        <span>{p.caminho}</span>
                        {p.caminho.startsWith('http') && (
                          <a href={p.caminho} target="_blank" rel="noreferrer" className="text-[#847663] hover:text-[#1E1A16]">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] border ${p.badgeCor}`}>
                        {p.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 min-w-[120px]">
                      <div className="w-full bg-[#EEE7DC] h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentualShare}%` }}
                          className="bg-[#B89455] h-full rounded-full transition-all"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#1E1A16]">
                      {p.visualizacoes.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#625746] font-mono">
                      {p.sessoes.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* LINHA 5: CLIQUES NO WHATSAPP (INTENÇÃO & LEADS CAPTADOS) */}
      <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-[11px] shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-[#EEE7DC] bg-[#F3FBF6] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#22C55E]/15 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
                  Histórico de Cliques no WhatsApp (Intenção de Compra)
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#22C55E]/15 text-[#16A34A] border border-[#22C55E]/30">
                  Taxa {metricas.taxaConversaoWhats}%
                </span>
              </div>
              <p className="text-[10px] text-[#847663]">
                Rastreamento de visitantes que acionaram o botão de contato comercial no site ou LP
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-3xl font-black text-[#16A34A]">{whatsappClicksCount}</span>
            <p className="text-[10px] text-[#847663]">leads/cliques no período</p>
          </div>
        </div>

        {whatsappClicks.length > 0 ? (
          <div className="divide-y divide-[#EEE7DC] max-h-72 overflow-y-auto">
            {whatsappClicks.map((c, idx) => (
              <div key={idx} className="flex items-start justify-between gap-3 px-4 sm:px-5 py-2.5 hover:bg-[#FAF7F2] transition-colors">
                <div className="min-w-0">
                  <p className="text-xs text-[#1E1A16] font-medium truncate flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                    <span>{c.mensagem || c.botao || 'Clique no botão de WhatsApp'}</span>
                  </p>
                  <p className="text-[10px] text-[#847663] font-mono mt-0.5">
                    {[c.cidade, c.dispositivo, c.navegador].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-[10px] text-[#847663] shrink-0 whitespace-nowrap">
                  {formatRelativeTime(c.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#847663] px-4 sm:px-5 py-4">
            {isRealData
              ? 'Nenhum clique no botão de WhatsApp registrado no período selecionado.'
              : 'Conecte o OpenPanel para visualizar a lista completa de intenções e leads rastreados.'}
          </p>
        )}
      </div>

      {/* MODAL DE CONFIGURAÇÃO DO PROJETO OPENPANEL */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-[#14120E]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#FAF7F2] rounded-[14px] border border-[#D8CBB8] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-[#14120E] text-[#FAF7F2] border-b border-[#2B261F]">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#C7A15F]" />
                <h3 className="font-bold text-sm">Configuração OpenPanel</h3>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-[#A89880] hover:text-[#FAF7F2] p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4">
              <p className="text-xs text-[#625746]">
                Informe o <strong>ID do Projeto no OpenPanel</strong> deste cliente para puxar o tráfego do site/LP automaticamente.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#1E1A16] mb-1">ID do Projeto OpenPanel</label>
                <input
                  type="text"
                  value={projectIdInput}
                  onChange={(e) => setProjectIdInput(e.target.value)}
                  placeholder="Ex: dra-manuela-cordeiro-lp"
                  className="w-full h-10 px-3 rounded-lg bg-[#FFFDF8] border border-[#D8CBB8] text-xs font-mono text-[#1E1A16] focus:outline-none focus:border-[#8A6828]"
                />
                <span className="text-[10px] text-[#847663] mt-1 block">
                  Visível no dashboard do OpenPanel, na URL ou nas configurações do projeto (slug).
                </span>
              </div>

              <div className="pt-3 border-t border-[#D8CBB8] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1E1A16]">Credenciais deste cliente</label>
                  {op?.configured ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#247A4A]/10 text-[#247A4A] border border-[#247A4A]/30">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Configuradas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#B83B32]/10 text-[#B83B32] border border-[#B83B32]/30">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Pendentes
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#625746] mb-1">Client ID</label>
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="Deixe em branco para manter"
                      className="w-full h-10 px-3 rounded-lg bg-[#FFFDF8] border border-[#D8CBB8] text-xs font-mono text-[#1E1A16] focus:outline-none focus:border-[#8A6828]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#625746] mb-1">Client Secret</label>
                    <input
                      type="password"
                      value={clientSecretInput}
                      onChange={(e) => setClientSecretInput(e.target.value)}
                      placeholder="Deixe em branco para manter"
                      className="w-full h-10 px-3 rounded-lg bg-[#FFFDF8] border border-[#D8CBB8] text-xs font-mono text-[#1E1A16] focus:outline-none focus:border-[#8A6828]"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-[#847663] block">
                  Gerados especificamente para este cliente no painel do OpenPanel (Organization → API Keys).
                </span>
              </div>

              <div className="pt-3 border-t border-[#D8CBB8] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] text-xs font-bold text-[#625746] hover:bg-[#EEE7DC] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-4 py-2 rounded-lg bg-[#14120E] text-xs font-bold text-[#C7A15F] hover:bg-[#2B261F] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {savingConfig ? 'Salvando...' : 'Salvar & Sincronizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
