import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import type { Tarefa, StatusTarefa, PrioridadeTarefa, Cliente, Projeto } from '../types';
import { tarefasApi, type ResumoEtapas } from '../api/tarefas';
import { chamadosApi, type Chamado, type StatusChamado } from '../api/chamados';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { KanbanBoard } from '../components/gp/KanbanBoard';
import { TaskListView } from '../components/gp/TaskListView';
import { TaskDeadlineView } from '../components/gp/TaskDeadlineView';
import { TaskModal } from '../components/gp/TaskModal';
import { TaskFormModal } from '../components/gp/TaskFormModal';
import { WorkspaceListHub } from '../components/gp/WorkspaceListHub';
import { WorkspaceModal } from '../components/gp/WorkspaceModal';
import { ChamadosBoard } from '../components/gp/ChamadosBoard';
import { ChamadoModal } from '../components/gp/ChamadoModal';
import { NovoChamadoModal } from '../components/gp/NovoChamadoModal';
import { ImportBitrixModal } from '../components/gp/ImportBitrixModal';
import { 
  Kanban, 
  ListTodo, 
  CalendarClock, 
  Plus, 
  Search, 
  RefreshCw,
  Edit2,
  ChevronLeft,
  Globe,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  X,
  Upload,
  Loader2
} from 'lucide-react';

interface UserOption {
  id: string;
  nome: string;
  email: string;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export const VivoxGP: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClienteId = searchParams.get('clienteId');
  const queryServicoId = searchParams.get('servicoId');
  const isMinhasTarefas = location.pathname.startsWith('/gp/minhas-tarefas');

  const { workspaceId: paramWorkspaceId, tarefaId: paramTarefaId } = useParams<{
    workspaceId?: string;
    tarefaId?: string;
  }>();

  const [visao, setVisao] = useState<'kanban' | 'lista' | 'prazos'>('kanban');
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [workspaces, setWorkspaces] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const loadVersion = useRef(0);

  // No Pipeline (Kanban), cada coluna busca suas próprias tarefas sob demanda
  // em vez de depender do array `tarefas` completo — incrementar este sinal
  // faz o Kanban recarregar todas as colunas do zero (ex: após criar/editar
  // uma tarefa em outro lugar da tela, ou importar do Bitrix).
  const [kanbanRefreshSignal, setKanbanRefreshSignal] = useState(0);
  const [resumoEtapas, setResumoEtapas] = useState<ResumoEtapas | null>(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('');
  const [filtroStatusRapido, setFiltroStatusRapido] = useState<'todos' | 'em_andamento' | 'urgentes' | 'concluidas'>('todos');
  const [apenasMinhas, setApenasMinhas] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(null);

  // Auxiliares
  const [usuarios, setUsuarios] = useState<UserOption[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // Modais de Criação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<StatusTarefa>('A_FAZER');
  const [isNovoChamadoModalOpen, setIsNovoChamadoModalOpen] = useState(false);

  // Modais de Workspace
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);

  // Importação de tarefas do Bitrix
  const [isImportingBitrix, setIsImportingBitrix] = useState(false);
  const [isImportBitrixModalOpen, setIsImportBitrixModalOpen] = useState(false);

  // Workspace selecionado
  const selectedWorkspaceId = useMemo(() => {
    if (queryClienteId || queryServicoId) return 'ALL';
    if (!paramWorkspaceId) return null;
    if (paramWorkspaceId.toLowerCase() === 'all') return 'ALL';
    return paramWorkspaceId;
  }, [paramWorkspaceId, queryClienteId, queryServicoId]);

  const tarefaSelecionadaId = paramTarefaId || null;

  // O Pipeline (Kanban) de um workspace específico carrega suas colunas sob
  // demanda (ver KanbanBoard) — não precisa do array `tarefas` completo, que
  // pode ter milhares de itens. As demais visões (Lista, Prazos, Minhas
  // Tarefas, Central de Chamados, Hub de workspaces) continuam usando o
  // array completo, como antes.
  const usaListaCompletaDeTarefas =
    isMinhasTarefas || !selectedWorkspaceId || selectedWorkspaceId === 'ALL' || visao !== 'kanban';

  const carregarDados = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setLoadError(false);
    try {
      const [tarefasData, chamadosData, workspacesData, clientesRes] = await Promise.all([
        usaListaCompletaDeTarefas
          ? tarefasApi.getTarefas({
              projetoId: selectedWorkspaceId && selectedWorkspaceId !== 'ALL' ? selectedWorkspaceId : undefined,
              responsavelId: isMinhasTarefas ? user?.id : undefined,
              clienteId: queryClienteId || undefined,
              servicoId: queryServicoId || undefined,
            })
          : Promise.resolve([]),
        selectedWorkspaceId === 'ALL' ? chamadosApi.getChamados().catch(() => []) : Promise.resolve([]),
        tarefasApi.getProjetos().catch(() => []),
        selectedWorkspaceId === 'ALL'
          ? api.get<Cliente[]>('/clientes').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);

      if (version !== loadVersion.current) return;
      setTarefas(tarefasData);
      setChamados(chamadosData);
      setWorkspaces(workspacesData);
      setClientes(clientesRes.data || []);
      // Também sinaliza para o Kanban recarregar suas colunas, caso esteja
      // ativo — cobre casos como criar/editar/excluir tarefa ou importar.
      setKanbanRefreshSignal((s) => s + 1);
    } catch (err) {
      if (version !== loadVersion.current) return;
      setLoadError(true);
      console.error('Erro ao carregar dados do Vivox GP:', err);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [selectedWorkspaceId, isMinhasTarefas, user?.id, queryClienteId, queryServicoId, usaListaCompletaDeTarefas]);

  const invalidatePendingLoad = useCallback(() => {
    loadVersion.current++;
  }, []);

  useEffect(() => {
    setTarefas([]);
    carregarDados();
    return invalidatePendingLoad;
  }, [carregarDados, invalidatePendingLoad]);

  useEffect(() => {
    let active = true;
    api.get<UserOption[]>('/users').then(res => {
      if (active) setUsuarios(res.data || []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const handleSelectWorkspace = (id: string | null) => {
    if (id === 'ALL' || id === 'all') {
      navigate('/gp/workspace/all');
    } else if (id) {
      navigate(`/gp/workspace/${id}`);
    } else {
      navigate('/gp');
    }
  };

  const handleSelectTarefa = useCallback((t: Tarefa) => {
    if (isMinhasTarefas) {
      navigate(`/gp/minhas-tarefas/tarefa/${t.id}`);
    } else if (selectedWorkspaceId && selectedWorkspaceId !== 'ALL') {
      navigate(`/gp/workspace/${selectedWorkspaceId}/tarefa/${t.id}`);
    } else if (selectedWorkspaceId === 'ALL') {
      navigate(`/gp/workspace/all/tarefa/${t.id}`);
    } else {
      navigate(`/gp/tarefa/${t.id}`);
    }
  }, [isMinhasTarefas, selectedWorkspaceId, navigate]);

  const handleCloseTaskModal = () => {
    if (isMinhasTarefas) {
      navigate('/gp/minhas-tarefas');
    } else if (selectedWorkspaceId && selectedWorkspaceId !== 'ALL') {
      navigate(`/gp/workspace/${selectedWorkspaceId}`);
    } else if (selectedWorkspaceId === 'ALL') {
      navigate(`/gp/workspace/all`);
    } else {
      navigate('/gp');
    }
  };

  const handleUpdateStatus = async (tarefaId: string, novoStatus: StatusTarefa) => {
    const version = loadVersion.current;
    setTarefas((prev) =>
      prev.map((t) => (t.id === tarefaId ? { ...t, status: novoStatus } : t))
    );

    try {
      await tarefasApi.updateTarefa(tarefaId, { status: novoStatus });
    } catch (err) {
      console.error('Erro ao atualizar status da tarefa:', err);
      if (version === loadVersion.current) carregarDados();
    }
  };

  const handleUpdateChamadoStatus = async (chamadoId: string, novoStatus: StatusChamado) => {
    const version = loadVersion.current;
    setChamados((prev) =>
      prev.map((c) => (c.id === chamadoId ? { ...c, status: novoStatus } : c))
    );
    try {
      await chamadosApi.updateChamado(chamadoId, { status: novoStatus });
    } catch (err) {
      console.error('Erro ao atualizar status do chamado:', err);
      if (version === loadVersion.current) carregarDados();
    }
  };

  const handleDeleteTarefa = async (tarefaId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      await tarefasApi.deleteTarefa(tarefaId);
      setTarefas((prev) => prev.filter((t) => t.id !== tarefaId));
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
    }
  };

  const handleOpenCreateForStatus = (status: StatusTarefa) => {
    setCreateInitialStatus(status);
    setIsCreateModalOpen(true);
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este workspace? As tarefas continuarão salvas.')) {
      return;
    }
    try {
      await tarefasApi.deleteProjeto(workspaceId);
      if (selectedWorkspaceId === workspaceId) {
        navigate('/gp');
      }
      carregarDados();
    } catch (err) {
      console.error('Erro ao excluir workspace:', err);
    }
  };

  const handleImportBitrix = async (file: File, etapa?: string) => {
    if (!selectedWorkspaceId || selectedWorkspaceId === 'ALL') return;

    try {
      setIsImportingBitrix(true);
      const res = await tarefasApi.importarBitrix(file, selectedWorkspaceId, etapa);

      const msg = `${res.criadas} tarefas novas importadas.\n${res.atualizadas} já existiam e foram movidas para esta etapa.\n${res.ignoradasDuplicadas} já existiam e foram ignoradas (nenhuma etapa selecionada).\n${res.usuariosCriados?.length ? `Novos usuários: ${res.usuariosCriados.join(', ')}` : ''}`;
      window.alert(`Importação concluída!\n\n${msg}`);

      setIsImportBitrixModalOpen(false);
      carregarDados();
    } catch (err: any) {
      console.error(err);
      window.alert('Erro ao importar: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsImportingBitrix(false);
    }
  };

  const activeWorkspace = useMemo(() => {
    if (!selectedWorkspaceId || selectedWorkspaceId === 'ALL') return null;
    return workspaces.find((w) => w.id === selectedWorkspaceId) || null;
  }, [selectedWorkspaceId, workspaces]);

  // Filtragem de Tarefas
  const tarefasFiltradas = useMemo(() => {
    const termoBusca = busca.toLowerCase();
    return tarefas.filter((t) => {
      if (isMinhasTarefas) {
        if (!user || t.responsavelId !== user.id) return false;
      }

      if (selectedWorkspaceId && selectedWorkspaceId !== 'ALL') {
        if (t.projetoId !== selectedWorkspaceId) return false;
      }

      if (queryClienteId && t.clienteId !== queryClienteId) {
        return false;
      }

      if (queryServicoId && t.servicoId !== queryServicoId) {
        return false;
      }

      if (busca.trim()) {
        const matchBusca =
          t.titulo.toLowerCase().includes(termoBusca) ||
          (t.descricao && t.descricao.toLowerCase().includes(termoBusca)) ||
          (t.cliente && t.cliente.nomeFantasia.toLowerCase().includes(termoBusca));
        if (!matchBusca) return false;
      }

      if (apenasMinhas && user) {
        if (t.responsavelId !== user.id) return false;
      }

      if (filtroResponsavel && t.responsavelId !== filtroResponsavel) {
        return false;
      }

      if (filtroPrioridade && t.prioridade !== filtroPrioridade) {
        return false;
      }

      if (filtroStatusRapido === 'em_andamento' && t.status !== 'EM_ANDAMENTO') {
        return false;
      }

      if (filtroStatusRapido === 'urgentes' && t.prioridade !== 'URGENTE') {
        return false;
      }

      if (filtroStatusRapido === 'concluidas' && t.status !== 'CONCLUIDA') {
        return false;
      }

      return true;
    });
  }, [tarefas, selectedWorkspaceId, isMinhasTarefas, queryClienteId, queryServicoId, busca, apenasMinhas, user, filtroResponsavel, filtroPrioridade, filtroStatusRapido]);

  // Filtros repassados ao Kanban para cada coluna buscar sua própria página
  // de tarefas. A busca por texto é debounced pra não disparar uma requisição
  // por coluna a cada tecla digitada.
  const buscaDebounced = useDebouncedValue(busca, 350);
  const kanbanFiltros = useMemo(() => ({
    search: buscaDebounced.trim() || undefined,
    responsavelId: apenasMinhas ? user?.id : filtroResponsavel || undefined,
    prioridade: filtroStatusRapido === 'urgentes' ? ('URGENTE' as const) : ((filtroPrioridade || undefined) as PrioridadeTarefa | undefined),
    statusExato: filtroStatusRapido === 'em_andamento' ? 'EM_ANDAMENTO' : filtroStatusRapido === 'concluidas' ? 'CONCLUIDA' : undefined,
  }), [buscaDebounced, apenasMinhas, user?.id, filtroResponsavel, filtroPrioridade, filtroStatusRapido]);

  // Estatísticas do cabeçalho (pílulas + números grandes) quando o Kanban
  // está no modo leve: vêm de um resumo agregado do servidor em vez de serem
  // calculadas sobre o array completo de tarefas (que não é carregado aqui).
  useEffect(() => {
    if (usaListaCompletaDeTarefas) {
      setResumoEtapas(null);
      return;
    }
    let active = true;
    tarefasApi.getResumoEtapas({
      projetoId: selectedWorkspaceId && selectedWorkspaceId !== 'ALL' ? selectedWorkspaceId : undefined,
      search: buscaDebounced.trim() || undefined,
      responsavelId: apenasMinhas ? user?.id : filtroResponsavel || undefined,
      prioridade: (filtroPrioridade || undefined) as PrioridadeTarefa | undefined,
    }).then((res) => {
      if (active) setResumoEtapas(res);
    }).catch((err) => {
      console.error('Erro ao carregar resumo do Kanban:', err);
    });
    return () => { active = false; };
  }, [usaListaCompletaDeTarefas, selectedWorkspaceId, buscaDebounced, apenasMinhas, user?.id, filtroResponsavel, filtroPrioridade, kanbanRefreshSignal]);

  // Se nenhum workspace estiver na URL (e não estiver abrindo uma tarefa nem na visão "Minhas Tarefas"), exibe o Hub
  if (!isMinhasTarefas && selectedWorkspaceId === null && !tarefaSelecionadaId) {
    return (
      <div className="flex-1 w-full h-full flex flex-col overflow-hidden bg-[#F4F1EA]">
        <WorkspaceListHub
          workspaces={workspaces}
          tarefas={tarefas}
          loading={loading}
          onSelectWorkspace={handleSelectWorkspace}
          onOpenCreateWorkspace={() => {
            setEditingWorkspaceId(null);
            setIsWorkspaceModalOpen(true);
          }}
          onOpenEditWorkspace={(ws) => {
            setEditingWorkspaceId(ws.id);
            setIsWorkspaceModalOpen(true);
          }}
          onDeleteWorkspace={handleDeleteWorkspace}
        />

        {isWorkspaceModalOpen && (
          <WorkspaceModal
            workspaceId={editingWorkspaceId}
            onClose={() => {
              setIsWorkspaceModalOpen(false);
              setEditingWorkspaceId(null);
            }}
            onSaved={carregarDados}
          />
        )}
      </div>
    );
  }

  // No modo leve do Kanban (workspace grande, paginado por coluna) os números
  // do cabeçalho vêm do resumo agregado do servidor; nas demais visões, do
  // array completo já carregado em memória.
  const totalWorkspaceTarefas = resumoEtapas ? resumoEtapas.total : tarefasFiltradas.length;
  const emAndamentoCount = resumoEtapas ? resumoEtapas.emAndamento : tarefasFiltradas.filter((t) => t.status === 'EM_ANDAMENTO').length;
  const urgentesCount = resumoEtapas ? resumoEtapas.urgentes : tarefasFiltradas.filter((t) => t.prioridade === 'URGENTE').length;
  const concluidasCount = resumoEtapas ? resumoEtapas.concluidas : tarefasFiltradas.filter((t) => t.status === 'CONCLUIDA').length;

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden bg-[#F6F5F1] select-none">
      {/* ========================================================================= */}
      {/* CABEÇALHO DO KANBAN ESTILO SALESFORCE / DAILY OPERATION                    */}
      {/* ========================================================================= */}
      <header className="bg-[#FFFDF8] border-b border-[#E5D9C8] px-6 lg:px-10 pt-5 pb-3 flex flex-col gap-4 shrink-0 shadow-2xs z-10">
        {/* Linha Superior: Voltar + Título do Workspace + Seletor de Visão + Grandes Estatísticas */}
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Lado Esquerdo: Botão Voltar + Eyebrow + Título Principal */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/gp')}
              className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#D8CBB8] hover:border-[#1E1A16] flex items-center justify-center text-[#1E1A16] hover:scale-105 transition-all shadow-2xs cursor-pointer"
              title="Voltar para a lista de workspaces"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[12.5px] font-bold text-[#8F8271] uppercase tracking-wider block">
                Planejamento de Demandas • Vivox GP
              </span>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-black text-[#1E1A16] tracking-tight leading-none">
                  {isMinhasTarefas
                    ? 'Minhas Tarefas'
                    : selectedWorkspaceId === 'ALL'
                    ? 'Central de Chamados'
                    : activeWorkspace?.nome || 'Operação Diária'}
                </h1>
                {activeWorkspace && (
                  <button
                    onClick={() => {
                      setEditingWorkspaceId(activeWorkspace.id);
                      setIsWorkspaceModalOpen(true);
                    }}
                    title="Editar configurações deste workspace"
                    className="p-1 rounded-md text-[#8F8271] hover:text-[#1E1A16] transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lado Direito: Seletor de Visões (Pipeline/Lista/Prazos) + Grandes Métricas Numéricas */}
          <div className="flex items-center gap-6 lg:gap-10 flex-wrap">
            {/* Seletor de Visões em Pílulas */}
            {!isMinhasTarefas && selectedWorkspaceId !== 'ALL' && (
              <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-full p-1 flex items-center gap-1 shadow-2xs">
                <button
                  onClick={() => setVisao('kanban')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    visao === 'kanban'
                      ? 'bg-[#181512] text-white shadow-xs'
                      : 'text-[#625746] hover:text-[#1E1A16]'
                  }`}
                >
                  Pipeline
                </button>

                <button
                  onClick={() => setVisao('lista')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    visao === 'lista'
                      ? 'bg-[#181512] text-white shadow-xs'
                      : 'text-[#625746] hover:text-[#1E1A16]'
                  }`}
                >
                  Lista
                </button>

                <button
                  onClick={() => setVisao('prazos')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    visao === 'prazos'
                      ? 'bg-[#181512] text-white shadow-xs'
                      : 'text-[#625746] hover:text-[#1E1A16]'
                  }`}
                >
                  Prazos
                </button>
              </div>
            )}

            {/* Números de Estatísticas em Destaque */}
            <div className="flex items-center gap-6 lg:gap-8">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-[#1E1A16] leading-none">
                  {selectedWorkspaceId === 'ALL' ? chamados.length : totalWorkspaceTarefas}
                </span>
                <span className="text-[12px] font-semibold text-[#8F8271] mt-0.5">
                  {isMinhasTarefas ? 'Total de Tarefas' : selectedWorkspaceId === 'ALL' ? 'Chamados Totais' : 'Tarefas do Espaço'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-2xl font-black text-[#1E1A16] leading-none">
                  {selectedWorkspaceId === 'ALL' ? chamados.filter(c => c.status === 'ABERTO').length : urgentesCount}
                </span>
                <span className="text-[12px] font-semibold text-[#8F8271] mt-0.5">
                  {selectedWorkspaceId === 'ALL' ? 'Em Aberto' : 'Aguardando Atenção'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-2xl font-black text-[#1E1A16] leading-none">
                  {usuarios.length}
                </span>
                <span className="text-[12px] font-semibold text-[#8F8271] mt-0.5">
                  Membros Envolvidos
                </span>
              </div>
            </div>

            {/* Botão Principal Nova Tarefa / Novo Chamado */}
            <button
              onClick={() => {
                if (selectedWorkspaceId === 'ALL') {
                  setIsNovoChamadoModalOpen(true);
                } else {
                  setCreateInitialStatus('A_FAZER');
                  setIsCreateModalOpen(true);
                }
              }}
              className="px-4 py-2 rounded-full bg-[#C7A15F] hover:bg-[#B89455] text-[#1D160B] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {selectedWorkspaceId === 'ALL' ? 'Novo Chamado' : 'Nova Tarefa'}
            </button>
          </div>
        </div>

        {/* Linha Inferior: Pílulas de Filtro de Status + Busca Rápida */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-1 border-t border-[#E5D9C8]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pílula: Todos */}
            <button
              onClick={() => setFiltroStatusRapido('todos')}
              className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                filtroStatusRapido === 'todos'
                  ? 'bg-[#181512] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#625746] border border-[#D8CBB8] hover:border-[#1E1A16]'
              }`}
            >
              <span>Todos</span>
              <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">
                {totalWorkspaceTarefas}
              </span>
            </button>

            {/* Pílula: Em Execução */}
            <button
              onClick={() => setFiltroStatusRapido('em_andamento')}
              className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                filtroStatusRapido === 'em_andamento'
                  ? 'bg-[#181512] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#625746] border border-[#D8CBB8] hover:border-[#1E1A16]'
              }`}
            >
              <span>Em Execução</span>
              <span className="w-5 h-5 rounded-full bg-[#FFA800] text-black font-bold text-xs flex items-center justify-center">
                {emAndamentoCount}
              </span>
            </button>

            {/* Pílula: Urgentes */}
            <button
              onClick={() => setFiltroStatusRapido('urgentes')}
              className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                filtroStatusRapido === 'urgentes'
                  ? 'bg-[#181512] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#B83B32] border border-[#B83B32]/30 hover:border-[#B83B32]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Urgentes</span>
              <span className="w-5 h-5 rounded-full bg-[#B83B32] text-white font-bold text-xs flex items-center justify-center">
                {urgentesCount}
              </span>
            </button>

            {/* Pílula: Concluídas */}
            <button
              onClick={() => setFiltroStatusRapido('concluidas')}
              className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                filtroStatusRapido === 'concluidas'
                  ? 'bg-[#181512] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#247A4A] border border-[#247A4A]/30 hover:border-[#247A4A]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluídas</span>
              <span className="w-5 h-5 rounded-full bg-[#247A4A] text-white font-bold text-xs flex items-center justify-center">
                {concluidasCount}
              </span>
            </button>

            {/* Badge de Filtro de Cliente/Serviço ativo do Mapa de Serviços */}
            {(queryClienteId || queryServicoId) && (
              <div className="flex items-center gap-1.5 bg-[#C7A15F]/20 text-[#8F6F2D] border border-[#C7A15F]/40 px-3 py-1 rounded-full text-xs font-bold shadow-2xs ml-1">
                <span>
                  Filtro: {clientes.find((c) => c.id === queryClienteId)?.nomeFantasia || 'Cliente/Serviço'}
                </span>
                <button
                  onClick={() => {
                    searchParams.delete('clienteId');
                    searchParams.delete('servicoId');
                    setSearchParams(searchParams);
                  }}
                  title="Limpar filtro de cliente"
                  className="w-4 h-4 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          {/* Busca e Filtro de Responsável */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 text-[#8F8271] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full text-xs pl-8 pr-2 py-1 bg-[#FAF7F2] border border-[#D8CBB8] rounded-full outline-none focus:bg-[#FFFDF8] focus:border-[#1E1A16] transition-all"
              />
            </div>

            {!isMinhasTarefas && (
              <button
                onClick={() => setApenasMinhas(!apenasMinhas)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  apenasMinhas
                    ? 'bg-[#181512] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#625746] border border-[#D8CBB8] hover:bg-[#EEE7DC]'
                }`}
              >
                Minhas Tarefas
              </button>
            )}

            {!isMinhasTarefas && selectedWorkspaceId && selectedWorkspaceId !== 'ALL' && (
              <button
                type="button"
                title="Importar tarefas do Bitrix"
                onClick={() => setIsImportBitrixModalOpen(true)}
                disabled={isImportingBitrix}
                className={`p-1.5 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  isImportingBitrix
                    ? 'bg-[#181512] border-[#181512] text-white'
                    : 'bg-[#FAF7F2] border-[#D8CBB8] hover:border-[#1E1A16] text-[#1E1A16]'
                }`}
              >
                {isImportingBitrix ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={carregarDados}
              disabled={loading}
              title="Atualizar"
              className="p-1.5 rounded-full bg-[#FAF7F2] border border-[#D8CBB8] hover:border-[#1E1A16] text-[#1E1A16] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Kanban / Lista / Prazos */}
      <main className="flex-1 w-full h-full overflow-hidden flex flex-col">
        {loadError && <div role="alert" className="p-3 text-sm text-red-700">Não foi possível carregar as tarefas. Tente atualizar novamente.</div>}
        {selectedWorkspaceId === 'ALL' ? (
          <ChamadosBoard
            chamados={chamados}
            clientes={clientes}
            onUpdateStatus={handleUpdateChamadoStatus}
            onOpenChamado={setChamadoSelecionado}
          />
        ) : isMinhasTarefas ? (
          <div className="flex-1 min-h-0 overflow-hidden p-6">
            <TaskListView
              tarefas={tarefasFiltradas}
              onSelectTarefa={handleSelectTarefa}
              onUpdateStatus={handleUpdateStatus}
              onDeleteTarefa={handleDeleteTarefa}
            />
          </div>
        ) : visao === 'kanban' && selectedWorkspaceId ? (
          <KanbanBoard
            key={selectedWorkspaceId}
            workspaceId={selectedWorkspaceId}
            filtros={kanbanFiltros}
            refreshSignal={kanbanRefreshSignal}
            onSelectTarefa={handleSelectTarefa}
            onUpdateStatus={handleUpdateStatus}
            onQuickCreate={handleOpenCreateForStatus}
          />
        ) : null}

        {!isMinhasTarefas && visao === 'lista' && selectedWorkspaceId !== 'ALL' && (
          <div className="flex-1 min-h-0 overflow-hidden p-6">
            <TaskListView
              tarefas={tarefasFiltradas}
              onSelectTarefa={handleSelectTarefa}
              onUpdateStatus={handleUpdateStatus}
              onDeleteTarefa={handleDeleteTarefa}
            />
          </div>
        )}

        {!isMinhasTarefas && visao === 'prazos' && selectedWorkspaceId !== 'ALL' && (
          <TaskDeadlineView
            tarefas={tarefasFiltradas}
            onSelectTarefa={handleSelectTarefa}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </main>

      {/* Modal de Detalhes da Tarefa */}
      {tarefaSelecionadaId && (
        <TaskModal
          tarefaId={tarefaSelecionadaId}
          onClose={handleCloseTaskModal}
          onTaskUpdated={carregarDados}
        />
      )}

      {/* Modal de Detalhes do Chamado */}
      {chamadoSelecionado && (
        <ChamadoModal
          chamado={chamadoSelecionado}
          clientes={clientes}
          onClose={() => setChamadoSelecionado(null)}
          onUpdate={(updatedChamado) => {
            setChamados(prev => prev.map(c => c.id === updatedChamado.id ? updatedChamado : c));
            setChamadoSelecionado(updatedChamado);
          }}
        />
      )}

      {/* Modal de Criação de Tarefa */}
      {isCreateModalOpen && (
        <TaskFormModal
          initialStatus={createInitialStatus}
          initialWorkspaceId={selectedWorkspaceId !== 'ALL' ? selectedWorkspaceId : null}
          workspaces={workspaces}
          onClose={() => setIsCreateModalOpen(false)}
          onTaskCreated={carregarDados}
        />
      )}

      {/* Modal de Workspace */}
      {isWorkspaceModalOpen && (
        <WorkspaceModal
          workspaceId={editingWorkspaceId}
          onClose={() => {
            setIsWorkspaceModalOpen(false);
            setEditingWorkspaceId(null);
          }}
          onSaved={carregarDados}
        />
      )}

      {/* Modal de Novo Chamado */}
      {isNovoChamadoModalOpen && (
        <NovoChamadoModal
          initialClienteId={queryClienteId}
          onClose={() => setIsNovoChamadoModalOpen(false)}
          onChamadoCreated={carregarDados}
        />
      )}

      {/* Modal de Importação do Bitrix */}
      {isImportBitrixModalOpen && selectedWorkspaceId && selectedWorkspaceId !== 'ALL' && (
        <ImportBitrixModal
          workspaceId={selectedWorkspaceId}
          isImporting={isImportingBitrix}
          onClose={() => setIsImportBitrixModalOpen(false)}
          onImport={handleImportBitrix}
        />
      )}
    </div>
  );
};
