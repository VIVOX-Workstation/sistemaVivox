import { useState, useMemo } from 'react';
import type { Cliente } from '../../types';
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

// Estrutura de dia para o Heatmap de 53 semanas (Ano Inteiro)
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

export function InstagramPerformanceDashboard({ cliente }: Props) {
  const [periodo, setPeriodo] = useState<string>('30d');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<YearDay | null>(null);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 400);
  };

  // Métricas Consolidadas do Instagram (MTD)
  const metricas = useMemo(() => {
    return {
      seguidores: 24890,
      novosSeguidores: 1045,
      varSeguidores: +4.2,
      alcance: 68420,
      varAlcance: +18.7,
      impressoes: 142300,
      varImpressoes: +12.4,
      interacoes: 6840,
      varInteracoes: +9.3,
      taxaEngajamento: 4.82,
      varTaxaEngajamento: +0.6,
      cliquesBio: 428,
      varCliquesBio: +15.1,
      visitasPerfil: 3890,
      varVisitasPerfil: +8.9,
    };
  }, [periodo, cliente.id]);

  // Evolução Diária de Alcance no Instagram (MTD)
  const timelineAlcance = useMemo(() => [
    { dia: '01/ago', alcance: 1420, reels: false },
    { dia: '03/ago', alcance: 2150, reels: false },
    { dia: '05/ago', alcance: 1200, reels: false },
    { dia: '07/ago', alcance: 4890, reels: true },
    { dia: '09/ago', alcance: 2840, reels: false },
    { dia: '11/ago', alcance: 1650, reels: false },
    { dia: '13/ago', alcance: 1890, reels: false },
    { dia: '15/ago', alcance: 6420, reels: true },
    { dia: '17/ago', alcance: 5120, reels: true },
    { dia: '19/ago', alcance: 2310, reels: false },
    { dia: '21/ago', alcance: 7890, reels: true },
    { dia: '23/ago', alcance: 9450, reels: true },
    { dia: '25/ago', alcance: 3120, reels: false },
    { dia: '27/ago', alcance: 8920, reels: true },
    { dia: '29/ago', alcance: 6140, reels: true },
    { dia: '31/ago', alcance: 3010, reels: false },
  ], [periodo, cliente.id]);

  const maxAlcance = Math.max(...timelineAlcance.map((d) => d.alcance));

  // Desempenho por Formato de Publicação
  const formatosDesempenho = [
    { formato: 'Reels (Vídeos Curtos)', porcentagem: 58.4, engajamentoMedio: '6.8%', posts: 8, cor: '#B89455' },
    { formato: 'Carrosséis Educativos', porcentagem: 27.2, engajamentoMedio: '5.2%', posts: 6, cor: '#8A6828' },
    { formato: 'Stories & Bastidores', porcentagem: 9.8, engajamentoMedio: '3.9%', posts: 42, cor: '#D8CBB8' },
    { formato: 'Posts Estáticos', porcentagem: 4.6, engajamentoMedio: '2.1%', posts: 4, cor: '#4A4032' },
  ];

  // 🚀 GERAÇÃO DO ANO INTEIRO (53 SEMANAS = JAN A DEZ) DESIGN SYSTEM VIVOX
  const yearHeatmap = useMemo(() => {
    const year = 2026;
    const today = new Date(2026, 7, 31); // 31 de Agosto de 2026
    
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
        let detalhes = 'Nenhuma publicação neste dia';
        let level: 0 | 1 | 2 | 3 | 4 = 0;

        if (isCurrentYear && !isFuture) {
          const seed = (dateObj.getDate() * 17 + dateObj.getMonth() * 11 + diaSemana * 7) % 100;
          
          if (diaSemana === 1 || diaSemana === 2 || diaSemana === 4 || diaSemana === 5) {
            if (seed > 75) {
              postsCount = 4;
              level = 4;
              detalhes = '4 publicações (Reels, Carrossel & Stories)';
            } else if (seed > 45) {
              postsCount = 3;
              level = 3;
              detalhes = '3 publicações (1 Reels, 2 Stories)';
            } else if (seed > 18) {
              postsCount = 2;
              level = 2;
              detalhes = '2 publicações (1 Feed/Carrossel, Stories)';
            } else if (seed > 6) {
              postsCount = 1;
              level = 1;
              detalhes = '1 publicação (Feed / Reel)';
            }
          } else if (diaSemana === 0) {
            if (seed > 50) {
              postsCount = 2;
              level = 2;
              detalhes = '2 publicações (Dica & Stories)';
            } else if (seed > 20) {
              postsCount = 1;
              level = 1;
              detalhes = '1 publicação (Stories)';
            }
          } else {
            if (seed > 65) {
              postsCount = 1;
              level = 1;
              detalhes = '1 publicação (Stories / Dica)';
            }
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
      totalPostsYear,
      daysWithPosts,
      currentStreak: 14,
      longestStreak: 38,
      taxaConsistencia: 82,
    };
  }, []);

  // Melhores Publicações do Instagram (O que deu mais certo?)
  const publicacoes = [
    {
      id: '1',
      tipo: 'REELS',
      titulo: `Bastidores ${cliente.nomeFantasia}: Como é feito nosso atendimento de excelência`,
      data: '14 de Ago • 19:30',
      alcance: 24800,
      visualizacoesVideo: 36200,
      curtidas: 1840,
      comentarios: 245,
      compartilhamentos: 412,
      salvos: 629,
      taxaEngajamento: 12.6,
      destaque: '🔥 Maior Alcance Orgânico',
      tema: 'Bastidores & Autoridade',
    },
    {
      id: '2',
      tipo: 'CARROSSEL',
      titulo: `3 Mitos comuns no segmento de ${cliente.segmento || 'nossa área'} que você precisa saber`,
      data: '21 de Ago • 18:00',
      alcance: 16400,
      visualizacoesVideo: 0,
      curtidas: 1280,
      comentarios: 132,
      compartilhamentos: 354,
      salvos: 890,
      taxaEngajamento: 16.2,
      destaque: '📌 Mais Salvo do Mês',
      tema: 'Educativo / Quebra de Objeção',
    },
    {
      id: '3',
      tipo: 'REELS',
      titulo: `Antes e Depois real: Caso de sucesso e transformação na ${cliente.nomeFantasia}`,
      data: '27 de Ago • 20:15',
      alcance: 21900,
      visualizacoesVideo: 29400,
      curtidas: 2150,
      comentarios: 310,
      compartilhamentos: 280,
      salvos: 480,
      taxaEngajamento: 14.7,
      destaque: '💬 Maior Conversão no Direct',
      tema: 'Prova Social & Resultado',
    },
    {
      id: '4',
      tipo: 'REELS',
      titulo: `Dica de especialista: 1 minuto que vai mudar seus resultados diários`,
      data: '04 de Ago • 12:30',
      alcance: 18900,
      visualizacoesVideo: 24100,
      curtidas: 1420,
      comentarios: 168,
      compartilhamentos: 230,
      salvos: 540,
      taxaEngajamento: 12.5,
      destaque: '🚀 Alto Compartilhamento',
      tema: 'Dica Prática / Viral',
    },
    {
      id: '5',
      tipo: 'CARROSSEL',
      titulo: `Checklist passo a passo: O que conferir antes de contratar o serviço`,
      data: '11 de Ago • 17:45',
      alcance: 12100,
      visualizacoesVideo: 0,
      curtidas: 840,
      comentarios: 89,
      compartilhamentos: 185,
      salvos: 512,
      taxaEngajamento: 13.4,
      destaque: '🎯 Alta Retenção',
      tema: 'Guia Prático',
    },
    {
      id: '6',
      tipo: 'POST',
      titulo: `Dúvida frequente dos nossos clientes: Como funciona nossa garantia e suporte`,
      data: '08 de Ago • 18:30',
      alcance: 8400,
      visualizacoesVideo: 0,
      curtidas: 620,
      comentarios: 74,
      compartilhamentos: 96,
      salvos: 240,
      taxaEngajamento: 12.3,
      destaque: '💡 Dúvida Frequente',
      tema: 'Informativo',
    },
  ];

  const publicacoesFiltradas = useMemo(() => {
    if (filtroTipo === 'TODOS') return publicacoes;
    return publicacoes.filter((p) => p.tipo === filtroTipo);
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
      {/* CABEÇALHO DO INSTAGRAM DASHBOARD (STICKY) */}
      <div className="sticky top-2 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14120E]/95 backdrop-blur-md text-[#F6F0E7] p-5 rounded-[11px] border border-[#2B261F] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C7A15F] animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C7A15F]">
              Desempenho de Redes Sociais • @{cliente.nomeFantasia.toLowerCase().replace(/\s+/g, '')}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#FAF7F2] mt-0.5 flex items-center gap-2">
            <InstagramIcon className="w-5 h-5 text-[#C7A15F]" />
            INSTAGRAM INSIGHTS & ENGAJAMENTO — MTD
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[#24201A] border border-[#4A4032] text-xs font-semibold text-[#C7A15F] focus:outline-none focus:border-[#C7A15F]"
          >
            <option value="30d">🗓️ 1 de ago. de 2026 - Hoje (MTD)</option>
            <option value="7d">🗓️ Últimos 7 dias</option>
            <option value="last_month">🗓️ Mês Anterior Completo</option>
            <option value="90d">🗓️ Últimos 90 dias</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="h-9 px-3 rounded-lg border border-[#4A4032] bg-[#24201A] hover:bg-[#2F2A22] text-[#F6F0E7] text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
          <span className="text-[11px] font-semibold text-[#847663]">Seguidores</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {metricas.seguidores.toLocaleString('pt-BR')}
          </h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#247A4A]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.novosSeguidores} ({metricas.varSeguidores}%)</span>
          </div>
        </div>

        {/* Alcance de Contas */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Contas Alcançadas</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {metricas.alcance.toLocaleString('pt-BR')}
          </h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#247A4A]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.varAlcance}%</span>
          </div>
        </div>

        {/* Impressões */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Impressões Totais</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {metricas.impressoes.toLocaleString('pt-BR')}
          </h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#247A4A]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.varImpressoes}%</span>
          </div>
        </div>

        {/* Interações */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Interações Totais</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {metricas.interacoes.toLocaleString('pt-BR')}
          </h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#247A4A]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.varInteracoes}%</span>
          </div>
        </div>

        {/* Taxa de Engajamento */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Taxa Engajamento</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">{metricas.taxaEngajamento}%</h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#247A4A]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.varTaxaEngajamento}%</span>
          </div>
        </div>

        {/* Cliques na Bio */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Cliques na Bio</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">{metricas.cliquesBio}</h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#247A4A]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.varCliquesBio}%</span>
          </div>
        </div>

        {/* Visitas ao Perfil */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Visitas ao Perfil</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {metricas.visitasPerfil.toLocaleString('pt-BR')}
          </h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#247A4A]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.varVisitasPerfil}%</span>
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
            <div className="flex items-center gap-3 text-[11px] font-mono text-[#847663]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#B89455]"></span> Dia com Reels
              </span>
              <span>Pico: {maxAlcance.toLocaleString('pt-BR')} contas</span>
            </div>
          </div>

          {/* Área do Gráfico */}
          <div className="h-52 flex items-end justify-between gap-1.5 pt-6 pb-2 border-b border-[#EEE7DC]">
            {timelineAlcance.map((d, index) => {
              const heightPercent = Math.max((d.alcance / maxAlcance) * 100, 8);

              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <span
                    className={`text-[9px] font-bold mb-1 transition-opacity ${
                      d.reels ? 'text-[#8A6828] opacity-100' : 'text-[#847663] opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {d.alcance >= 1000 ? `${(d.alcance / 1000).toFixed(1)}k` : d.alcance}
                  </span>

                  {/* Barra com degradê dourado para dias de Reels */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      d.reels
                        ? 'bg-gradient-to-t from-[#B89455] to-[#D8CBB8] shadow-xs'
                        : 'bg-[#EEE7DC] group-hover:bg-[#B89455]/70'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[9px] text-[#847663] font-mono pt-2">
            {timelineAlcance.map((d, index) => (
              <span key={index} className="truncate max-w-[32px] text-center">
                {d.dia}
              </span>
            ))}
          </div>
        </div>

        {/* DIVISÃO DE FORMATOS (QUAL FORMATO DEU MAIS CERTO?) */}
        <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
              Desempenho por Formato
            </h3>
            <span className="text-[10px] text-[#8A6828] font-bold">Taxa Média</span>
          </div>

          <div className="space-y-3">
            {formatosDesempenho.map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1E1A16] text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.cor }} />
                    {f.formato}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#847663]">{f.posts} posts</span>
                    <span className="font-bold text-[#247A4A] text-[11px]">{f.engajamentoMedio}</span>
                  </div>
                </div>

                <div className="w-full bg-[#EEE7DC] h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${f.porcentagem}%`, backgroundColor: f.cor }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#EEE7DC] text-[11px] text-[#625746] bg-[#FAF6F0] p-2.5 rounded-lg">
            💡 <strong className="text-[#1E1A16]">Insight:</strong> Reels representam 58% do alcance do mês e geram 3x mais seguidores novos.
          </div>
        </div>
      </div>

      {/* 🚀 LINHA 3: HEATMAP DO ANO INTEIRO (ESTILO GITHUB NO DESIGN SYSTEM VIVOX) */}
      <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEE7DC] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#B89455]" />
              Frequência de Postagens 2026 (Ano Inteiro)
            </h3>
            <p className="text-xs text-[#625746] mt-0.5">
              <strong className="text-[#1E1A16]">{yearHeatmap.totalPostsYear} publicações</strong> realizadas em 2026 • Sequência recorde de <strong className="text-[#8A6828]">{yearHeatmap.longestStreak} dias consecutivos</strong>
            </p>
          </div>

          {/* Cards Rápidos de Streaks em visual Vivox */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-[#FAF2E4] border border-[#E8D4B4] px-2.5 py-1 rounded-lg">
              <Flame className="w-3.5 h-3.5 text-[#B83B32] fill-current" />
              <span className="text-[#847663] text-[11px]">Atual:</span>
              <strong className="text-[#8A6828]">{yearHeatmap.currentStreak} dias</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FAF2E4] border border-[#E8D4B4] px-2.5 py-1 rounded-lg">
              <Trophy className="w-3.5 h-3.5 text-[#8A6828]" />
              <span className="text-[#847663] text-[11px]">Recorde:</span>
              <strong className="text-[#8A6828]">{yearHeatmap.longestStreak} dias</strong>
            </div>
          </div>
        </div>

        {/* CONTAINER DO GRID COMPACTO DE 53 SEMANAS DO ANO INTEIRO */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[760px] max-w-full">
            {/* RÓTULOS DOS MESES (Jan a Dez) */}
            <div className="flex text-[10px] font-semibold text-[#847663] pl-7 pb-1.5 justify-between">
              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => (
                <span key={i} className="w-[8%] text-left">
                  {m}
                </span>
              ))}
            </div>

            {/* GRID DOS QUADRADINHOS ESTILO GITHUB COM PALETA VIVOX */}
            <div className="flex gap-[3px] items-start">
              {/* Todos os 7 dias da semana: Dom, Seg, Ter, Qua, Qui, Sex, Sáb */}
              <div className="flex flex-col gap-[3px] text-[8px] font-bold text-[#847663] pr-1.5 w-6 shrink-0 select-none">
                <span className="h-[10px] flex items-center leading-none">Dom</span>
                <span className="h-[10px] flex items-center leading-none">Seg</span>
                <span className="h-[10px] flex items-center leading-none">Ter</span>
                <span className="h-[10px] flex items-center leading-none">Qua</span>
                <span className="h-[10px] flex items-center leading-none">Qui</span>
                <span className="h-[10px] flex items-center leading-none">Sex</span>
                <span className="h-[10px] flex items-center leading-none">Sáb</span>
              </div>

              {/* 53 Colunas de Semanas */}
              <div className="flex gap-[3px] flex-1">
                {yearHeatmap.weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dIdx) => {
                      if (!day) return null;

                      return (
                        <div
                          key={dIdx}
                          onClick={() => setSelectedDay(day)}
                          className={`w-[10px] h-[10px] rounded-[2px] border transition-transform cursor-pointer relative group ${getVivoxLevelColor(
                            day.level,
                            day.isFuture
                          )} ${
                            selectedDay?.dataStr === day.dataStr
                              ? 'ring-2 ring-[#B89455] scale-125 z-10'
                              : 'hover:scale-125'
                          }`}
                        >
                          {/* Tooltip Hover no estilo Vivox */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none">
                            <div className="bg-[#14120E] text-[#FAF7F2] text-[10px] py-1 px-2 rounded-md shadow-2xl whitespace-nowrap border border-[#2B261F]">
                              <strong className="text-[#C7A15F] block">{day.dataLabel}</strong>
                              <span>{day.detalhes}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* RODAPÉ: "Saiba como contabilizamos as publicações" + LEGENDA "Menos [ ▢ ▢ ▢ ▢ ▢ ] Mais" */}
            <div className="flex items-center justify-between text-[11px] text-[#847663] pt-3 mt-2 border-t border-[#EEE7DC]">
              <span className="hover:text-[#8A6828] cursor-pointer transition-colors">
                Saiba como contabilizamos as postagens
              </span>

              <div className="flex items-center gap-1.5 text-[10px]">
                <span>Menos</span>
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#EEE7DC] border border-[#E2D8C9]" title="0 posts" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#D8CBB8] border border-[#C5B5A0]" title="1 post" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#C7A15F] border border-[#B89455]" title="2 posts" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#8A6828] border border-[#6E5018]" title="3 posts" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#5C4418] border border-[#3D2D10]" title="4+ posts" />
                <span>Mais</span>
              </div>
            </div>

            {/* Detalhe do Dia Clicado */}
            {selectedDay && (
              <div className="mt-3 bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E5D9C8] flex items-center justify-between text-xs text-[#1E1A16]">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#B89455]" />
                  {selectedDay.dataLabel}: <strong className="text-[#8A6828]">{selectedDay.detalhes}</strong>
                </span>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-[10px] text-[#847663] hover:text-[#1E1A16] font-semibold"
                >
                  [fechar]
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LINHA 4: TOP PUBLICAÇÕES DO INSTAGRAM (O QUE DEU MAIS CERTO NO PERFIL) */}
      <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEE7DC] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B89455]" />
              Ranking de Publicações de Maior Sucesso (Qual deu mais certo?)
            </h3>
            <p className="text-xs text-[#625746] mt-0.5">
              Identifique os temas, ganchos e formatos que geraram mais compartilhamentos, salvamentos e conversões no direct.
            </p>
          </div>

          {/* Filtro de Formato */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#FAF7F2] p-1 rounded-lg border border-[#D8CBB8]">
            {['TODOS', 'REELS', 'CARROSSEL', 'POST'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-colors ${
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

        {/* GRID DE CARDS DAS PUBLICAÇÕES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicacoesFiltradas.map((post, idx) => (
            <div
              key={post.id}
              className="bg-[#FAF7F2] rounded-[11px] border border-[#E5D9C8] p-4 flex flex-col justify-between gap-3 hover:border-[#B89455] hover:shadow-xs transition-all group"
            >
              <div className="space-y-2">
                {/* Header do Post com Ranking #1, #2 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4] text-[10px] font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#14120E] text-[#C7A15F] flex items-center gap-1">
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
                  <span className="text-[10px] text-[#847663] font-mono">{post.data}</span>
                </div>

                {/* Badge Destaque */}
                <span className="inline-block text-[10px] font-bold text-[#8A6828] bg-[#FAF2E4] border border-[#E8D4B4] px-2.5 py-0.5 rounded">
                  {post.destaque}
                </span>

                {/* Título / Legenda */}
                <h4 className="font-bold text-xs text-[#1E1A16] group-hover:text-[#8A6828] transition-colors leading-snug">
                  {post.titulo}
                </h4>

                <span className="text-[10px] text-[#625746] font-medium block">
                  Tema: <strong className="text-[#1E1A16]">{post.tema}</strong>
                </span>
              </div>

              {/* Estatísticas Sociais */}
              <div className="space-y-2 pt-2 border-t border-[#E5D9C8]">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#FFFDF8] p-2 rounded-lg border border-[#D8CBB8]">
                    <span className="text-[9px] text-[#847663] block">Contas Alcançadas</span>
                    <span className="font-bold text-[#1E1A16] text-[11px]">
                      {post.alcance.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="bg-[#FFFDF8] p-2 rounded-lg border border-[#D8CBB8]">
                    <span className="text-[9px] text-[#847663] block">Taxa Engajamento</span>
                    <span className="font-bold text-[#247A4A] text-[11px]">{post.taxaEngajamento}%</span>
                  </div>
                </div>

                {/* Interações sociais */}
                <div className="flex items-center justify-between text-[10px] text-[#625746] pt-1 px-1">
                  <span className="flex items-center gap-1" title="Curtidas">
                    <Heart className="w-3 h-3 text-[#B83B32] fill-current" /> {post.curtidas}
                  </span>
                  <span className="flex items-center gap-1" title="Comentários">
                    <MessageCircle className="w-3 h-3 text-[#3b82f6]" /> {post.comentarios}
                  </span>
                  <span className="flex items-center gap-1" title="Compartilhamentos">
                    <Share2 className="w-3 h-3 text-[#247A4A]" /> {post.compartilhamentos}
                  </span>
                  <span className="flex items-center gap-1" title="Salvos">
                    <Bookmark className="w-3 h-3 text-[#8A6828] fill-current" /> {post.salvos}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
