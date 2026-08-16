import { useState, useMemo } from 'react';
import type { Cliente } from '../../types';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Calendar,
  Clock,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface Props {
  cliente: Cliente;
}

export function ClientPerformanceDashboard({ cliente }: Props) {
  const [periodo, setPeriodo] = useState<string>('30d');
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 400);
  };

  // Métricas do Site & Landing Pages (MTD)
  const metricas = useMemo(() => {
    return {
      visualizacoes: 3451,
      varVisualizacoes: -15.5,
      sessoes: 2573,
      varSessoes: +7.6,
      usuarios: 2318,
      varUsuarios: +5.1,
      sessoesPorUsuario: 1.12,
      varSessoesPorUsuario: +3.7,
      duracaoMedia: '00:01:14',
      varDuracaoMedia: +23.5,
      taxaRejeicao: 63.78,
      varTaxaRejeicao: +8.7,
      taxaEngajamento: 36.22,
      varTaxaEngajamento: -12.3,
    };
  }, [periodo, cliente.id]);

  // Visitas diárias ao Site / LPs
  const timelineData = useMemo(() => [
    { dia: '01/ago', visitas: 82 },
    { dia: '03/ago', visitas: 102 },
    { dia: '05/ago', visitas: 45 },
    { dia: '07/ago', visitas: 189 },
    { dia: '09/ago', visitas: 97 },
    { dia: '11/ago', visitas: 21 },
    { dia: '13/ago', visitas: 18 },
    { dia: '15/ago', visitas: 209 },
    { dia: '17/ago', visitas: 195 },
    { dia: '19/ago', visitas: 68 },
    { dia: '21/ago', visitas: 55 },
    { dia: '23/ago', visitas: 336 },
    { dia: '25/ago', visitas: 86 },
    { dia: '27/ago', visitas: 24 },
    { dia: '29/ago', visitas: 295 },
    { dia: '31/ago', visitas: 60 },
  ], [periodo, cliente.id]);

  const maxVisitas = Math.max(...timelineData.map((d) => d.visitas));

  // Canais de Origem do Tráfego para o Site
  const canaisOrigem = [
    { canal: 'Google Search (Orgânico / SEO)', porcentagem: 40.2, cor: '#B89455', sessoes: 1034 },
    { canal: 'Acesso Direto (Site / LP)', porcentagem: 32.5, cor: '#8A6828', sessoes: 836 },
    { canal: 'Redes Sociais (Link na Bio / Reels)', porcentagem: 17.6, cor: '#D8CBB8', sessoes: 452 },
    { canal: 'Tráfego Pago (Meta / Google Ads)', porcentagem: 6.8, cor: '#4A4032', sessoes: 175 },
    { canal: 'Indicações / WhatsApp', porcentagem: 2.9, cor: '#247A4A', sessoes: 76 },
  ];

  // Páginas e Landing Pages Mais Acessadas
  const paginasAcessadas = [
    { caminho: '/', visualizacoes: 1106, sessoes: 1021, usuarios: 930, duracao: '00:00:49', taxaRejeicao: '42%' },
    { caminho: '/lp-captura-leads', visualizacoes: 412, sessoes: 407, usuarios: 370, duracao: '00:00:47', taxaRejeicao: '28%' },
    { caminho: '/sobre-nos', visualizacoes: 379, sessoes: 233, usuarios: 217, duracao: '00:00:32', taxaRejeicao: '55%' },
    { caminho: '/tratamentos-especiais', visualizacoes: 329, sessoes: 329, usuarios: 319, duracao: '00:00:24', taxaRejeicao: '36%' },
    { caminho: '/blog/artigo-principal', visualizacoes: 189, sessoes: 171, usuarios: 143, duracao: '00:01:49', taxaRejeicao: '61%' },
    { caminho: '/contato-agendamento', visualizacoes: 168, sessoes: 142, usuarios: 118, duracao: '00:00:46', taxaRejeicao: '19%' },
  ];

  // Eventos & Conversões de Leads no Site
  const eventosConversao = [
    { nome: 'page_view', total: 2315, max: 2500, desc: 'Visualizações de Página' },
    { nome: 'session_start', total: 2308, max: 2500, desc: 'Sessões Iniciadas' },
    { nome: 'first_visit', total: 2274, max: 2500, desc: 'Novos Visitantes' },
    { nome: 'user_engagement', total: 703, max: 2500, desc: 'Sessões com Engajamento (>10s)' },
    { nome: 'clique_whatsapp_lead', total: 337, max: 2500, desc: 'Cliques no Botão de WhatsApp' },
    { nome: 'lp_formulario_enviado', total: 251, max: 2500, desc: 'Formulários de Lead Enviados' },
    { nome: 'scroll_90', total: 237, max: 2500, desc: 'Leitura Completa da Página' },
    { nome: 'fale_conosco_clique', total: 102, max: 2500, desc: 'Contatos Telefônicos' },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* CABEÇALHO DO RELATÓRIO DE ACESSOS AO SITE/LP (STICKY) */}
      <div className="sticky top-2 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14120E]/95 backdrop-blur-md text-[#F6F0E7] p-5 rounded-[11px] border border-[#2B261F] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C7A15F] animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C7A15F]">
              Tráfego & Landing Pages • {cliente.nomeFantasia}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#FAF7F2] mt-0.5 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#C7A15F]" />
            VISITANTES SITE & LANDING PAGES — MTD
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

      {/* LINHA 1: KPIS DO SITE / LP (MTD COM % DE VARIAÇÃO) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Visualizações */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Visualizações</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {metricas.visualizacoes.toLocaleString('pt-BR')}
          </h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#B83B32]">
            <TrendingDown className="w-3 h-3" />
            <span>{metricas.varVisualizacoes}%</span>
          </div>
        </div>

        {/* Sessões */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Sessões de Acesso</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {metricas.sessoes.toLocaleString('pt-BR')}
          </h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#247A4A]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.varSessoes}%</span>
          </div>
        </div>

        {/* Total Usuários */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Usuários Únicos</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">
            {metricas.usuarios.toLocaleString('pt-BR')}
          </h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#247A4A]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.varUsuarios}%</span>
          </div>
        </div>

        {/* Sessões por Usuário */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Sessões/Usuário</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">{metricas.sessoesPorUsuario}</h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#247A4A]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.varSessoesPorUsuario}%</span>
          </div>
        </div>

        {/* Duração Média */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Duração Média</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">{metricas.duracaoMedia}</h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#247A4A]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.varDuracaoMedia}%</span>
          </div>
        </div>

        {/* Taxa de Rejeição */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Taxa Rejeição</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">{metricas.taxaRejeicao}%</h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#B83B32]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metricas.varTaxaRejeicao}%</span>
          </div>
        </div>

        {/* Taxa de Engajamento */}
        <div className="bg-[#FFFDF8] p-3.5 rounded-[11px] border border-[#D8CBB8] shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#847663]">Engajamento</span>
          <h3 className="text-xl font-black text-[#1E1A16] mt-2">{metricas.taxaEngajamento}%</h3>
          <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-[#B83B32]">
            <TrendingDown className="w-3 h-3" />
            <span>{metricas.varTaxaEngajamento}%</span>
          </div>
        </div>
      </div>

      {/* LINHA 2: GRÁFICO VISITAS POR DIA + CANAIS DE ORIGEM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* GRÁFICO: VISITAS POR DIA (2 COLUNAS) */}
        <div className="lg:col-span-2 bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#B89455]" />
              <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
                Visitas por Dia no Site / LPs
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#847663]">Picos: até {maxVisitas} visitas</span>
          </div>

          {/* Área do Gráfico */}
          <div className="h-52 flex items-end justify-between gap-1.5 pt-6 pb-2 border-b border-[#EEE7DC]">
            {timelineData.map((d, index) => {
              const heightPercent = Math.max((d.visitas / maxVisitas) * 100, 6);
              const isPico = d.visitas >= 180;

              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip com valor */}
                  <span
                    className={`text-[9px] font-bold mb-1 transition-opacity ${
                      isPico
                        ? 'text-[#8A6828] opacity-100'
                        : 'text-[#847663] opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {d.visitas}
                  </span>

                  {/* Barra com degradê dourado Vivox */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      isPico
                        ? 'bg-gradient-to-t from-[#B89455] to-[#D8CBB8] shadow-xs'
                        : 'bg-[#EEE7DC] group-hover:bg-[#B89455]/70'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Rótulos dos dias */}
          <div className="flex justify-between text-[9px] text-[#847663] font-mono pt-2">
            {timelineData.map((d, index) => (
              <span key={index} className="truncate max-w-[32px] text-center">
                {d.dia}
              </span>
            ))}
          </div>
        </div>

        {/* GRÁFICO: CANAIS DE ORIGEM DO TRÁFEGO */}
        <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
              Canais de Origem (Tráfego)
            </h3>
            <span className="text-[10px] text-[#8A6828] font-bold">100% Rastreado</span>
          </div>

          {/* Barra de Distribuição Visual */}
          <div className="h-4 w-full rounded-full overflow-hidden flex shadow-2xs mb-4">
            {canaisOrigem.map((c, i) => (
              <div
                key={i}
                style={{ width: `${c.porcentagem}%`, backgroundColor: c.cor }}
                title={`${c.canal}: ${c.porcentagem}%`}
              />
            ))}
          </div>

          {/* Lista de Canais com Porcentagens */}
          <div className="space-y-2">
            {canaisOrigem.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                  <span className="text-[#1E1A16] font-medium text-[11px]">{c.canal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#847663] font-mono">{c.sessoes}</span>
                  <span className="font-bold text-[#1E1A16] text-[11px] w-12 text-right">
                    {c.porcentagem}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LINHA 3: PÁGINAS & LANDING PAGES MAIS ACESSADAS + EVENTOS DE CONVERSÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PÁGINAS ACESSADAS (2 COLUNAS) */}
        <div className="lg:col-span-2 bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#B89455]" />
              <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
                Páginas & Landing Pages Mais Acessadas
              </h3>
            </div>
            <span className="text-[11px] text-[#847663]">Ranking por Visualizações</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF7F2] text-[#625746] border-b border-[#D8CBB8]">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Caminho da Página</th>
                  <th className="py-2.5 px-3 text-right font-bold">Visualizações</th>
                  <th className="py-2.5 px-3 text-right font-bold">Sessões</th>
                  <th className="py-2.5 px-3 text-right font-bold">Usuários</th>
                  <th className="py-2.5 px-3 text-right font-bold">Duração Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE7DC]">
                {paginasAcessadas.map((p, i) => (
                  <tr key={i} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-[#8A6828] truncate max-w-[200px]">
                      {p.caminho}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-[#1E1A16]">
                      {p.visualizacoes.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 text-right text-[#625746]">
                      {p.sessoes.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 text-right text-[#625746]">
                      {p.usuarios.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[11px] text-[#1E1A16]">
                      {p.duracao}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EVENTOS & CONVERSÕES DE LEADS */}
        <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#247A4A]" />
              Eventos & Leads (Conversões)
            </h3>
            <span className="text-[10px] text-[#247A4A] font-bold">Metas do Site</span>
          </div>

          <div className="space-y-2">
            {eventosConversao.map((ev, i) => {
              const widthPct = Math.min((ev.total / ev.max) * 100, 100);
              const isLead = ev.nome.includes('whatsapp') || ev.nome.includes('formulario');

              return (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-mono text-[10px] ${isLead ? 'text-[#247A4A] font-bold' : 'text-[#1E1A16]'}`} title={ev.desc}>
                      {ev.nome}
                    </span>
                    <span className="font-bold text-[#1E1A16] text-[10px]">{ev.total}</span>
                  </div>

                  <div className="w-full bg-[#EEE7DC] h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className={`h-full rounded-full transition-all ${
                        isLead ? 'bg-[#247A4A]' : 'bg-[#B89455]'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
