import React, { useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanItem } from './KanbanItem';

export type StatusEscopoItem = 'PLANEJADO' | 'EM_DESENVOLVIMENTO' | 'CONCLUIDO';

export interface EscopoItem {
  id: string;
  titulo: string;
  descricao?: string;
  status: StatusEscopoItem;
  ordem: number;
}

interface Props {
  items: EscopoItem[];
  onStatusChange: (itemId: string, newStatus: StatusEscopoItem) => void;
  onAddItem: (status: StatusEscopoItem) => void;
}

const COLUNAS: { id: StatusEscopoItem; title: string }[] = [
  { id: 'PLANEJADO', title: 'Planejado' },
  { id: 'EM_DESENVOLVIMENTO', title: 'Em Desenvolvimento' },
  { id: 'CONCLUIDO', title: 'Concluído' }
];

export function EscopoKanban({ items, onStatusChange, onAddItem }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px de movimento para iniciar o drag, para permitir cliques rápidos sem arrastar acidentalmente
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getItemsByColumn = (status: StatusEscopoItem) => {
    return items.filter(i => i.status === status).sort((a, b) => a.ordem - b.ordem);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItem = items.find(i => i.id === activeId);
    if (!activeItem) return;

    // Se "overId" é uma das colunas (soltou na coluna vazia)
    if (COLUNAS.some(c => c.id === overId)) {
      if (activeItem.status !== overId) {
        onStatusChange(activeId, overId as StatusEscopoItem);
      }
      return;
    }

    // Se "overId" for outro item
    const overItem = items.find(i => i.id === overId);
    if (overItem && activeItem.status !== overItem.status) {
      // Moveu para a coluna do outro item
      onStatusChange(activeId, overItem.status);
    }
  };

  const activeItem = items.find(i => i.id === activeId);

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUNAS.map(col => (
          <KanbanColumn 
            key={col.id} 
            id={col.id} 
            title={col.title}
            items={getItemsByColumn(col.id)}
            onAddItem={() => onAddItem(col.id)}
          >
            <SortableContext 
              items={getItemsByColumn(col.id).map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {getItemsByColumn(col.id).map(item => (
                <KanbanItem key={item.id} item={item} />
              ))}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
        {activeItem ? <KanbanItem item={activeItem} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
