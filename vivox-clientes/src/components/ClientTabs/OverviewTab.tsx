import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cliente, ServicoContratado, Tarefa } from '../../types';
import { api } from '../../api/client';
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Calendar as CalendarIcon, 
  Kanban,
  FileText,
  Layers,
  MoreVertical,
  Info,
  Filter,
  Heart,
  MessageSquare,
  Pin,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';

interface Props {
  cliente: Cliente;
  onChange: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function OverviewTab({ cliente, onChange, onNavigateTab }: Props) {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState<ServicoContratado[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  // Observações rápidas
  const [observacoes, setObservacoes] = useState(cliente.observacoes || '');
  const [salvandoObs, setSalvandoObs] = useState(false);
  const [obsSalva, setObsSalva] = useState(false);

  // Mês para o mini-calendário
  const [mesAtual] = useState(new Date());

  useEffect(() => {
    loadDados();
  }, [cliente.id]);

  const loadDados = async () => {
    setLoading(true);
    try {
      const [resServicos, resTarefas] = await Promise.allSettled([
        api.get(`/servicos/cliente/${cliente.id}`),
        api.get('/tarefas'),
      ]);

      if (resServicos.status === 'fulfilled') {
        setServicos(resServicos.value.data || []);
      }
      if (resTarefas.status === 'fulfilled') {
        const allTasks: any[] = resTarefas.value.data || [];
        const clientTasks = allTasks.filter(
          (t) => t.clienteId === cliente.id || t.projeto?.clienteId === cliente.id
        );
        setTarefas(clientTasks);
      }
    } catch (e) {
      console.warn('Erro ao carregar serviços/tarefas na visão geral:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarObservacoes = async () => {
    setSalvandoObs(true);
    try {
      await api.patch(`/clientes/${cliente.id}`, { observacoes });
      onChange(cliente.id);
      setObsSalva(true);
      setTimeout(() => setObsSalva(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar diretrizes.');
    } finally {
      setSalvandoObs(false);
    }
  };

  // Grid de dias com a paleta nobre do Vivox GP
  const diasDoMes = [
    { dia: 1, color: 'bg-transparent text-[#8F8271]' },
    { dia: 2, color: 'bg-transparent text-[#8F8271]' },
    { dia: 3, color: 'bg-transparent text-[#8F8271]' },
    { dia: 4, color: 'bg-transparent text-[#8F8271]' },
    { dia: 5, color: 'bg-[#B83B32] text-white font-bold shadow-2xs' },
    { dia: 6, color: 'bg-transparent text-[#8F8271]' },
    { dia: 7, color: 'bg-[#181512] text-[#C7A15F] font-bold' },
    { dia: 8, color: 'bg-[#181512] text-[#C7A15F] font-bold' },
    { dia: 9, color: 'bg-transparent text-[#8F8271]' },
    { dia: 10, color: 'bg-[#FAF2E4] text-[#8A6828] font-bold' },
    { dia: 11, color: 'bg-transparent text-[#8F8271]' },
    { dia: 12, color: 'bg-[#C7A15F] text-[#181512] font-black' },
    { dia: 13, color: 'bg-[#FAF2E4] text-[#8A6828]' },
    { dia: 14, color: 'bg-transparent text-[#8F8271]' },
    { dia: 15, color: 'bg-[#E5D9C8] text-[#1E1A16] font-bold' },
    { dia: 16, color: 'bg-[#FAF2E4] text-[#8A6828]' },
    { dia: 17, color: 'bg-[#181512] text-white font-bold' },
    { dia: 18, color: 'bg-[#181512] text-white font-bold' },
    { dia: 19, color: 'bg-[#FAF2E4] text-[#8A6828]' },
    { dia: 20, color: 'bg-[#181512] text-[#C7A15F] font-bold' },
    { dia: 21, color: 'bg-[#FAF2E4] text-[#8A6828]' },
    { dia: 22, color: 'bg-[#FAF2E4] text-[#8A6828]' },
    { dia: 23, color: 'bg-[#247A4A] text-white font-bold' },
    { dia: 24, color: 'bg-[#FAF2E4] text-[#8A6828]' },
    { dia: 25, color: 'bg-[#FAF2E4] text-[#8A6828]' },
    { dia: 26, color: 'bg-[#181512] text-white font-bold' },
    { dia: 27, color: 'bg-[#8A6828] text-white font-bold' },
    { dia: 28, color: 'bg-[#FAF2E4] text-[#8A6828]' },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* ========================================================================= */}
      {/* 1. SEÇÃO ONGOING PROJECTS / SERVIÇOS EM ANDAMENTO (PALETA VIVOX GP)       */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFDF8] rounded-[28px] p-7 shadow-xs space-y-6">
        {/* Top Header: Dark Pill + Ações à Direita */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Botão Pill Dark Dropdown com Dourado Vivox */}
          <div className="inline-flex items-center gap-2 bg-[#181512] text-[#C7A15F] px-5 py-2.5 rounded-full text-xs font-bold shadow-xs">
            <span>Ongoing Projects</span>
            <span className="text-[10px] opacity-80">⌵</span>
          </div>

          {/* Ícones de Ação Redondos à Direita */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigateTab ? onNavigateTab('services') : null}
              title="Adicionar serviço"
              className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#181512] hover:text-[#C7A15F] text-[#625746] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/gp')}
              title="Filtrar demandas no GP"
              className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#181512] hover:text-[#C7A15F] text-[#625746] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
            <button 
              title="Favoritos"
              className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#181512] hover:text-[#C7A15F] text-[#625746] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            >
              <Heart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Grid dos 3 Cards Coloridos Pastel com Cores Vivox GP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Dourado / Âmbar Vivox GP */}
          <div 
            onClick={() => onNavigateTab ? onNavigateTab('services') : null}
            className="bg-[#FAF2E4] rounded-[24px] p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
          >
            <div>
              {/* Linha 1: Data Pill + 3-dots */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold text-[#8A6828] bg-[#FFFDF8]/80 px-3 py-1 rounded-full">
                  {cliente.dataInicioContrato 
                    ? new Date(cliente.dataInicioContrato).toLocaleDateString('pt-BR', { month: 'short', day: '2-digit', year: 'numeric' }) 
                    : 'Contrato Ativo'}
                </span>
                <button className="text-[#8A6828] hover:text-[#181512]">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Linha 2: Título do Serviço */}
              <div className="flex items-center justify-between gap-2 mt-2">
                <h4 className="text-sm font-black text-[#1E1A16] leading-tight">
                  {(servicos[0] as any)?.nomePersonalizado || servicos[0]?.tipoServico?.replace(/_/g, ' ') || 'Planejamento Web & Landing Page'}
                </h4>
                <Info className="w-3.5 h-3.5 text-[#8A6828] shrink-0" />
              </div>

              {/* Linha 3: Fase & Progress Pill */}
              <div className="flex items-center justify-between gap-2 mt-3 text-xs">
                <span className="text-[11px] font-semibold text-[#8A6828]">Fase de Criação</span>
                <span className="text-[10px] font-bold bg-[#FFFDF8]/90 text-[#8A6828] px-2 py-0.5 rounded-full">
                  90% Progress
                </span>
              </div>

              {/* Barra de Progresso em Dourado Vivox */}
              <div className="w-full h-1.5 rounded-full bg-[#FFFDF8]/70 mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-[#C7A15F]" style={{ width: '90%' }} />
              </div>
            </div>

            {/* Linha Inferior: Avatares + Badge de Prazo */}
            <div className="flex items-center justify-between gap-2 pt-4 mt-2">
              <div className="flex items-center -space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#C7A15F] text-[#181512] text-[10px] font-black flex items-center justify-center shadow-2xs">
                  V
                </span>
                <span className="w-6 h-6 rounded-full bg-[#181512] text-[#C7A15F] text-[10px] font-black flex items-center justify-center shadow-2xs">
                  K
                </span>
                <span className="w-6 h-6 rounded-full bg-[#FFFDF8] text-[#8A6828] text-[9px] font-bold flex items-center justify-center shadow-2xs">
                  +
                </span>
              </div>

              <span className="text-[10px] font-bold text-[#8A6828] bg-[#FFFDF8]/90 px-2.5 py-0.5 rounded-full">
                2 Days Left
              </span>
            </div>
          </div>

          {/* Card 2: Oliva / Sálvia Vivox GP */}
          <div 
            onClick={() => onNavigateTab ? onNavigateTab('services') : null}
            className="bg-[#EEF4EE] rounded-[24px] p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
          >
            <div>
              {/* Linha 1: Data Pill + 3-dots */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold text-[#247A4A] bg-[#FFFDF8]/80 px-3 py-1 rounded-full">
                  {cliente.dataInicioContrato 
                    ? new Date(Date.now() + 5 * 86400000).toLocaleDateString('pt-BR', { month: 'short', day: '2-digit', year: 'numeric' }) 
                    : 'Em Produção'}
                </span>
                <button className="text-[#247A4A] hover:text-[#181512]">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Linha 2: Título do Serviço */}
              <div className="flex items-center justify-between gap-2 mt-2">
                <h4 className="text-sm font-black text-[#1E1A16] leading-tight">
                  {(servicos[1] as any)?.nomePersonalizado || servicos[1]?.tipoServico?.replace(/_/g, ' ') || 'Gestão de Tráfego & Meta Ads'}
                </h4>
                <Info className="w-3.5 h-3.5 text-[#247A4A] shrink-0" />
              </div>

              {/* Linha 3: Fase & Progress Pill */}
              <div className="flex items-center justify-between gap-2 mt-3 text-xs">
                <span className="text-[11px] font-semibold text-[#247A4A]">Otimização de Campanhas</span>
                <span className="text-[10px] font-bold bg-[#FFFDF8]/90 text-[#247A4A] px-2 py-0.5 rounded-full">
                  60% Progress
                </span>
              </div>

              {/* Barra de Progresso Verde Vivox */}
              <div className="w-full h-1.5 rounded-full bg-[#FFFDF8]/70 mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-[#247A4A]" style={{ width: '60%' }} />
              </div>
            </div>

            {/* Linha Inferior: Avatares + Badge de Prazo */}
            <div className="flex items-center justify-between gap-2 pt-4 mt-2">
              <div className="flex items-center -space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#247A4A] text-white text-[10px] font-black flex items-center justify-center shadow-2xs">
                  T
                </span>
                <span className="w-6 h-6 rounded-full bg-[#181512] text-[#C7A15F] text-[10px] font-black flex items-center justify-center shadow-2xs">
                  V
                </span>
                <span className="w-6 h-6 rounded-full bg-[#FFFDF8] text-[#247A4A] text-[9px] font-bold flex items-center justify-center shadow-2xs">
                  +
                </span>
              </div>

              <span className="text-[10px] font-bold text-[#247A4A] bg-[#FFFDF8]/90 px-2.5 py-0.5 rounded-full">
                5 Days Left
              </span>
            </div>
          </div>

          {/* Card 3: Terracota / Vinho Nobre Vivox GP */}
          <div 
            onClick={() => onNavigateTab ? onNavigateTab('services') : null}
            className="bg-[#FAF0EB] rounded-[24px] p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
          >
            <div>
              {/* Linha 1: Data Pill + 3-dots */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold text-[#A35038] bg-[#FFFDF8]/80 px-3 py-1 rounded-full">
                  {new Date(Date.now() + 10 * 86400000).toLocaleDateString('pt-BR', { month: 'short', day: '2-digit', year: 'numeric' })}
                </span>
                <button className="text-[#A35038] hover:text-[#181512]">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Linha 2: Título do Serviço */}
              <div className="flex items-center justify-between gap-2 mt-2">
                <h4 className="text-sm font-black text-[#1E1A16] leading-tight">
                  {(servicos[2] as any)?.nomePersonalizado || servicos[2]?.tipoServico?.replace(/_/g, ' ') || 'Social Media & Conteúdo Estratégico'}
                </h4>
                <Info className="w-3.5 h-3.5 text-[#A35038] shrink-0" />
              </div>

              {/* Linha 3: Fase & Progress Pill */}
              <div className="flex items-center justify-between gap-2 mt-3 text-xs">
                <span className="text-[11px] font-semibold text-[#A35038]">Redação & Design</span>
                <span className="text-[10px] font-bold bg-[#FFFDF8]/90 text-[#A35038] px-2 py-0.5 rounded-full">
                  75% Progress
                </span>
              </div>

              {/* Barra de Progresso Terracota Vivox */}
              <div className="w-full h-1.5 rounded-full bg-[#FFFDF8]/70 mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-[#A35038]" style={{ width: '75%' }} />
              </div>
            </div>

            {/* Linha Inferior: Avatares + Badge de Prazo */}
            <div className="flex items-center justify-between gap-2 pt-4 mt-2">
              <div className="flex items-center -space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#A35038] text-white text-[10px] font-black flex items-center justify-center shadow-2xs">
                  S
                </span>
                <span className="w-6 h-6 rounded-full bg-[#181512] text-[#C7A15F] text-[10px] font-black flex items-center justify-center shadow-2xs">
                  V
                </span>
                <span className="w-6 h-6 rounded-full bg-[#FFFDF8] text-[#A35038] text-[9px] font-bold flex items-center justify-center shadow-2xs">
                  +
                </span>
              </div>

              <span className="text-[10px] font-bold text-[#A35038] bg-[#FFFDF8]/90 px-2.5 py-0.5 rounded-full">
                8 Days Left
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEÇÃO INFERIOR EM 2 COLUNAS: CALENDÁRIO + INBOX ATUALIZAÇÕES           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Calendário de Entregas & Prazos */}
        <div className="lg:col-span-6 bg-[#FFFDF8] rounded-[28px] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-[#1E1A16] uppercase tracking-wider">
                Calender
              </h3>
              <CalendarIcon className="w-3.5 h-3.5 text-[#8F8271]" />
            </div>

            <button className="text-[#8F8271] hover:text-[#1E1A16]">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Navegador de Mês */}
          <div className="flex items-center justify-between px-2 pt-1">
            <button className="w-7 h-7 rounded-full bg-[#FAF7F2] hover:bg-[#FAF2E4] text-[#1E1A16] flex items-center justify-center text-xs cursor-pointer shadow-2xs">
              ←
            </button>
            <span className="text-sm font-black text-[#1E1A16] tracking-tight">
              {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
            </span>
            <button className="w-7 h-7 rounded-full bg-[#FAF7F2] hover:bg-[#FAF2E4] text-[#1E1A16] flex items-center justify-center text-xs cursor-pointer shadow-2xs">
              →
            </button>
          </div>

          {/* Grid de Dias em Blocos Arredondados */}
          <div className="grid grid-cols-7 gap-2 pt-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-[#8F8271] pb-1">
                {d}
              </div>
            ))}
            {diasDoMes.map((d, i) => (
              <div
                key={i}
                className={`h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${d.color}`}
              >
                {d.dia}
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Inbox / Feed de Atualizações */}
        <div className="lg:col-span-6 bg-[#FFFDF8] rounded-[28px] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-[#1E1A16] uppercase tracking-wider">
                Inbox & Demandas
              </h3>
              <MessageSquare className="w-3.5 h-3.5 text-[#8F8271]" />
            </div>

            <button className="text-[#8F8271] hover:text-[#1E1A16]">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de Atualizações com Item Destacado Dark Vivox */}
          <div className="space-y-2.5 pt-1">
            {/* Item 1: Normal */}
            <div 
              onClick={() => onNavigateTab ? onNavigateTab('services') : null}
              className="p-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#FAF2E4] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#FAF2E4] text-[#8A6828] font-black text-xs flex items-center justify-center shrink-0 border border-[#E8D4B4]">
                  {cliente.nomeFantasia.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-[#1E1A16] truncate">Planejamento de Entregas</h4>
                  <p className="text-[10px] text-[#8F8271] truncate">Todas as peças sincronizadas no Penpot</p>
                </div>
              </div>
              <Pin className="w-3.5 h-3.5 text-[#8F8271] shrink-0" />
            </div>

            {/* Item 2: Destaque Dark Vivox (#181512 + #C7A15F) */}
            <div 
              onClick={() => navigate('/gp')}
              className="p-3.5 rounded-2xl bg-[#181512] text-white shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 border border-[#C7A15F]/20"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#C7A15F] text-[#181512] font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {cliente.responsavel?.nome ? cliente.responsavel.nome.charAt(0) : 'V'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white truncate">{cliente.responsavel?.nome || 'Equipe Vivox'}</h4>
                  <p className="text-[10px] text-[#C7A15F] truncate">Demanda em andamento com prazo para esta semana.</p>
                </div>
              </div>
              <Pin className="w-3.5 h-3.5 text-[#C7A15F] shrink-0" />
            </div>

            {/* Item 3: Normal */}
            <div 
              onClick={() => onNavigateTab ? onNavigateTab('notes') : null}
              className="p-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#FAF2E4] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#FAF2E4] text-[#8A6828] font-black text-xs flex items-center justify-center shrink-0 border border-[#E8D4B4]">
                  AI
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-[#1E1A16] truncate">Estúdio de Criação & IA</h4>
                  <p className="text-[10px] text-[#8F8271] truncate">Pronto para gerar copies e conteúdos</p>
                </div>
              </div>
              <Pin className="w-3.5 h-3.5 text-[#8F8271] shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DIRETRIZES ESTRATÉGICAS (PALETA VIVOX GP)                               */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFDF8] rounded-[28px] p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#FAF2E4]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8A6828]" />
            <h3 className="text-xs font-black text-[#1E1A16] uppercase tracking-wider">
              Diretrizes Estratégicas da Conta
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {obsSalva && (
              <span className="text-[11px] font-bold text-[#247A4A] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Salvo!
              </span>
            )}
            <button
              onClick={handleSalvarObservacoes}
              disabled={salvandoObs}
              className="px-5 py-2 rounded-full bg-[#181512] hover:bg-[#2A241E] text-[#C7A15F] text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs border border-[#C7A15F]/20"
            >
              {salvandoObs ? 'Salvando...' : 'Salvar Diretrizes'}
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Insira as regras da marca, tom de voz e notas estratégicas..."
          className="w-full bg-[#FAF7F2] rounded-2xl p-4 text-xs text-[#1E1A16] leading-relaxed outline-none border-0 focus:ring-1 focus:ring-[#C7A15F] transition-all resize-y"
        />
      </div>
    </div>
  );
}
