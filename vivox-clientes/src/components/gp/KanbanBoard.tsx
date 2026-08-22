import React, { useState, useEffect } from 'react';
import type { Tarefa, StatusTarefa } from '../../types';
import { TaskCard } from './TaskCard';
import { ColumnModal } from './ColumnModal';
import type { KanbanColumnData } from './ColumnModal';
import { 
  Plus, 
  Edit3, 
  RotateCcw, 
  FolderKanban, 
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

const DEFAULT_COLUNAS: (KanbanColumnData & { cardBg: string })[] = [
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

interface KanbanBoardProps {
  tarefas: Tarefa[];
  workspaceId?: string | null;
  onSelectTarefa: (tarefa: Tarefa) => void;
  onUpdateStatus: (tarefaId: string, novoStatus: StatusTarefa) => void;
  onQuickCreate: (status: StatusTarefa) => void;
  onOpenWorkspaceHub?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tarefas,
  workspaceId,
  onSelectTarefa,
  onUpdateStatus,
  onQuickCreate,
  onOpenWorkspaceHub,
}) => {
  const storageKey = `vivox_kanban_columns_v3_${workspaceId || 'default'}`;

  const [colunas, setColunas] = useState<(KanbanColumnData & { cardBg?: string })[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler colunas do localStorage:', e);
    }
    return DEFAULT_COLUNAS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(colunas));
    } catch (e) {
      console.error('Erro ao salvar colunas:', e);
    }
  }, [colunas, storageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setColunas(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar colunas:', e);
    }
    setColunas(DEFAULT_COLUNAS);
  }, [storageKey]);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<string | null>(null);

  // Modais de Coluna
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumnData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(0);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (activeDropColumn !== columnId) {
      setActiveDropColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setActiveDropColumn(null);
    const id = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (id) {
      onUpdateStatus(id, columnId as StatusTarefa);
      setDraggedTaskId(null);
    }
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
      setColunas((prev) => [...prev, { ...savedCol, cardBg: '#FFFFFF' }]);
    }
  };

  const handleDeleteColumn = (colId: string) => {
    const tarefasNaColuna = tarefas.filter((t) => t.status === colId);
    if (tarefasNaColuna.length > 0) {
      const confirmMove = window.confirm(
        `Esta coluna possui ${tarefasNaColuna.length} tarefa(s). Deseja mover essas tarefas para a primeira etapa e excluir a coluna?`
      );
      if (!confirmMove) return;

      const fallbackCol = colunas.find((c) => c.id !== colId)?.id || 'A_FAZER';
      tarefasNaColuna.forEach((t) => {
        onUpdateStatus(t.id, fallbackCol as StatusTarefa);
      });
    } else {
      if (!window.confirm('Tem certeza que deseja excluir esta coluna?')) return;
    }

    setColunas((prev) => prev.filter((c) => c.id !== colId));
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

  const handleResetColumns = () => {
    if (window.confirm('Deseja restaurar as 5 etapas padrão do Kanban?')) {
      setColunas(DEFAULT_COLUNAS);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden bg-[#FAF7F2] relative">
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
      <div className="flex-1 w-full h-full flex overflow-x-auto px-6 pb-20 pt-3 gap-4">
        {colunas.map((coluna, index) => {
          const tarefasColuna = tarefas.filter((t) => t.status === coluna.id);
          const isHovered = activeDropColumn === coluna.id;

          return (
            <div
              key={coluna.id}
              onDragOver={(e) => handleDragOver(e, coluna.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, coluna.id)}
              className={`flex-1 min-w-[300px] max-w-[340px] h-full flex flex-col rounded-[24px] bg-[#F6F2EA]/60 border transition-all duration-200 shrink-0 p-2.5 shadow-2xs ${
                isHovered
                  ? 'bg-[#EEE7DC] border-[#C7A15F] ring-2 ring-[#C7A15F]/20 scale-[1.01]'
                  : 'border-[#E5D9C8]/90 hover:border-[#D8CBB8]'
              }`}
            >
              {/* Header da Coluna com Faixa Chevron Colorida (Cada coluna com sua cor) */}
              <div className="pb-2 shrink-0 select-none">
                <div
                  className="relative flex items-center justify-between px-3.5 py-2.5 rounded-l-xl text-white font-black text-[11px] uppercase tracking-wider shadow-xs overflow-hidden transition-all duration-150 hover:brightness-105 group"
                  style={{
                    backgroundColor: coluna.headerBg,
                    clipPath: 'polygon(0% 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 0% 100%)',
                  }}
                >
                  <div
                    onClick={() => handleOpenEditColumn(coluna, index)}
                    className="flex items-center gap-2 truncate pr-2 cursor-pointer flex-1"
                    title="Clique para editar esta etapa"
                  >
                    <span className="truncate drop-shadow-2xs">{coluna.titulo}</span>
                    <span className="text-xs font-black text-white/95 shrink-0 bg-black/20 px-1.5 py-0.2 rounded-full">
                      {tarefasColuna.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mr-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditColumn(coluna, index);
                      }}
                      title="Editar esta coluna"
                      className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickCreate(coluna.id as StatusTarefa);
                      }}
                      title={`Adicionar tarefa em ${coluna.titulo}`}
                      className="w-5 h-5 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
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
                  className="w-full py-1.5 px-3 rounded-xl text-[11px] font-bold text-[#8F8271] hover:text-[#1E1A16] bg-white/60 hover:bg-white border border-[#D8CBB8]/70 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#8F8271]" />
                  <span>+ Tarefa rápida</span>
                </button>
              </div>

              {/* Lista de Cards da Coluna com Scroll Vertical */}
              <div className="flex-1 overflow-y-auto px-1 pb-2 flex flex-col gap-3">
                {tarefasColuna.length === 0 ? (
                  <div
                    onClick={() => onQuickCreate(coluna.id as StatusTarefa)}
                    className="h-28 rounded-[22px] border-2 border-dashed border-[#D8CBB8] bg-white/50 hover:bg-white flex flex-col items-center justify-center gap-1 text-center p-4 cursor-pointer transition-all hover:border-[#1E1A16] shadow-2xs group"
                  >
                    <div className="w-7 h-7 rounded-full bg-white text-[#1E1A16] border border-[#D8CBB8] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-[#8F8271] group-hover:text-[#1E1A16]">
                      Adicionar tarefa nesta etapa
                    </span>
                  </div>
                ) : (
                  tarefasColuna.map((tarefa) => (
                    <TaskCard
                      key={tarefa.id}
                      tarefa={tarefa}
                      cardBg="#FFFFFF"
                      onClick={() => onSelectTarefa(tarefa)}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Card Final para Adicionar Nova Etapa */}
        <div
          onClick={handleOpenCreateColumn}
          className="min-w-[260px] max-w-[280px] h-[300px] rounded-[26px] border-2 border-dashed border-[#D8CBB8] hover:border-[#1E1A16] bg-white/40 hover:bg-white p-6 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center shrink-0 group select-none mt-2"
        >
          <div className="w-12 h-12 rounded-full bg-[#181512] text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1E1A16] group-hover:text-[#8F6F2D] transition-colors">
              Adicionar Etapa
            </h4>
            <p className="text-[11px] text-[#8F8271] mt-0.5">
              Crie uma nova coluna colorida
            </p>
          </div>
        </div>
      </div>

      {/* Floating Bottom Quick Dock */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-[#FFFDF8]/95 backdrop-blur-md border border-[#D8CBB8] rounded-full px-4 py-2 shadow-lg flex items-center gap-3 select-none">
          <button
            onClick={() => onOpenWorkspaceHub && onOpenWorkspaceHub()}
            title="Ver todos os Workspaces"
            className="w-8 h-8 rounded-full text-[#625746] hover:text-[#1E1A16] hover:bg-black/5 flex items-center justify-center transition-colors cursor-pointer"
          >
            <FolderKanban className="w-4 h-4" />
          </button>

          <button
            onClick={() => onQuickCreate('A_FAZER')}
            title="Criar Nova Tarefa Imediata"
            className="w-10 h-10 rounded-full bg-[#181512] hover:bg-[#2B261F] text-white flex items-center justify-center shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
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
