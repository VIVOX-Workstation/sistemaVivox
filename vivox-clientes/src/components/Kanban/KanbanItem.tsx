import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { EscopoItem } from './EscopoKanban';

interface Props {
  item: EscopoItem;
  isOverlay?: boolean;
}

export function KanbanItem({ item, isOverlay }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${isOverlay ? 'shadow-xl scale-105 rotate-2' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="absolute left-2 top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-40 transition-opacity">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="pl-5">
        <p className={`font-semibold text-sm ${item.status === 'CONCLUIDO' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
          {item.titulo}
        </p>
        {item.descricao && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {item.descricao}
          </p>
        )}
      </div>
    </div>
  );
}
