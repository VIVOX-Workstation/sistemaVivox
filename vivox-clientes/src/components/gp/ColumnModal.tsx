import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Trash2, ArrowLeft, ArrowRight, Palette } from 'lucide-react';

export interface KanbanColumnData {
  id: string;
  titulo: string;
  subtitulo?: string;
  headerBg: string;
  headerTextColor?: string;
  isDefault?: boolean;
}

const PALETA_CORES = [
  { hex: '#00AEEF', label: 'Azul Celeste' },
  { hex: '#FFA800', label: 'Laranja / Âmbar' },
  { hex: '#0284C7', label: 'Azul Vibrante' },
  { hex: '#FF5B5B', label: 'Coral / Vermelho' },
  { hex: '#24C16E', label: 'Verde Esmeralda' },
  { hex: '#8B5CF6', label: 'Roxo Púrpura' },
  { hex: '#EC4899', label: 'Rosa Pink' },
  { hex: '#06B6D4', label: 'Ciano Turquesa' },
  { hex: '#C7A15F', label: 'Dourado Vivox' },
  { hex: '#1E1A16', label: 'Grafite Nobre' },
  { hex: '#6366F1', label: 'Índigo' },
  { hex: '#84CC16', label: 'Verde Lima' },
];

interface ColumnModalProps {
  column?: KanbanColumnData | null; // se nulo, modo criação
  totalColumns: number;
  columnIndex?: number;
  onClose: () => void;
  onSave: (column: KanbanColumnData) => void;
  onDelete?: (id: string) => void;
  onMoveLeft?: (index: number) => void;
  onMoveRight?: (index: number) => void;
}

export const ColumnModal: React.FC<ColumnModalProps> = ({
  column,
  totalColumns,
  columnIndex = 0,
  onClose,
  onSave,
  onDelete,
  onMoveLeft,
  onMoveRight,
}) => {
  const isEditing = Boolean(column);

  const [titulo, setTitulo] = useState(column?.titulo || '');
  const [subtitulo, setSubtitulo] = useState(column?.subtitulo || '');
  const [headerBg, setHeaderBg] = useState(column?.headerBg || '#00AEEF');

  useEffect(() => {
    if (column) {
      setTitulo(column.titulo);
      setSubtitulo(column.subtitulo || '');
      setHeaderBg(column.headerBg);
    } else {
      setTitulo('');
      setSubtitulo('');
      setHeaderBg('#00AEEF');
    }
  }, [column]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const columnId = column?.id || `col_${Date.now()}_${titulo.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    onSave({
      id: columnId,
      titulo: titulo.trim().toUpperCase(),
      subtitulo: subtitulo.trim() || undefined,
      headerBg,
      headerTextColor: '#FFFFFF',
      isDefault: column?.isDefault || false,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0D0B]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 select-none">
        {/* Topo do Modal */}
        <div className="px-6 py-4 bg-[#F6F0E7] border-b border-[#E5D9C8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-xs"
              style={{ backgroundColor: headerBg }}
            />
            <h3 className="text-sm font-black text-[#1E1A16] uppercase tracking-wider">
              {isEditing ? 'Editar Etapa do Kanban' : 'Nova Etapa / Coluna'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#EEE7DC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Pré-visualização da Faixa Chevron */}
          <div>
            <label className="text-[11px] font-bold text-[#8F8271] uppercase tracking-wider block mb-1.5">
              Pré-visualização do Cabeçalho
            </label>
            <div
              className="relative flex items-center justify-between px-4 py-2.5 rounded-l-xl text-white font-black text-xs uppercase tracking-wider shadow-xs overflow-hidden transition-all duration-200"
              style={{
                backgroundColor: headerBg,
                clipPath: 'polygon(0% 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 0% 100%)',
              }}
            >
              <span className="truncate drop-shadow-2xs">
                {titulo.trim() ? titulo.toUpperCase() : 'NOME DA ETAPA'}
              </span>
              <span className="text-xs font-black text-white/90 bg-black/15 px-2 py-0.2 rounded-full mr-2">
                0
              </span>
            </div>
          </div>

          {/* Nome da Coluna */}
          <div>
            <label className="text-[11px] font-bold text-[#8F8271] uppercase tracking-wider block mb-1.5">
              Nome da Etapa *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: DESIGN & CRIATIVOS, AGUARDANDO CLIENTE..."
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F] focus:bg-white text-[#1E1A16]"
            />
          </div>

          {/* Subtítulo / Descrição Opcional */}
          <div>
            <label className="text-[11px] font-bold text-[#8F8271] uppercase tracking-wider block mb-1.5">
              Subtítulo / Descrição (Opcional)
            </label>
            <input
              type="text"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Ex: Peças em produção pela equipe"
              className="w-full text-xs px-3.5 py-2 bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F] focus:bg-white text-[#1E1A16]"
            />
          </div>

          {/* Seletor de Cores da Faixa */}
          <div>
            <label className="text-[11px] font-bold text-[#8F8271] uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Palette className="w-3.5 h-3.5 text-[#C7A15F]" />
              Cor da Faixa da Coluna
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PALETA_CORES.map((cor) => {
                const isSelected = headerBg === cor.hex;
                return (
                  <button
                    key={cor.hex}
                    type="button"
                    title={cor.label}
                    onClick={() => setHeaderBg(cor.hex)}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-150 shadow-2xs cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-[#1E1A16] scale-110 shadow-md'
                        : 'hover:scale-105 opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: cor.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Se estiver editando: Opções de Reordenar (Mover Esquerda/Direita) */}
          {isEditing && totalColumns > 1 && (
            <div className="pt-2 border-t border-[#E5D9C8] flex items-center justify-between text-xs">
              <span className="text-[#625746] font-medium">Posição da Coluna:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={columnIndex === 0}
                  onClick={() => onMoveLeft && onMoveLeft(columnIndex)}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#D8CBB8] hover:bg-[#EEE7DC] text-[#1E1A16] disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                  title="Mover para a esquerda"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Esquerda
                </button>
                <button
                  type="button"
                  disabled={columnIndex >= totalColumns - 1}
                  onClick={() => onMoveRight && onMoveRight(columnIndex)}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#D8CBB8] hover:bg-[#EEE7DC] text-[#1E1A16] disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                  title="Mover para a direita"
                >
                  Direita <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Rodapé de Ações */}
          <div className="pt-4 border-t border-[#E5D9C8] flex items-center justify-between gap-3">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (column?.id) {
                    onDelete(column.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-[#B83B32] hover:bg-[#B83B32]/10 border border-[#B83B32]/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Coluna
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#625746] hover:bg-[#EEE7DC] transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!titulo.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C7A15F] hover:bg-[#B89455] text-[#1D160B] shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isEditing ? 'Salvar Alterações' : 'Criar Coluna'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
