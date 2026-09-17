import { useState, useMemo, useEffect } from 'react';
import type { Cliente } from '../../types';
import { api } from '../../api/client';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
  Calendar,
  RefreshCw,
  Trophy,
  Activity,
  CheckCircle2,
  Link2,
  Unlink,
  AlertCircle,
  X,
} from 'lucide-react';

interface Props {
  cliente: Cliente;
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface YearDay {
  date: Date;
  dataStr: string;
  dataLabel: string;
  diaSemana: number; // 0 = Dom, 1 = Seg, ..., 6 = Sab
  monthIndex: number; // 0 = Jan, 1 = Fev, ..., 11 = Dez
  postsCount: number;
  detalhes: string;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
}

interface TimelineItem {
  dia: string;
  alcance: number;
  reels: boolean;
}

interface PublicacaoItem {
  id: string;
  tipo: string;
  titulo: string;
  data: string;
  alcance: number;
  visualizacoesVideo: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  salvos: number;
  taxaEngajamento: number;
  destaque?: string;
  tema: string;
  permalink?: string;
  mediaUrl?: string;
}

export function InstagramPerformanceDashboard({ cliente }: Props) {
  const [periodo, setPeriodo] = useState<string>('30d');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<YearDay | null>(null);

  const [realData, setRealData] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isConnected = !!(cliente.instagramAccountId && cliente.metaAccessToken);

  const loadInstagramMetrics = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const days = periodo === '7d' ? 7 : periodo === '90d' ? 90 : 30;
      const res = await api.get(`/analytics/instagram/${cliente.id}?days=${days}`);
      setRealData(res.data);
    } catch (err: any) {
      console.warn('Aviso ao carregar dados do Instagram:', err);
      setFetchError(err.response?.data?.message || 'Falha ao buscar dados na Meta API');
    } finally {
      setLoading(false);
    }
  };

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectingAccountId, setSelectingAccountId] = useState<string | null>(null);

  const fetchAvailableAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await api.get(`/analytics/instagram/available-accounts/${cliente.id}`);
      setAvailableAccounts(res.data || []);
      setShowAccountModal(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao buscar contas disponíveis no Facebook.');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleSelectAccount = async (account: any) => {
    if (!account.hasInstagram || !account.instagramId) {
      alert('Esta Página do Facebook não tem uma conta do Instagram vinculada a ela.');
      return;
    }
    setSelectingAccountId(account.instagramId);
    try {
      await api.post('/analytics/instagram/select-account', {
        clienteId: cliente.id,
        pageId: account.pageId,
        instagramAccountId: account.instagramId,
        instagramUsername: account.instagramUsername,
      });
      setShowAccountModal(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao vincular conta selecionada');
    } finally {
      setSelectingAccountId(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const warning = params.get('warning');
    const err = params.get('error');
    const selectAccount = params.get('select_account');

    if (warning) {
      alert(`Aviso de Conexão:\n\n${warning}`);
      window.history.replaceState({}, document.title, window.location.pathname + '?tab=instagram');
    }
    if (err) {
      alert(`Erro na Conexão:\n\n${err}`);
      window.history.replaceState({}, document.title, window.location.pathname + '?tab=instagram');
    }
    if (selectAccount === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname + '?tab=instagram');
      fetchAvailableAccounts();
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      loadInstagramMetrics();
    }
  }, [cliente.id, cliente.instagramAccountId, cliente.metaAccessToken, periodo]);

  const handleRefresh = () => {
    if (isConnected) {
      loadInstagramMetrics();
    } else {
      setLoading(true);
      setTimeout(() => setLoading(false), 400);
    }
  };

  const handleConnectInstagram = async () => {
    setConnecting(true);
    try {
      const res = await api.get(`/analytics/instagram/auth-url/${cliente.id}`);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao gerar URL de autorização da Meta');
      setConnecting(false);
    }
  };

  const handleConnectInstagramDireto = async () => {
    setConnecting(true);
    try {
      const res = await api.get(`/analytics/instagram/auth-url-direto/${cliente.id}`);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao gerar URL de autorização direta do Instagram');
      setConnecting(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    if (!confirm('Deseja realmente desconectar a conta do Instagram deste cliente? Todos os dados serão limpos.')) return;
    setDisconnecting(true);
    try {
      await api.delete(`/analytics/instagram/${cliente.id}`);
      setRealData(null);
      window.location.href = window.location.pathname + '?tab=instagram';
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao desconectar Instagram');
    } finally {
      setDisconnecting(false);
    }
  };

  // Métricas Consolidadas do Instagram (Reais quando conectadas ou Zeradas quando desconectadas)
  const metricas = useMemo(() => {
    if (isConnected && realData) {
      const ov = realData.overview || {};
      const reach = ov.reach || 0;
      const engaged = ov.accountsEngaged || 0;
      const taxa = reach > 0 ? Number(((engaged / reach) * 100).toFixed(2)) : 0;

      return {
        seguidores: ov.totalFollowers || realData.account?.followers_count || 0,
        novosSeguidores: 0,
        varSeguidores: 0,
        alcance: reach,
        varAlcance: 0,
        impressoes: ov.impressions || 0,
        varImpressoes: 0,
        interacoes: engaged,
        varInteracoes: 0,
        taxaEngajamento: taxa,
        varTaxaEngajamento: 0,
        cliquesBio: 0,
        varCliquesBio: 0,
        visitasPerfil: ov.profileViews || 0,
        varVisitasPerfil: 0,
      };
    }

    return {
      seguidores: 0,
      novosSeguidores: 0,
      varSeguidores: 0,
      alcance: 0,
      varAlcance: 0,
      impressoes: 0,
      varImpressoes: 0,
      interacoes: 0,
      varInteracoes: 0,
      taxaEngajamento: 0,
      varTaxaEngajamento: 0,
      cliquesBio: 0,
      varCliquesBio: 0,
      visitasPerfil: 0,
      varVisitasPerfil: 0,
    };
  }, [isConnected, realData, periodo, cliente.id]);

  // Evolução Diária de Alcance no Instagram
  const timelineAlcance = useMemo<TimelineItem[]>(() => {
    if (!isConnected || !realData?.insightsHistory || realData.insightsHistory.length === 0) {
      return [];
    }

    return realData.insightsHistory.map((item: any) => {
      let diaLabel = item.date;
      try {
        const parts = item.date.split('-');
        if (parts.length === 3) {
          diaLabel = `${parts[2]}/${parts[1]}`;
        }
      } catch {}
      return {
        dia: diaLabel,
        alcance: item.reach || 0,
        reels: false,
      };
    });
  }, [isConnected, realData]);

  const maxAlcance = useMemo(() => {
    if (timelineAlcance.length === 0) return 0;
    return Math.max(...timelineAlcance.map((d) => d.alcance));
  }, [timelineAlcance]);

  // Desempenho por Formato de Publicação
  const formatosDesempenho = useMemo(() => {
    if (!isConnected || !realData?.recentMedia || realData.recentMedia.length === 0) {
      return [
        { formato: 'Reels (Vídeos)', porcentagem: 0, engajamentoMedio: '0%', posts: 0, cor: '#B89455' },
        { formato: 'Carrosséis', porcentagem: 0, engajamentoMedio: '0%', posts: 0, cor: '#8A6828' },
        { formato: 'Posts Estáticos', porcentagem: 0, engajamentoMedio: '0%', posts: 0, cor: '#4A4032' },
      ];
    }

    const total = realData.recentMedia.length;
    const reelsCount = realData.recentMedia.filter((m: any) => m.media_type === 'VIDEO').length;
    const carrosselCount = realData.recentMedia.filter((m: any) => m.media_type === 'CAROUSEL_ALBUM').length;
    const staticCount = realData.recentMedia.filter((m: any) => m.media_type === 'IMAGE').length;

    return [
      {
        formato: 'Reels (Vídeos)',
        porcentagem: total > 0 ? Number(((reelsCount / total) * 100).toFixed(1)) : 0,
        engajamentoMedio: '—',
        posts: reelsCount,
        cor: '#B89455',
      },
      {
        formato: 'Carrosséis',
        porcentagem: total > 0 ? Number(((carrosselCount / total) * 100).toFixed(1)) : 0,
        engajamentoMedio: '—',
        posts: carrosselCount,
        cor: '#8A6828',
      },
      {
        formato: 'Posts Estáticos',
        porcentagem: total > 0 ? Number(((staticCount / total) * 100).toFixed(1)) : 0,
        engajamentoMedio: '—',
        posts: staticCount,
        cor: '#4A4032',
      },
    ];
  }, [isConnected, realData]);

  // Heatmap do Ano
  const yearHeatmap = useMemo(() => {
    const year = 2026;
    const today = new Date();
    
    const startDate = new Date(year, 0, 1);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const weeks: (YearDay | null)[][] = [];
    const monthsPositions: { name: string; weekIndex: number }[] = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    let currentDate = new Date(startDate);
    let totalPostsYear = 0;
    let daysWithPosts = 0;
    let lastMonth = -1;

    // Se conectado e houver mídias com timestamps, agrupa por dia
    const mediaDates = new Map<string, number>();
    if (isConnected && realData?.recentMedia) {
      realData.recentMedia.forEach((m: any) => {
        if (m.timestamp) {
          const dStr = m.timestamp.split('T')[0];
          mediaDates.set(dStr, (mediaDates.get(dStr) || 0) + 1);
        }
      });
    }

    for (let w = 0; w < 53; w++) {
      const week: (YearDay | null)[] = [];

      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(currentDate);
        const diaSemana = dateObj.getDay();
        const monthIndex = dateObj.getMonth();
        const isCurrentYear = dateObj.getFullYear() === year;
        const isFuture = dateObj > today;

        if (isCurrentYear && monthIndex !== lastMonth && d === 0) {
          monthsPositions.push({ name: monthNames[monthIndex], weekIndex: w });
          lastMonth = monthIndex;
        }

        const dataStr = dateObj.toISOString().split('T')[0];
        const dataLabel = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

        let postsCount = 0;
        let detalhes = isConnected ? 'Nenhuma publicação neste dia' : 'Conta desconectada';
        let level: 0 | 1 | 2 | 3 | 4 = 0;

        if (isConnected && isCurrentYear && !isFuture) {
          postsCount = mediaDates.get(dataStr) || 0;
          if (postsCount >= 4) {
            level = 4;
            detalhes = `${postsCount} publicações`;
          } else if (postsCount === 3) {
            level = 3;
            detalhes = '3 publicações';
          } else if (postsCount === 2) {
            level = 2;
            detalhes = '2 publicações';
          } else if (postsCount === 1) {
            level = 1;
            detalhes = '1 publicação';
          }
        }

        if (postsCount > 0) {
          totalPostsYear += postsCount;
          daysWithPosts++;
        }

        week.push({
          date: dateObj,
          dataStr,
          dataLabel,
          diaSemana,
          monthIndex,
          postsCount,
          detalhes,
          level,
          isFuture,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push(week);
    }

    return {
      weeks,
      monthsPositions,
      totalPostsYear: isConnected ? (realData?.account?.media_count || totalPostsYear) : 0,
      daysWithPosts,
      currentStreak: 0,
      longestStreak: 0,
      taxaConsistencia: 0,
    };
  }, [isConnected, realData]);

  // Melhores Publicações do Instagram (Sincronizadas em tempo real ou Vazias quando desconectadas)
  const publicacoes = useMemo<PublicacaoItem[]>(() => {
    if (!isConnected || !realData?.recentMedia || !Array.isArray(realData.recentMedia)) {
      return [];
    }

    return realData.recentMedia.map((m: any, idx: number): PublicacaoItem => {
      const tipo = m.media_type === 'VIDEO' ? 'REELS' : m.media_type === 'CAROUSEL_ALBUM' ? 'CARROSSEL' : 'POST';
      const dataLabel = m.timestamp
        ? new Date(m.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : '';
      const curtidas = m.like_count ?? 0;
      const comentarios = m.comments_count ?? 0;

      return {
        id: m.id || String(idx),
        tipo,
        titulo: m.caption ? (m.caption.length > 90 ? m.caption.slice(0, 90) + '...' : m.caption) : 'Publicação no Instagram',
        data: dataLabel,
        alcance: 0,
        visualizacoesVideo: 0,
        curtidas,
        comentarios,
        compartilhamentos: 0,
        salvos: 0,
        taxaEngajamento: 0,
        destaque: idx === 0 ? '✨ Mais Recente' : undefined,
        tema: 'Feed / Conteúdo',
        permalink: m.permalink,
        // Vídeos retornam media_url apontando pro arquivo .mp4 (não dá pra usar
        // como thumbnail de imagem) — nesse caso prioriza o thumbnail_url que a
        // API já gera como capa. Foto e carrossel usam o media_url normalmente.
        mediaUrl: m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : (m.media_url || m.thumbnail_url),
      };
    });
  }, [isConnected, realData]);

  const publicacoesFiltradas = useMemo<PublicacaoItem[]>(() => {
    if (filtroTipo === 'TODOS') return publicacoes;
    return publicacoes.filter((p: PublicacaoItem) => p.tipo === filtroTipo);
  }, [filtroTipo, publicacoes]);

  // Cores OFICIAIS do Vivox Design System para os níveis do Heatmap
  const getVivoxLevelColor = (level: 0 | 1 | 2 | 3 | 4, isFuture: boolean) => {
    if (isFuture) return 'bg-[#FAF7F2] border-[#E8DFC0] opacity-40'; // Futuro
    switch (level) {
      case 4:
        return 'bg-[#5C4418] border-[#3D2D10] shadow-2xs'; // 4+ posts (âmbar escuro intenso)
      case 3:
        return 'bg-[#8A6828] border-[#6E5018] shadow-2xs'; // 3 posts (dourado profundo Vivox)
      case 2:
        return 'bg-[#C7A15F] border-[#B89455]'; // 2 posts (dourado médio Vivox)
      case 1:
        return 'bg-[#D8CBB8] border-[#C5B5A0]'; // 1 post (dourado suave)
      case 0:
      default:
        return 'bg-[#EEE7DC] border-[#E2D8C9] hover:border-[#B89455]'; // 0 posts (bege neutro)
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* BANNER DE STATUS / CONEXÃO COM A META */}
      {!isConnected ? (
        cliente.metaAccessToken ? (
          <div className="p-6 rounded-[14px] bg-gradient-to-r from-[#241E15] via-[#2F261B] to-[#1E1912] border border-[#B89455]/40 text-[#F6F0E7] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-[#B89455]/20 text-[#C7A15F] border border-[#B89455]/30">
                  Meta Graph API
                </span>
                <span className="text-xs text-[#EAB308] font-bold">• Facebook Autorizado / Seleção Pendente</span>
              </div>
              <h3 className="text-lg font-bold text-[#FAF7F2] flex items-center gap-2">
                <InstagramIcon className="w-5 h-5 text-[#E1306C]" />
                Vincular Conta do Instagram à {cliente.nomeFantasia}
              </h3>
              <p className="text-xs text-[#C5B5A0] leading-relaxed">
                Seu Facebook já foi autorizado. Clique no botão abaixo para escolher qual das suas contas do Instagram pertence a este cliente, ou faça um novo login.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                onClick={fetchAvailableAccounts}
                disabled={loadingAccounts}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#B89455] to-[#8A6828] hover:from-[#C7A15F] hover:to-[#9B7733] text-[#1E1A16] font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-md hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loadingAccounts ? 'Buscando contas...' : 'Escolher Conta do Instagram'}
              </button>
              <button
                onClick={handleConnectInstagram}
                disabled={connecting}
                className="px-4 py-3 rounded-xl border border-[#4A4032] hover:bg-[#2F2A22] text-[#C5B5A0] font-semibold text-xs transition-colors cursor-pointer"
              >
                Novo Login Facebook
              </button>
              <button
                onClick={handleDisconnectInstagram}
                disabled={disconnecting}
                className="px-4 py-3 rounded-xl border border-[#DC2626]/40 hover:bg-[#DC2626]/15 text-[#F87171] font-semibold text-xs transition-colors cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5 inline mr-1" />
                {disconnecting ? 'Limpando...' : 'Desconectar / Limpar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-[14px] bg-gradient-to-r from-[#241E15] via-[#2F261B] to-[#1E1912] border border-[#B89455]/40 text-[#F6F0E7] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-[#B89455]/20 text-[#C7A15F] border border-[#B89455]/30">
                  Meta Graph API
                </span>
                <span className="text-xs text-[#8F8271]">• Desconectado</span>
              </div>
              <h3 className="text-lg font-bold text-[#FAF7F2] flex items-center gap-2">
                <InstagramIcon className="w-5 h-5 text-[#E1306C]" />
                Conectar Conta Profissional do Instagram
              </h3>
              <p className="text-xs text-[#C5B5A0] leading-relaxed">
                Vincule a conta comercial ou de criador de conteúdo do Instagram conectada à Página do Facebook deste cliente para sincronizar métricas oficiais de alcance, impressões, seguidores e publicações.
              </p>
              <div className="pt-1 text-[11px] text-[#C7A15F] flex items-center gap-1.5">
                <span>💡</span>
                <span>Cada cliente possui integração independente. No login do Facebook, use a opção <strong>"Editar configurações"</strong> caso precise marcar a Página vinculada a este cliente.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                onClick={handleConnectInstagramDireto}
                disabled={connecting}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#E1306C] to-[#C13584] hover:from-[#F56040] hover:to-[#833AB4] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-md hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              >
                <InstagramIcon className="w-4 h-4" />
                {connecting ? 'Iniciando...' : 'Login Instagram (Direto)'}
              </button>
              
              <button
                onClick={handleConnectInstagram}
                disabled={connecting}
                className="px-5 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-md hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              >
                <Link2 className="w-4 h-4" />
                {connecting ? 'Iniciando...' : 'Login via Facebook Pages'}
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="px-5 py-3 rounded-[11px] bg-[#241E15]/80 border border-[#B89455]/30 text-[#F6F0E7] flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#247A4A] animate-pulse"></span>
            <span className="text-xs font-semibold text-[#D8CBB8]">
              Conta conectada: <strong className="text-[#C7A15F]">@{cliente.instagramUsername || realData?.account?.username || 'instagram_conectado'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAvailableAccounts}
              disabled={loadingAccounts}
              className="text-[12px] font-semibold text-[#C7A15F] hover:text-[#E8DFC0] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAccounts ? 'animate-spin' : ''}`} />
              Trocar / Escolher Conta
            </button>
            <span className="text-[#4A4032]">•</span>
            <button
              onClick={handleDisconnectInstagram}
              disabled={disconnecting}
              className="text-[12px] font-semibold text-[#C5B5A0] hover:text-[#DC2626] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              {disconnecting ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE SELEÇÃO DE CONTAS DISPONÍVEIS NA META */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1C1813] border border-[#B89455]/40 rounded-2xl max-w-lg w-full p-6 text-[#FAF7F2] shadow-2xl relative space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-[#332A1F] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C7A15F]">
                  Meta Business • Seleção de Conta
                </span>
                <h3 className="text-lg font-bold text-[#FAF7F2] mt-0.5">
                  Vincular Conta à {cliente.nomeFantasia}
                </h3>
                <p className="text-xs text-[#C5B5A0] mt-1">
                  Selecione qual conta do Instagram deve alimentar o dashboard deste cliente:
                </p>
              </div>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-[#8F8271] hover:text-[#FAF7F2] p-1 rounded-lg hover:bg-[#2E2519] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {availableAccounts.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#C5B5A0]">
                  Nenhuma página ou conta encontrada.
                </div>
              ) : (
                availableAccounts.map((acc) => {
                  const isCurrent = acc.isSelected || acc.instagramId === cliente.instagramAccountId;
                  const isSelecting = selectingAccountId === acc.instagramId;

                  return (
                    <div
                      key={acc.pageId}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-[#B89455]/15 border-[#B89455] shadow-xs'
                          : acc.hasInstagram
                          ? 'bg-[#241E15] border-[#3D3323] hover:border-[#B89455]/50'
                          : 'bg-[#1A1612]/60 border-[#2E261B] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {acc.profilePictureUrl ? (
                          <img
                            src={acc.profilePictureUrl}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-[#B89455]/40 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#2E2519] border border-[#4A3D29] flex items-center justify-center shrink-0">
                            <InstagramIcon className="w-5 h-5 text-[#C7A15F]" />
                          </div>
                        )}

                        <div className="min-w-0">
                          {acc.hasInstagram ? (
                            <div className="text-sm font-bold text-[#FAF7F2] truncate flex items-center gap-1.5">
                              @{acc.instagramUsername}
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#247A4A] text-white">
                                  Ativa
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs font-semibold text-[#8F8271] italic">
                              Sem Instagram vinculado
                            </div>
                          )}
                          <div className="text-[11px] text-[#A89885] truncate">
                            Página: {acc.pageName}
                          </div>
                        </div>
                      </div>

                      {acc.hasInstagram ? (
                        <button
                          onClick={() => handleSelectAccount(acc)}
                          disabled={isCurrent || isSelecting}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-transparent text-[#247A4A] border border-[#247A4A] cursor-default'
                              : 'bg-[#B89455] hover:bg-[#C7A15F] text-[#1E1A16] shadow-xs'
                          } disabled:opacity-60`}
                        >
                          {isSelecting ? 'Vinculando...' : isCurrent ? 'Selecionada' : 'Selecionar'}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-[#8F8271] uppercase tracking-wider px-2 py-1 rounded bg-[#241E15] border border-[#332A1F]">
                          Sem IG
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-[#332A1F] flex items-center justify-between text-xs text-[#8F8271]">
              <span>Contas disponíveis no seu acesso da Meta</span>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-xs text-[#C5B5A0] hover:text-[#FAF7F2] font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CABEÇALHO DO INSTAGRAM DASHBOARD (STICKY) */}
      <div className="sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14120E]/95 backdrop-blur-md text-[#F6F0E7] p-4 sm:p-5 rounded-[11px] border border-[#2B261F] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-[#247A4A] animate-pulse' : 'bg-[#8F8271]'}`}></span>
            <span className={`text-[12px] font-bold uppercase tracking-[0.14em] ${isConnected ? 'text-[#C7A15F]' : 'text-[#A89885]'}`}>
              {isConnected
                ? `Desempenho de Redes Sociais • @${cliente.instagramUsername || realData?.account?.username || 'instagram'}`
                : 'Desempenho de Redes Sociais • Nenhuma conta conectada'}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#FAF7F2] mt-0.5 flex items-center gap-2">
            <InstagramIcon className={`w-5 h-5 ${isConnected ? 'text-[#C7A15F]' : 'text-[#8F8271]'}`} />
            INSTAGRAM INSIGHTS & ENGAJAMENTO — {isConnected ? 'DADOS EM TEMPO REAL' : 'DESCONECTADO'}
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            disabled={!isConnected}
            className="h-9 px-3 rounded-lg bg-[#24201A] border border-[#4A4032] text-xs font-semibold text-[#C7A15F] focus:outline-none focus:border-[#C7A15F] disabled:opacity-50"
          >
            <option value="30d">🗓️ Últimos 30 dias</option>
            <option value="7d">🗓️ Últimos 7 dias</option>
            <option value="90d">🗓️ Últimos 90 dias</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={loading || !isConnected}
            className="h-9 px-3 rounded-lg border border-[#4A4032] bg-[#24201A] hover:bg-[#2F2A22] text-[#F6F0E7] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C7A15F] ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* LINHA 1: KPIS DO INSTAGRAM (MTD COM % DE VARIAÇÃO) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Seguidores */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[12.5px] font-semibold text-[#847663]">Seguidores</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {isConnected ? metricas.seguidores.toLocaleString('pt-BR') : '—'}
          </h3>
          <div className="flex items-center gap-1 text-[12px] font-bold mt-1 text-[#847663]">
            <span>{isConnected ? `${metricas.seguidores} no perfil` : 'Sem dados'}</span>
          </div>
        </div>

        {/* Alcance de Contas */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[12.5px] font-semibold text-[#847663]">Contas Alcançadas</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {isConnected ? metricas.alcance.toLocaleString('pt-BR') : '—'}
          </h3>
          <div className="flex items-center gap-1 text-[12px] font-bold mt-1 text-[#847663]">
            <span>{isConnected ? `${metricas.alcance} no período` : 'Sem dados'}</span>
          </div>
        </div>

        {/* Impressões */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[12.5px] font-semibold text-[#847663]">Impressões Totais</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {isConnected ? metricas.impressoes.toLocaleString('pt-BR') : '—'}
          </h3>
          <div className="flex items-center gap-1 text-[12px] font-bold mt-1 text-[#847663]">
            <span>{isConnected ? `${metricas.impressoes} impressões` : 'Sem dados'}</span>
          </div>
        </div>

        {/* Interações */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[12.5px] font-semibold text-[#847663]">Contas Engajadas</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {isConnected ? metricas.interacoes.toLocaleString('pt-BR') : '—'}
          </h3>
          <div className="flex items-center gap-1 text-[12px] font-bold mt-1 text-[#847663]">
            <span>{isConnected ? `${metricas.interacoes} contas` : 'Sem dados'}</span>
          </div>
        </div>

        {/* Taxa de Engajamento */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[12.5px] font-semibold text-[#847663]">Taxa Engajamento</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">{isConnected ? `${metricas.taxaEngajamento}%` : '—'}</h3>
          <div className="flex items-center gap-1 text-[12px] font-bold mt-1 text-[#847663]">
            <span>{isConnected ? 'Engajadas / Alcance' : 'Sem dados'}</span>
          </div>
        </div>

        {/* Total de Mídias */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[12.5px] font-semibold text-[#847663]">Total de Mídias</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {isConnected ? (realData?.account?.media_count ?? 0) : '—'}
          </h3>
          <div className="flex items-center gap-1 text-[12px] font-bold mt-1 text-[#847663]">
            <span>{isConnected ? 'Posts publicados' : 'Sem dados'}</span>
          </div>
        </div>

        {/* Visitas ao Perfil */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[12.5px] font-semibold text-[#847663]">Visitas ao Perfil</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {isConnected ? metricas.visitasPerfil.toLocaleString('pt-BR') : '—'}
          </h3>
          <div className="flex items-center gap-1 text-[12px] font-bold mt-1 text-[#847663]">
            <span>{isConnected ? `${metricas.visitasPerfil} visitas` : 'Sem dados'}</span>
          </div>
        </div>
      </div>

      {/* 📊 LINHA 2: EVOLUÇÃO DIÁRIA DE ALCANCE + DESEMPENHO POR FORMATO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* GRÁFICO: ALCANCE DIÁRIO NO INSTAGRAM (2 COLUNAS) */}
        <div className="lg:col-span-2 bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <InstagramIcon className="w-4 h-4 text-[#B89455]" />
              <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
                Evolução Diária de Alcance (Contas Alcançadas)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[12.5px] font-mono text-[#847663]">
              {isConnected && timelineAlcance.length > 0 ? (
                <span>Pico: {maxAlcance.toLocaleString('pt-BR')} contas</span>
              ) : (
                <span>Sem histórico</span>
              )}
            </div>
          </div>

          {/* Área do Gráfico */}
          {timelineAlcance.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center border-b border-[#EEE7DC] text-[#847663] text-xs gap-2 py-8">
              <InstagramIcon className="w-8 h-8 text-[#B89455] opacity-40" />
              <span className="font-semibold text-[#1E1A16]">
                {isConnected ? 'Sem histórico de alcance para o período selecionado.' : 'Nenhum dado de alcance disponível.'}
              </span>
              <span className="text-[11px] text-[#847663] text-center max-w-sm">
                {isConnected
                  ? 'Os dados diários de alcance são disponibilizados pela Meta a partir do momento em que a conta recebe novos acessos.'
                  : 'Conecte a conta do Instagram para visualizar o gráfico de evolução de alcance.'}
              </span>
            </div>
          ) : (
            <div className="h-52 flex items-end justify-between gap-1.5 pt-6 pb-2 border-b border-[#EEE7DC]">
              {timelineAlcance.map((d, index) => {
                const heightPercent = maxAlcance > 0 ? Math.max((d.alcance / maxAlcance) * 100, 8) : 8;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <span className="text-[11px] font-bold mb-1 transition-opacity text-[#847663] opacity-0 group-hover:opacity-100">
                      {d.alcance >= 1000 ? `${(d.alcance / 1000).toFixed(1)}k` : d.alcance}
                    </span>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full rounded-t-md transition-all bg-[#B89455] hover:bg-[#8A6828]"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between text-[11px] text-[#847663] font-mono pt-2">
            {timelineAlcance.length > 0 ? (
              timelineAlcance.map((d, index) => (
                <span key={index} className="truncate max-w-[32px] text-center">
                  {d.dia}
                </span>
              ))
            ) : (
              <span className="text-center w-full text-xs text-[#847663] italic py-1">—</span>
            )}
          </div>
        </div>

        {/* GRÁFICO EM PIZZA / DONUT: DIVISÃO DE ALCANCE POR FORMATO */}
        <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
              Distribuição por Formato
            </h3>
            <span className="text-[12px] text-[#8A6828] font-bold">{isConnected ? 'Mídias Ativas' : 'Desconectado'}</span>
          </div>

          {/* Gráfico Donut / Pizza em SVG */}
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Fundo do Donut */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#EEE7DC"
                  strokeWidth="14"
                />
                {isConnected && formatosDesempenho[0]?.porcentagem > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#B89455"
                    strokeWidth="14"
                    strokeDasharray="238.76"
                    strokeDashoffset={238.76 * (1 - formatosDesempenho[0].porcentagem / 100)}
                    className="transition-all hover:opacity-85"
                  />
                )}
              </svg>

              {/* Centro do Donut */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-[#847663] uppercase">
                  {isConnected ? 'Total Mídias' : 'Status'}
                </span>
                <span className="text-base font-black text-[#1E1A16] leading-none mt-0.5">
                  {isConnected ? (realData?.recentMedia?.length ?? 0) : '0'}
                </span>
                <span className="text-[10px] font-bold text-[#8A6828] mt-0.5">
                  {isConnected ? 'Posts' : 'Sem dados'}
                </span>
              </div>
            </div>

            {/* Legenda de Fatias */}
            <div className="space-y-1.5 flex-1">
              {formatosDesempenho.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[12.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: f.cor }} />
                    <span className="font-semibold text-[#1E1A16] truncate max-w-[95px]">{f.formato.split(' ')[0]}</span>
                  </div>
                  <span className="font-bold text-[#1E1A16]">{f.posts} ({f.porcentagem}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#EEE7DC] text-[12.5px] text-[#625746] bg-[#FAF6F0] p-2 rounded-lg flex items-center justify-between">
            <span>Formato com maior frequência:</span>
            <strong className="text-[#8A6828] font-bold">{isConnected ? (formatosDesempenho[0]?.formato || '—') : '—'}</strong>
          </div>
        </div>
      </div>

      {/* 🚀 LINHA 3: HEATMAP DO ANO INTEIRO */}
      <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEE7DC] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#B89455]" />
              Frequência de Postagens 2026 (Ano Inteiro)
            </h3>
            <p className="text-xs text-[#625746] mt-0.5">
              {isConnected ? (
                <>
                  <strong className="text-[#1E1A16]">{yearHeatmap.totalPostsYear} publicações</strong> registradas no perfil
                </>
              ) : (
                'Nenhuma conta conectada • Conecte o Instagram para sincronizar o calendário de postagens.'
              )}
            </p>
          </div>

          {/* Cards Rápidos de Streaks em visual Vivox */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-[#FAF2E4] border border-[#E8D4B4] px-2.5 py-1 rounded-lg">
              <Flame className="w-3.5 h-3.5 text-[#B83B32] fill-current" />
              <span className="text-[#847663] text-[12.5px]">Status:</span>
              <strong className="text-[#8A6828]">{isConnected ? 'Conectado' : 'Desconectado'}</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FAF2E4] border border-[#E8D4B4] px-2.5 py-1 rounded-lg">
              <Trophy className="w-3.5 h-3.5 text-[#8A6828]" />
              <span className="text-[#847663] text-[12.5px]">Posts:</span>
              <strong className="text-[#8A6828]">{yearHeatmap.totalPostsYear}</strong>
            </div>
          </div>
        </div>

        {/* CONTAINER DO GRID COMPACTO DE 53 SEMANAS DO ANO INTEIRO */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[760px] max-w-full">
            {/* RÓTULOS DOS MESES (Jan a Dez) */}
            <div className="flex text-[12px] font-semibold text-[#847663] pl-7 pb-1.5 justify-between">
              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => (
                <span key={i} className="w-[8%] text-left">
                  {m}
                </span>
              ))}
            </div>

            {/* GRID DOS QUADRADINHOS */}
            <div className="flex gap-[3px] items-start">
              <div className="flex flex-col gap-[3px] text-[10px] font-bold text-[#847663] pr-1.5 w-6 shrink-0 select-none">
                <span className="h-[10px] flex items-center leading-none">Dom</span>
                <span className="h-[10px] flex items-center leading-none">Seg</span>
                <span className="h-[10px] flex items-center leading-none">Ter</span>
                <span className="h-[10px] flex items-center leading-none">Qua</span>
                <span className="h-[10px] flex items-center leading-none">Qui</span>
                <span className="h-[10px] flex items-center leading-none">Sex</span>
                <span className="h-[10px] flex items-center leading-none">Sáb</span>
              </div>

              <div className="flex gap-[3px] flex-1">
                {yearHeatmap.weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px] hover:z-50">
                    {week.map((day, dIdx) => {
                      if (!day) return null;

                      const isTopRow = dIdx <= 2;
                      const isFirstCols = wIdx <= 2;
                      const isLastCols = wIdx >= 50;

                      let horizontalPos = 'left-1/2 -translate-x-1/2';
                      if (isFirstCols) horizontalPos = 'left-0 translate-x-0';
                      if (isLastCols) horizontalPos = 'right-0 translate-x-0';

                      return (
                        <div
                          key={dIdx}
                          onClick={() => setSelectedDay(day)}
                          className={`w-[10px] h-[10px] rounded-[2px] border transition-transform cursor-pointer relative group hover:z-50 ${getVivoxLevelColor(
                            day.level,
                            day.isFuture
                          )} ${
                            selectedDay?.dataStr === day.dataStr
                              ? 'ring-2 ring-[#B89455] scale-125 z-20'
                              : 'hover:scale-125'
                          }`}
                        >
                          <div
                            className={`absolute ${
                              isTopRow ? 'top-full mt-2' : 'bottom-full mb-2'
                            } ${horizontalPos} hidden group-hover:flex flex-col z-[100] pointer-events-none drop-shadow-2xl`}
                          >
                            <div className="bg-[#14120E] text-[#FAF7F2] text-[12px] py-1.5 px-2.5 rounded-md shadow-2xl whitespace-nowrap border border-[#2B261F]">
                              <strong className="text-[#C7A15F] block">{day.dataLabel}</strong>
                              <span className="text-[#FAF7F2]">{day.detalhes}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* RODAPÉ */}
            <div className="flex items-center justify-between text-[12.5px] text-[#847663] pt-3 mt-2 border-t border-[#EEE7DC]">
              <span>Legenda de Frequência de Postagens</span>

              <div className="flex items-center gap-1.5 text-[12px]">
                <span>Menos</span>
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#EEE7DC] border border-[#E2D8C9]" title="0 posts" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#D8CBB8] border border-[#C5B5A0]" title="1 post" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#C7A15F] border border-[#B89455]" title="2 posts" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#8A6828] border border-[#6E5018]" title="3 posts" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#5C4418] border border-[#3D2D10]" title="4+ posts" />
                <span>Mais</span>
              </div>
            </div>

            {selectedDay && (
              <div className="mt-3 bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E5D9C8] flex items-center justify-between text-xs text-[#1E1A16]">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#B89455]" />
                  {selectedDay.dataLabel}: <strong className="text-[#8A6828]">{selectedDay.detalhes}</strong>
                </span>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-[12px] text-[#847663] hover:text-[#1E1A16] font-semibold cursor-pointer"
                >
                  [fechar]
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LINHA 4: PUBLICAÇÕES DO INSTAGRAM */}
      <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEE7DC] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B89455]" />
              Publicações Recentes do Instagram
            </h3>
            <p className="text-xs text-[#625746] mt-0.5">
              {isConnected
                ? 'Publicações sincronizadas em tempo real com curtidas e comentários atualizados.'
                : 'Conecte a conta do Instagram para visualizar as publicações deste cliente.'}
            </p>
          </div>

          {/* Filtro de Formato */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#FAF7F2] p-1 rounded-lg border border-[#D8CBB8]">
            {['TODOS', 'REELS', 'CARROSSEL', 'POST'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1 rounded-md text-[12px] font-bold transition-colors cursor-pointer ${
                  filtroTipo === tipo
                    ? 'bg-[#B89455] text-[#1D160B] shadow-2xs'
                    : 'text-[#625746] hover:text-[#1E1A16]'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        {/* GRID DE CARDS DAS PUBLICAÇÕES OU EMPTY STATE */}
        {publicacoesFiltradas.length === 0 ? (
          <div className="py-12 px-4 rounded-xl border border-dashed border-[#D8CBB8] bg-[#FAF7F2] text-center space-y-2">
            <InstagramIcon className="w-8 h-8 text-[#8A6828] mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-[#1E1A16]">Nenhuma publicação disponível</h4>
            <p className="text-xs text-[#625746] max-w-md mx-auto">
              {isConnected
                ? 'Não foram encontradas publicações recentes retornadas pela Meta para esta conta.'
                : 'Conecte a conta do Instagram deste cliente para visualizar o ranking de posts, curtidas e comentários.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicacoesFiltradas.map((post, idx) => (
              <div
                key={post.id}
                className="bg-[#FAF7F2] rounded-[11px] border border-[#E5D9C8] overflow-hidden flex flex-col justify-between gap-3 hover:border-[#B89455] hover:shadow-xs transition-all group"
              >
                {post.mediaUrl && (
                  <div className="relative w-full aspect-square bg-[#EEE7DC] overflow-hidden">
                    <img
                      src={post.mediaUrl}
                      alt={post.titulo}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                      }}
                    />
                    {post.tipo === 'REELS' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-current" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className={`space-y-2 px-4 ${post.mediaUrl ? 'pt-3' : 'pt-4'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4] text-[12px] font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#14120E] text-[#C7A15F] flex items-center gap-1">
                        {post.tipo === 'REELS' ? (
                          <Play className="w-2.5 h-2.5 fill-current" />
                        ) : post.tipo === 'CARROSSEL' ? (
                          <Layers className="w-2.5 h-2.5" />
                        ) : (
                          <ImageIcon className="w-2.5 h-2.5" />
                        )}
                        {post.tipo}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#847663] font-mono">{post.data}</span>
                  </div>

                  {post.destaque && (
                    <span className="inline-block text-[12px] font-bold text-[#8A6828] bg-[#FAF2E4] border border-[#E8D4B4] px-2.5 py-0.5 rounded">
                      {post.destaque}
                    </span>
                  )}

                  <h4 className="font-bold text-xs text-[#1E1A16] group-hover:text-[#8A6828] transition-colors leading-snug line-clamp-2">
                    {post.titulo}
                  </h4>
                </div>

                <div className="space-y-2 pt-2 pb-4 px-4 border-t border-[#E5D9C8]">
                  <div className="flex items-center justify-between text-[12px] text-[#625746] pt-1">
                    <span className="flex items-center gap-1 font-semibold" title="Curtidas">
                      <Heart className="w-3.5 h-3.5 text-[#B83B32] fill-current" /> {post.curtidas.toLocaleString('pt-BR')} curtidas
                    </span>
                    <span className="flex items-center gap-1 font-semibold" title="Comentários">
                      <MessageCircle className="w-3.5 h-3.5 text-[#3b82f6]" /> {post.comentarios.toLocaleString('pt-BR')} comentários
                    </span>
                  </div>

                  {post.permalink && (
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#8A6828] hover:underline flex items-center gap-1 pt-1 justify-end font-semibold"
                    >
                      Ver no Instagram <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
