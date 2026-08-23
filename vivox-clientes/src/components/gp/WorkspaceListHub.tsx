import React, { useState, useMemo } from 'react';
import type { Projeto, Tarefa } from '../../types';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  Globe, 
  Building2, 
  Flame, 
  SlidersHorizontal,
  FolderKanban,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface WorkspaceListHubProps {
  workspaces: Projeto[];
  tarefas: Tarefa[];
  onSelectWorkspace: (id: string | null) => void;
  onOpenCreateWorkspace: () => void;
  onOpenEditWorkspace: (workspace: Projeto) => void;
  onDeleteWorkspace: (id: string) => void;
}

export const WorkspaceListHub: React.FC<WorkspaceListHubProps> = ({
  workspaces,
  tarefas,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onOpenEditWorkspace,
  onDeleteWorkspace,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<'all' | 'clientes' | 'geral' | 'urgente'>('all');
  const [openSearch, setOpenSearch] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Métricas Consolidadas
  const totalTarefas = tarefas.length;
  const emAndamento = tarefas.filter((t) => t.status === 'EM_ANDAMENTO').length;
  const concluidas = tarefas.filter((t) => t.status === 'CONCLUIDA').length;
  const urgentes = tarefas.filter((t) => t.prioridade === 'URGENTE').length;

  const workspacesFiltrados = useMemo(() => {
    return workspaces.filter((ws) => {
      if (busca.trim()) {
        const match =
          ws.nome.toLowerCase().includes(busca.toLowerCase()) ||
          (ws.descricao && ws.descricao.toLowerCase().includes(busca.toLowerCase())) ||
          (ws.cliente && ws.cliente.nomeFantasia.toLowerCase().includes(busca.toLowerCase()));
        if (!match) return false;
      }

      if (filtroCategoria === 'clientes' && !ws.clienteId) return false;
      if (filtroCategoria === 'geral' && ws.clienteId) return false;
      if (filtroCategoria === 'urgente') {
        const hasUrgent = tarefas.some((t) => t.projetoId === ws.id && t.prioridade === 'URGENTE');
        if (!hasUrgent) return false;
      }

      return true;
    });
  }, [workspaces, busca, filtroCategoria, tarefas]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-transparent p-6 md:p-10 flex flex-col select-none">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
        {/* ========================================================================= */}
        {/* TOPO: LOGO WORKSPACE + BOTÃO PILL + GRANDES NÚMEROS DE MÉTRICAS          */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-6 flex-wrap pb-4">
          {/* Título Estilo Editorial com Glowing Ring no 'O' com as cores do Sistema Vivox */}
          <div className="flex items-center gap-4">
            <div className="flex items-center text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight uppercase">
              <span>W</span>
              <span className="relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 mx-0.5">
                <span className="w-6 h-6 md:w-7 md:h-7 rounded-full border-[3px] border-[#C7A15F] shadow-[0_0_16px_rgba(199,161,95,0.75)] flex items-center justify-center bg-gradient-to-br from-[#FAF7F2] to-[#E5D9C8] transition-all">
                  <span className="w-2 h-2 rounded-full bg-[#8A6828] shadow-2xs" />
                </span>
              </span>
              <span>RKSPACE</span>
            </div>

            {/* Botão Pill Dark '+ New Workspace' */}
            <button
              onClick={onOpenCreateWorkspace}
              className="px-5 py-2 rounded-full bg-[#181512] hover:bg-[#2A241E] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95 border border-[#C7A15F]/20"
            >
              <span className="w-4 h-4 rounded-full bg-[#C7A15F]/30 text-[#C7A15F] flex items-center justify-center text-xs font-black">
                +
              </span>
              <span>New Task / Workspace</span>
            </button>
          </div>

          {/* Grandes Números de Estatísticas com Micro-Badges */}
          <div className="flex items-center gap-8 md:gap-12 flex-wrap">
            {/* Stat 1: Total Tarefas */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight">
                {totalTarefas}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8F8271]">Demandas</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#C7A15F]/20 text-[#8A6828] border border-[#C7A15F]/40">
                  ↑{workspaces.length}
                </span>
              </div>
            </div>

            {/* Stat 2: Em Execução */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight">
                {emAndamento}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8F8271]">Em Curso</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FFA800]/20 text-[#B45309] border border-[#FFA800]/40">
                  ⚡{urgentes}
                </span>
              </div>
            </div>

            {/* Stat 3: Concluídas */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight">
                {concluidas}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8F8271]">Finalizadas</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#24C16E]/20 text-[#15803D] border border-[#24C16E]/40">
                  ✓
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUBHEADER: BARRA DE FILTROS PILL, BUSCA CIRCULAR & TÍTULO DA SEÇÃO        */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
          {/* Título da Seção: 'Espaços de Trabalho' + Sub-pill */}
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl md:text-2xl font-black text-[#1E1A16] tracking-tight">
              Espaços de Trabalho
            </h2>
            <span className="text-xs font-bold text-[#8F8271] border-b-2 border-[#1E1A16] pb-0.5">
              {workspacesFiltrados.length} Workspaces
            </span>
          </div>

          {/* Controles de Filtro & Busca em Pílulas Redondas */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão de Busca Circular */}
            <div className="relative">
              {openSearch ? (
                <div className="flex items-center bg-[#FFFDF8] border border-[#D8CBB8] rounded-full px-3 py-1.5 shadow-2xs animate-in fade-in zoom-in-95 duration-150">
                  <Search className="w-3.5 h-3.5 text-[#8F8271] mr-2" />
                  <input
                    type="text"
                    autoFocus
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Filtrar workspaces..."
                    className="text-xs bg-transparent outline-none w-36 text-[#1E1A16]"
                  />
                  <button
                    onClick={() => {
                      setBusca('');
                      setOpenSearch(false);
                    }}
                    className="text-[#8F8271] hover:text-[#1E1A16] text-xs ml-1"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setOpenSearch(true)}
                  className="w-9 h-9 rounded-full bg-[#FFFDF8] border border-[#D8CBB8] hover:border-[#1E1A16] flex items-center justify-center text-[#625746] hover:text-[#1E1A16] transition-all shadow-2xs cursor-pointer"
                  title="Pesquisar"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Pílula: All (Ativo no estilo do exemplo) */}
            <button
              onClick={() => setFiltroCategoria('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filtroCategoria === 'all'
                  ? 'bg-[#FFFDF8] text-[#1E1A16] shadow-sm border border-[#D8CBB8]'
                  : 'bg-transparent text-[#625746] hover:bg-[#FFFDF8]/60 border border-transparent'
              }`}
            >
              All
            </button>

            {/* Pílula: 🔥 Urgentes / Hot */}
            <button
              onClick={() => setFiltroCategoria('urgente')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                filtroCategoria === 'urgente'
                  ? 'bg-[#FFFDF8] text-[#B83B32] shadow-sm border border-[#B83B32]/40'
                  : 'bg-transparent text-[#625746] hover:bg-[#FFFDF8]/60 border border-[#D8CBB8]/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#B83B32]" />
              <span>Hot Demandas</span>
            </button>

            {/* Pílula: Com Clientes */}
            <button
              onClick={() => setFiltroCategoria('clientes')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filtroCategoria === 'clientes'
                  ? 'bg-[#FFFDF8] text-[#1E1A16] shadow-sm border border-[#D8CBB8]'
                  : 'bg-transparent text-[#625746] hover:bg-[#FFFDF8]/60 border border-[#D8CBB8]/60'
              }`}
            >
              Clientes
            </button>

            {/* Pílula: Workspaces Gerais */}
            <button
              onClick={() => setFiltroCategoria('geral')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filtroCategoria === 'geral'
                  ? 'bg-[#FFFDF8] text-[#1E1A16] shadow-sm border border-[#D8CBB8]'
                  : 'bg-transparent text-[#625746] hover:bg-[#FFFDF8]/60 border border-[#D8CBB8]/60'
              }`}
            >
              Gerais / Internos
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GRID DE CARDS NEO-ORGANIC NO ESTILO EXATO DA REFERÊNCIA                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          {/* Card 1 Especial: 'Todos os Workspaces / Pipeline Global' com Degradê Vivox */}
          <div
            onClick={() => onSelectWorkspace('ALL')}
            className="group bg-gradient-to-br from-[#1E1A16] via-[#2B2319] to-[#14100D] text-[#F6F0E7] border border-[#C7A15F]/40 hover:border-[#C7A15F] rounded-[28px] p-5 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] relative overflow-hidden"
          >
            {/* Brilhos decorativos sutis em degradê Vivox */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#C7A15F]/15 blur-2xl pointer-events-none group-hover:bg-[#C7A15F]/30 transition-all duration-500" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[#8F6F2D]/10 blur-xl pointer-events-none" />

            {/* Linha Topo: Avatar + Botão Seta ↗ */}
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3D3325] to-[#241F18] border border-[#C7A15F]/40 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                <Globe className="w-6 h-6 text-[#C7A15F]" />
              </div>

              {/* Botão Seta Circular ↗ no Canto */}
              <div className="w-9 h-9 rounded-full bg-[#241F18] border border-[#C7A15F]/30 group-hover:bg-[#C7A15F] group-hover:text-[#181512] text-[#C7A15F] flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-xs">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Informações Centrais */}
            <div className="my-2 relative z-10">
              <h3 className="text-lg font-black text-[#F6F0E7] group-hover:text-[#C7A15F] transition-colors leading-tight">
                Visão Geral
              </h3>
              <p className="text-xs text-[#B9AEA0] font-medium line-clamp-1 mt-0.5">
                Pipeline unificado de toda a agência
              </p>
            </div>

            {/* Rodapé: Tags em Pílula + Indicador de Pontos de Status */}
            <div className="pt-3 border-t border-[#C7A15F]/20 flex items-center justify-between gap-2 relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C7A15F]/20 text-[#E8D7B8] border border-[#C7A15F]/30">
                  {totalTarefas} tarefas
                </span>
              </div>

              {/* Pontos de Intensidade de Status (●●●●●) com paleta harmoniosa */}
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C7A15F]" />
                <span className="w-2 h-2 rounded-full bg-[#FFA800]" />
                <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                <span className="w-2 h-2 rounded-full bg-[#FF5B5B]" />
                <span className="w-2 h-2 rounded-full bg-[#24C16E]" />
              </div>
            </div>
          </div>

          {/* Cards dos Workspaces no Formato Exato da Imagem */}
          {workspacesFiltrados.map((ws) => {
            const tarefasDoWorkspace = tarefas.filter((t) => t.projetoId === ws.id);
            const totalWs = tarefasDoWorkspace.length;
            const concluidasWs = tarefasDoWorkspace.filter((t) => t.status === 'CONCLUIDA').length;
            const emAndamentoWs = tarefasDoWorkspace.filter((t) => t.status === 'EM_ANDAMENTO').length;
            const hasUrgent = tarefasDoWorkspace.some((t) => t.prioridade === 'URGENTE');

            return (
              <div
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.id)}
                className="group bg-[#FFFDF8] border border-[#D8CBB8] hover:border-[#1E1A16] rounded-[28px] p-5 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] relative"
              >
                {/* Linha Topo: Avatar Circular/Emoji + Botão Seta ↗ no Canto */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E5D9C8] flex items-center justify-center text-2xl shadow-2xs group-hover:scale-105 transition-transform">
                    {ws.icone || '📁'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Menu Opções */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === ws.id ? null : ws.id);
                        }}
                        className="w-7 h-7 rounded-full text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#EEE7DC] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {openMenuId === ws.id && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-[#FFFDF8] border border-[#D8CBB8] rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              onOpenEditWorkspace(ws);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-[#1E1A16] hover:bg-[#FAF7F2] flex items-center gap-1.5"
                          >
                            <Edit2 className="w-3 h-3" /> Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              onDeleteWorkspace(ws.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-[#B83B32] hover:bg-[#B83B32]/10 flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3 h-3" /> Excluir
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Botão Seta ↗ Estilo Referência */}
                    <div className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#D8CBB8] group-hover:bg-[#1E1A16] group-hover:text-[#FFFDF8] text-[#1E1A16] flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-2xs">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Informações Centrais: Nome + Subtítulo */}
                <div className="my-2">
                  <h3 className="text-base font-bold text-[#1E1A16] group-hover:text-[#8F6F2D] transition-colors leading-tight truncate">
                    {ws.nome}
                  </h3>
                  <p className="text-xs text-[#625746] font-medium line-clamp-1 mt-0.5">
                    {ws.cliente
                      ? `Cliente: ${ws.cliente.nomeFantasia}`
                      : ws.descricao || 'Área operacional & entregas'}
                  </p>
                </div>

                {/* Rodapé: Tags em Pílula + Indicador de Pontos de Status */}
                <div className="pt-3 border-t border-[#E5D9C8] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEE7DC] text-[#4A4032] border border-[#D8CBB8] truncate">
                      {ws.cliente ? ws.cliente.nomeFantasia : 'Interno'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF7F2] text-[#8F8271] border border-[#E5D9C8]">
                      {totalWs} {totalWs === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>

                  {/* Indicador de Status com Pontos Coloridos (Estilo Exemplo) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      title={`${emAndamentoWs} em andamento`}
                      className={`w-2 h-2 rounded-full ${
                        emAndamentoWs > 0 ? 'bg-[#FFA800]' : 'bg-[#D8CBB8]'
                      }`}
                    />
                    <span
                      title={hasUrgent ? 'Possui tarefas urgentes' : 'Sem urgências'}
                      className={`w-2 h-2 rounded-full ${
                        hasUrgent ? 'bg-[#FF5B5B]' : 'bg-[#D8CBB8]'
                      }`}
                    />
                    <span
                      title={`${concluidasWs} concluídas`}
                      className={`w-2 h-2 rounded-full ${
                        concluidasWs > 0 ? 'bg-[#24C16E]' : 'bg-[#D8CBB8]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Card 'Criar Novo Workspace' */}
          <div
            onClick={onOpenCreateWorkspace}
            className="rounded-[28px] border-2 border-dashed border-[#D8CBB8] hover:border-[#1E1A16] bg-[#FFFDF8]/50 hover:bg-[#FFFDF8] p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center min-h-[220px] group"
          >
            <div className="w-12 h-12 rounded-full bg-[#181512] text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1E1A16] group-hover:text-[#8F6F2D] transition-colors">
                Novo Workspace
              </h4>
              <p className="text-[11px] text-[#8F8271] mt-0.5">
                Criar espaço para cliente ou setor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
