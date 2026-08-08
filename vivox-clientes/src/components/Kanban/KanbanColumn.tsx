import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Button } from '../Button';

interface Props {
  id: string;
  title: string;
  items: any[];
  onAddItem: () => void;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, items, onAddItem, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const getThemeColor = () => {
    switch (id) {
      case 'PLANEJADO': return 'bg-slate-100/50 border-slate-200 text-slate-700';
      case 'EM_DESENVOLVIMENTO': return 'bg-indigo-50/50 border-indigo-100 text-indigo-700';
      case 'CONCLUIDO': return 'bg-emerald-50/50 border-emerald-100 text-emerald-700';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className={`flex flex-col rounded-xl border ${getThemeColor()} transition-colors ${isOver ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}>
      <div className="p-4 border-b border-inherit flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          {title}
          <span className="bg-white/60 text-xs py-0.5 px-2 rounded-full font-medium shadow-sm">
            {items.length}
          </span>
        </h4>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md" onClick={onAddItem}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <div 
        ref={setNodeRef} 
        className="flex-1 p-3 min-h-[150px] flex flex-col gap-3"
      >
        {children}
        {items.length === 0 && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-inherit rounded-lg opacity-50">
            <span className="text-xs font-medium">Solte itens aqui</span>
          </div>
        )}
      </div>
    </div>
  );
}
