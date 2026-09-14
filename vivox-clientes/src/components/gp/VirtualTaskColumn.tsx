import { memo, useCallback, useEffect, useRef } from 'react';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';
import type { Tarefa } from '../../types';
import { TaskCard } from './TaskCard';

interface VirtualTaskColumnProps {
  tarefas: Tarefa[];
  label: string;
  accentColor?: string;
  draggedTaskId: string | null;
  onSelectTarefa: (tarefa: Tarefa) => void;
  onDragStart: (event: React.DragEvent, id: string) => void;
  // Paginação sob demanda: quando a rolagem se aproxima do fim da lista já
  // carregada e ainda há mais itens no servidor, pede a próxima página.
  hasMore?: boolean;
  loadingMore?: boolean;
  onEndReached?: () => void;
}

const END_REACHED_THRESHOLD = 6;

export const VirtualTaskColumn = memo(function VirtualTaskColumn({
  tarefas, label, accentColor, draggedTaskId, onSelectTarefa, onDragStart,
  hasMore = false, loadingMore = false, onEndReached,
}: VirtualTaskColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const getItemKey = useCallback((index: number) => tarefas[index].id, [tarefas]);
  const draggedIndex = draggedTaskId ? tarefas.findIndex(task => task.id === draggedTaskId) : -1;
  const rangeExtractor = useCallback((range: Parameters<typeof defaultRangeExtractor>[0]) => {
    const indexes = defaultRangeExtractor(range);
    // O navegador precisa manter a origem do drag montada durante a rolagem.
    if (draggedIndex >= 0 && !indexes.includes(draggedIndex)) {
      indexes.push(draggedIndex);
      indexes.sort((a, b) => a - b);
    }
    return indexes;
  }, [draggedIndex]);
  const virtualizer = useVirtualizer({
    count: tarefas.length,
    getScrollElement: () => scrollRef.current,
    getItemKey,
    estimateSize: () => 160,
    overscan: 3,
    gap: 8,
    rangeExtractor,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const lastVisibleIndex = virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : -1;

  useEffect(() => {
    if (!hasMore || loadingMore || !onEndReached) return;
    if (lastVisibleIndex >= tarefas.length - END_REACHED_THRESHOLD) {
      onEndReached();
    }
  }, [lastVisibleIndex, hasMore, loadingMore, onEndReached, tarefas.length]);

  return (
    <div
      ref={scrollRef}
      role="list"
      aria-label={label}
      tabIndex={0}
      className="flex-1 min-h-0 overflow-y-auto px-1 pb-2"
      style={{ overflowAnchor: 'none' }}
    >
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualItems.map(row => (
          <div
            key={row.key}
            ref={virtualizer.measureElement}
            data-index={row.index}
            role="listitem"
            aria-posinset={row.index + 1}
            aria-setsize={tarefas.length}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${row.start}px)` }}
          >
            <TaskCard tarefa={tarefas[row.index]} accentColor={accentColor} showWorkspace={false} onSelect={onSelectTarefa} onDragStart={onDragStart} />
          </div>
        ))}
      </div>
      {loadingMore && (
        <div className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-[#8F8271]">
          <Loader2 className="w-3 h-3 animate-spin" />
          Carregando mais...
        </div>
      )}
    </div>
  );
});
