import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Tarefa, StatusTarefa, PrioridadeTarefa } from '../../types';
import { tarefasApi } from '../../api/tarefas';
import { VirtualTaskColumn } from './VirtualTaskColumn';
import { ColumnModal } from './ColumnModal';
import type { KanbanColumnData } from './ColumnModal';
import {
  Plus,
  Edit3,
  Layers,
  GripVertical,
  Loader2,
} from 'lucide-react';

export const DEFAULT_COLUNAS: (KanbanColumnData & { cardBg: string })[] = [
  {
    id: 'BACKLOG',
    titulo: 'RECEBIMENTO DE DEMANDA',
    subtitulo: 'Demandas & Ideias',
    headerBg: '#00AEEF', // Sky Blue
    cardBg: '#FFFFFF',
    headerTextColor: '#FFFFFF',
    isDefault: true,
  },
  {
    id: 'A_FAZER',
    titulo: 'ESTRUTURAÇÃO & A FAZER',
    subtitulo: 'Prontas para iniciar',
    headerBg: '#FFA800', // Amber/Orange
    cardBg: '#FFFFFF',
    headerTextColor: '#FFFFFF',
    isDefault: true,
  },
  {
    id: 'EM_ANDAMENTO',
    titulo: 'EM EXECUÇÃO',
    subtitulo: 'Trabalho em curso',
    headerBg: '#0284C7', // Vibrant Blue
    cardBg: '#FFFFFF',
    headerTextColor: '#FFFFFF',
    isDefault: true,
  },
  {
    id: 'EM_REVISAO',
    titulo: 'APROVAÇÃO INTERNA',
    subtitulo: 'Validação & Revisão',
    headerBg: '#FF5B5B', // Coral/Red
    cardBg: '#FFFFFF',
    headerTextColor: '#FFFFFF',
    isDefault: true,
  },
  {
    id: 'CONCLUIDA',
    titulo: 'CONCLUÍDAS',
    subtitulo: 'Entregas finalizadas',
    headerBg: '#24C16E', // Emerald Green
    cardBg: '#FFFFFF',
    headerTextColor: '#FFFFFF',
    isDefault: true,
  },
];

export const getKanbanStorageKey = (workspaceId?: string | null) =>
  `vivox_kanban_columns_v3_${workspaceId || 'default'}`;

export function getStoredColunas(
  workspaceId?: string | null,
): (KanbanColumnData & { cardBg?: string })[] {
  try {
    const saved = localStorage.getItem(getKanbanStorageKey(workspaceId));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler colunas do localStorage:', e);
  }
  return DEFAULT_COLUNAS;
}

// Quantas tarefas buscar por página, por coluna, ao carregar e ao rolar até o fim.
const PAGE_SIZE = 40;

export interface KanbanFiltros {
  search?: string;
  responsavelId?: string;
  prioridade?: PrioridadeTarefa;
  // Quando a pílula rápida "Em Execução"/"Concluídas" está ativa, pina a
  // busca num status literal — colunas com outro id ficam vazias, igual ao
  // comportamento de quando isso era filtrado em memória.
  statusExato?: string;
}

interface ColunaEstado {
  items: Tarefa[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
}

const ESTADO_INICIAL: ColunaEstado = { items: [], total: 0, loading: true, loadingMore: false };

interface KanbanBoardProps {
  workspaceId: string;
  filtros: KanbanFiltros;
  // Incrementar este número força recarregar todas as colunas do zero
  // (usado após criar/editar/excluir tarefas ou importar do Bitrix).
  refreshSignal: number;
  onSelectTarefa: (tarefa: Tarefa) => void;
  onUpdateStatus: (tarefaId: string, novoStatus: StatusTarefa) => void;
  onQuickCreate: (status: StatusTarefa) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  workspaceId,
  filtros,
  refreshSignal,
  onSelectTarefa,
  onUpdateStatus,
  onQuickCreate,
}) => {
  const storageKey = getKanbanStorageKey(workspaceId);

  const [colunas, setColunas] = useState<(KanbanColumnData & { cardBg?: string })[]>(() =>
    getStoredColunas(workspaceId),
  );

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(colunas));
    } catch (e) {
      console.error('Erro ao salvar colunas:', e);
    }
  }, [colunas, storageKey]);

  useEffect(() => {
    setColunas(getStoredColunas(workspaceId));
  }, [storageKey, workspaceId]);

  // Tarefas importadas (ex.: Bitrix) ou criadas em outro navegador podem ter
  // etapas que não existem na lista de colunas deste dispositivo (que fica no
  // localStorage). Sem coluna, essas tarefas não apareciam no Kanban. Aqui
  // detectamos as etapas com tarefas e criamos as colunas que faltam.
  useEffect(() => {
    let ativo = true;
    tarefasApi
      .getResumoEtapas({ projetoId: workspaceId })
      .then((res) => {
        if (!ativo) return;
        const existentes = new Set(getStoredColunas(workspaceId).map((c) => c.id));
        const faltantes = Object.entries(res.contadoresPorEtapa || {})
          .filter(([status, qtd]) => qtd > 0 && !existentes.has(status))
          .map(([status]) => ({
            id: status,
            titulo: status.replace(/^col_\d+_/i, '').replace(/_/g, ' ').toUpperCase(),
            subtitulo: 'Etapa encontrada nas tarefas',
            headerBg: '#8F8271',
            cardBg: '#FFFFFF',
            headerTextColor: '#FFFFFF',
            isDefault: false,
          }));
        if (faltantes.length === 0) return;
        setColunas((prev) => {
          const ids = new Set(prev.map((c) => c.id));
          const novas = faltantes.filter((c) => !ids.has(c.id));
          return novas.length ? [...prev, ...novas] : prev;
        });
      })
      .catch((e) => console.error('Erro ao detectar etapas do workspace:', e));
    return () => {
      ativo = false;
    };
  }, [workspaceId, refreshSignal]);

  // Dados de cada coluna são carregados sob demanda (paginados), não vêm
  // mais prontos do componente pai — cada etapa só busca o que precisa
  // mostrar, e busca mais conforme o usuário rola até o fim da lista.
  const [columnData, setColumnData] = useState<Record<string, ColunaEstado>>({});
  const columnDataRef = useRef(columnData);
  useEffect(() => {
    columnDataRef.current = columnData;
  }, [columnData]);

  const fetchColuna = useCallback(async (colId: string, reset: boolean) => {
    // Quando uma pílula rápida pina um status literal diferente desta coluna,
    // o resultado é sempre vazio — não vale a pena nem consultar o servidor.
    if (filtros.statusExato && filtros.statusExato !== colId) {
      setColumnData((prev) => ({ ...prev, [colId]: { items: [], total: 0, loading: false, loadingMore: false } }));
      return;
    }

    setColumnData((prev) => {
      const existente = prev[colId];
      return {
        ...prev,
        [colId]: {
          items: reset ? [] : existente?.items || [],
          total: existente?.total ?? 0,
          loading: reset,
          loadingMore: !reset,
        },
      };
    });

    const skip = reset ? 0 : columnDataRef.current[colId]?.items.length || 0;

    try {
      const res = await tarefasApi.getColuna({
        status: colId,
        projetoId: workspaceId,
        search: filtros.search,
        responsavelId: filtros.responsavelId,
        prioridade: filtros.prioridade,
        skip,
        take: PAGE_SIZE,
      });
      setColumnData((prev) => {
        const itensAnteriores = reset ? [] : prev[colId]?.items || [];
        return {
          ...prev,
          [colId]: {
            items: [...itensAnteriores, ...res.items],
            total: res.total,
            loading: false,
            loadingMore: false,
          },
        };
      });
    } catch (e) {
      console.error(`Erro ao carregar a coluna "${colId}" do Kanban:`, e);
      setColumnData((prev) => ({
        ...prev,
        [colId]: { ...(prev[colId] || ESTADO_INICIAL), loading: false, loadingMore: false },
      }));
    }
  }, [workspaceId, filtros.search, filtros.responsavelId, filtros.prioridade, filtros.statusExato]);

  // (Re)carrega todas as colunas do zero sempre que o workspace, os filtros
  // ativos ou a lista de etapas mudam — ou quando o pai pede um refresh
  // explícito após criar/editar/excluir uma tarefa em outro lugar da tela.
  const colunaIds = colunas.map((c) => c.id).join('|');
  useEffect(() => {
    colunas.forEach((col) => fetchColuna(col.id, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colunaIds, fetchColuna, refreshSignal]);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);

  // Modais de Coluna
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumnData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(0);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (activeDropColumn !== columnId) {
      setActiveDropColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Move a tarefa localmente (entre os itens já carregados de cada coluna) de
  // forma otimista, sem precisar recarregar nada, e dispara a atualização real.
  const moveTarefaLocal = (tarefaId: string, novaColunaId: string) => {
    let tarefaMovida: Tarefa | undefined;
    let colunaOrigemId: string | undefined;
    for (const [colId, estado] of Object.entries(columnDataRef.current)) {
      const encontrada = estado.items.find((t) => t.id === tarefaId);
      if (encontrada) {
        tarefaMovida = encontrada;
        colunaOrigemId = colId;
        break;
      }
    }
    if (!tarefaMovida || colunaOrigemId === novaColunaId) return;

    setColumnData((prev) => {
      const origem = prev[colunaOrigemId!];
      const destino = prev[novaColunaId];
      const tarefaAtualizada = { ...tarefaMovida!, status: novaColunaId as StatusTarefa };
      return {
        ...prev,
        [colunaOrigemId!]: origem
          ? { ...origem, items: origem.items.filter((t) => t.id !== tarefaId), total: Math.max(0, origem.total - 1) }
          : origem,
        [novaColunaId]: destino
          ? { ...destino, items: [tarefaAtualizada, ...destino.items], total: destino.total + 1 }
          : { items: [tarefaAtualizada], total: 1, loading: false, loadingMore: false },
      };
    });

    onUpdateStatus(tarefaId, novaColunaId as StatusTarefa);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setActiveDropColumn(null);

    if (draggingColumnId) {
      handleReorderColumn(draggingColumnId, columnId);
      setDraggingColumnId(null);
      return;
    }

    const id = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (id) {
      moveTarefaLocal(id, columnId);
      setDraggedTaskId(null);
    }
  };

  const handleColumnDragStart = (e: React.DragEvent, columnId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    setDraggingColumnId(columnId);
  };

  const handleReorderColumn = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setColunas((prev) => {
      const fromIndex = prev.findIndex((c) => c.id === fromId);
      const toIndex = prev.findIndex((c) => c.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  const handleOpenCreateColumn = () => {
    setEditingColumn(null);
    setEditingIndex(colunas.length);
    setIsColumnModalOpen(true);
  };

  const handleOpenEditColumn = (col: KanbanColumnData, index: number) => {
    setEditingColumn(col);
    setEditingIndex(index);
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = (savedCol: KanbanColumnData) => {
    if (editingColumn) {
      setColunas((prev) =>
        prev.map((c) => (c.id === savedCol.id ? { ...c, ...savedCol } : c))
      );
    } else {
      // A mudança na lista de colunas já dispara o efeito que recarrega
      // todas as etapas, incluindo esta nova — não precisa buscar aqui também.
      setColunas((prev) => [...prev, { ...savedCol, cardBg: '#FFFFFF' }]);
    }
  };

  const handleDeleteColumn = async (colId: string) => {
    const totalNaColuna = columnData[colId]?.total ?? 0;
    let fallbackCol: string | null = null;

    if (totalNaColuna > 0) {
      const confirmMove = window.confirm(
        `Esta coluna possui ${totalNaColuna} tarefa(s). Deseja mover essas tarefas para a primeira etapa e excluir a coluna?`
      );
      if (!confirmMove) return;

      fallbackCol = colunas.find((c) => c.id !== colId)?.id || 'A_FAZER';
      try {
        await tarefasApi.moverEtapa(colId, fallbackCol, workspaceId);
      } catch (e) {
        console.error('Erro ao mover tarefas da coluna excluída:', e);
        window.alert('Não foi possível mover as tarefas desta coluna. Tente novamente.');
        return;
      }
    } else {
      if (!window.confirm('Tem certeza que deseja excluir esta coluna?')) return;
    }

    // A mudança na lista de colunas já dispara o efeito que recarrega todas
    // as etapas restantes, incluindo a etapa de destino das tarefas movidas.
    setColunas((prev) => prev.filter((c) => c.id !== colId));
    setColumnData((prev) => {
      const copy = { ...prev };
      delete copy[colId];
      return copy;
    });
  };

  const handleMoveLeft = (index: number) => {
    if (index <= 0) return;
    setColunas((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setEditingIndex(index - 1);
  };

  const handleMoveRight = (index: number) => {
    if (index >= colunas.length - 1) return;
    setColunas((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setEditingIndex(index + 1);
  };

  return (
    <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden bg-[#FAF7F2] relative" onDragEnd={() => { setDraggedTaskId(null); setActiveDropColumn(null); setDraggingColumnId(null); }}>
      {/* Barra Superior Discreta de Configurações das Etapas */}
      <div className="px-6 py-2 bg-[#FFFDF8]/70 border-b border-[#E5D9C8] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#625746] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#C7A15F]" />
            {colunas.length} etapas no pipeline
          </span>
        </div>

        <button
          onClick={handleOpenCreateColumn}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#181512] hover:bg-[#2B261F] text-white transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Etapa
        </button>
      </div>

      {/* Área das Colunas com Limitações Visíveis e Scroll Horizontal */}
      <div className="flex-1 min-h-0 w-full flex overflow-x-auto px-4 lg:px-6 pb-4 pt-4 gap-4">
        {colunas.map((coluna, index) => {
          const estado = columnData[coluna.id] || ESTADO_INICIAL;
          const tarefasColuna = estado.items;
          const isHovered = activeDropColumn === coluna.id;
          const hasMore = tarefasColuna.length < estado.total;

          return (
            <div
              key={coluna.id}
              onDragOver={(e) => handleDragOver(e, coluna.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, coluna.id)}
              className={`w-[270px] sm:w-[288px] max-w-[85vw] min-h-0 h-full flex flex-col rounded-2xl bg-[#F0EDE6]/70 border transition-colors duration-150 shrink-0 p-2 ${
                isHovered
                  ? 'bg-[#EEE7DC] border-[#C7A15F] ring-2 ring-[#C7A15F]/20'
                  : 'border-transparent'
              }`}
            >
              {/* Header da Coluna com Faixa Chevron Colorida (Cada coluna com sua cor) */}
              <div className="pb-2 shrink-0 select-none">
                <div
                  draggable
                  onDragStart={(e) => handleColumnDragStart(e, coluna.id)}
                  onDragEnd={() => setDraggingColumnId(null)}
                  className={`flex items-center justify-between gap-2 px-2 py-2 text-[#39332A] text-[11px] font-semibold group border-t-2 rounded-t-lg cursor-grab active:cursor-grabbing transition-opacity ${
                    draggingColumnId === coluna.id ? 'opacity-40' : 'opacity-100'
                  }`}
                  style={{
                    borderTopColor: coluna.headerBg,
                  }}
                  title="Arraste para reordenar esta etapa"
                >
                  <GripVertical className="w-3 h-3 text-[#948877] shrink-0" />

                  <div
                    onClick={() => handleOpenEditColumn(coluna, index)}
                    className="flex min-w-0 items-center gap-2 cursor-pointer flex-1"
                    title="Clique para editar esta etapa"
                  >
                    <span className="line-clamp-2 leading-snug" title={coluna.titulo}>{coluna.titulo}</span>
                    <span className="text-[10px] font-semibold text-[#827869] shrink-0 bg-white/80 px-1.5 py-0.5 rounded-md tabular-nums">
                      {estado.loading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : estado.total}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mr-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditColumn(coluna, index);
                      }}
                      title="Editar esta coluna"
                      className="w-6 h-6 rounded-md hover:bg-white text-[#948877] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickCreate(coluna.id as StatusTarefa);
                      }}
                      title={`Adicionar tarefa em ${coluna.titulo}`}
                      className="w-6 h-6 rounded-md hover:bg-white text-[#948877] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Botão de Tarefa Rápida */}
              <div className="px-1 pb-2 flex items-center justify-center shrink-0">
                <button
                  onClick={() => onQuickCreate(coluna.id as StatusTarefa)}
                  className="w-full py-1 px-3 rounded-xl text-[11px] font-bold text-[#8F8271] hover:text-[#1E1A16] bg-white/60 hover:bg-white border border-[#D8CBB8]/70 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-[#8F8271]" />
                  <span>Adicionar tarefa</span>
                </button>
              </div>

              {/* Lista de Cards da Coluna com Scroll Vertical */}
                {estado.loading ? (
                  <div className="flex-1 flex items-center justify-center text-[#8F8271]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : tarefasColuna.length === 0 ? (
                  <div
                    onClick={() => onQuickCreate(coluna.id as StatusTarefa)}
                    className="h-24 rounded-[18px] border-2 border-dashed border-[#D8CBB8] bg-white/50 hover:bg-white flex flex-col items-center justify-center gap-1 text-center p-3 cursor-pointer transition-all hover:border-[#1E1A16] shadow-2xs group"
                  >
                    <div className="w-6 h-6 rounded-full bg-white text-[#1E1A16] border border-[#D8CBB8] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#8F8271] group-hover:text-[#1E1A16]">
                      Adicionar tarefa nesta etapa
                    </span>
                  </div>
                ) : (
                  <VirtualTaskColumn
                    tarefas={tarefasColuna}
                    label={`Tarefas: ${coluna.titulo}`}
                    accentColor={coluna.headerBg}
                    draggedTaskId={draggedTaskId}
                    onSelectTarefa={onSelectTarefa}
                    onDragStart={handleDragStart}
                    hasMore={hasMore}
                    loadingMore={estado.loadingMore}
                    onEndReached={() => fetchColuna(coluna.id, false)}
                  />
                )}
            </div>
          );
        })}

        {/* Card Final para Adicionar Nova Etapa */}
        <div
          onClick={handleOpenCreateColumn}
          className="min-w-[220px] max-w-[240px] h-[260px] rounded-[22px] border-2 border-dashed border-[#D8CBB8] hover:border-[#1E1A16] bg-white/40 hover:bg-white p-5 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2.5 text-center shrink-0 group select-none mt-2"
        >
          <div className="w-10 h-10 rounded-full bg-[#181512] text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-[#1E1A16] group-hover:text-[#8F6F2D] transition-colors">
              Adicionar Etapa
            </h4>
            <p className="text-[11px] text-[#8F8271] mt-0.5">
              Crie uma nova coluna colorida
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Gestão de Colunas */}
      {isColumnModalOpen && (
        <ColumnModal
          column={editingColumn}
          totalColumns={colunas.length}
          columnIndex={editingIndex}
          onClose={() => {
            setIsColumnModalOpen(false);
            setEditingColumn(null);
          }}
          onSave={handleSaveColumn}
          onDelete={handleDeleteColumn}
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
        />
      )}
    </div>
  );
};
