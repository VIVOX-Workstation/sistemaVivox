import React from 'react';
import type { Tarefa, PrioridadeTarefa } from '../../types';
import { ArrowUpRight, Building2, Calendar, MessageSquare, CheckSquare, Flame, AlertCircle, User as UserIcon } from 'lucide-react';

interface TaskCardProps {
  tarefa: Tarefa;
  cardBg?: string;
  accentColor?: string;
  showWorkspace?: boolean;
  onClick?: () => void;
  onSelect?: (tarefa: Tarefa) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
}

const priorities: Record<PrioridadeTarefa, { label: string; style: string }> = {
  URGENTE: { label: 'Urgente', style: 'bg-red-50 text-red-700' },
  ALTA: { label: 'Alta', style: 'bg-orange-50 text-orange-700' },
  MEDIA: { label: 'Média', style: 'bg-[#F3F1EB] text-[#756A59]' },
  BAIXA: { label: 'Baixa', style: 'bg-slate-50 text-slate-500' },
};

export const TaskCard: React.FC<TaskCardProps> = React.memo(({
  tarefa, cardBg = '#FFFFFF', accentColor, showWorkspace = true, onClick, onSelect, onDragStart,
}) => {
  const open = () => onClick ? onClick() : onSelect?.(tarefa);
  const priority = priorities[tarefa.prioridade];
  const total = tarefa.checklist?.length || 0;
  const completed = tarefa.checklist?.filter(item => item.concluido).length || 0;
  const comments = tarefa._count?.comentarios ?? tarefa.comentarios?.length ?? 0;
  const due = tarefa.prazo ? new Date(tarefa.prazo) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const validDue = due && !Number.isNaN(due.getTime()) ? due : null;
  const finished = tarefa.status === 'CONCLUIDA' || tarefa.status === 'CANCELADA';
  const overdue = Boolean(validDue && validDue < today && !finished);
  const isToday = validDue?.toDateString() === today.toDateString();
  const dueLabel = validDue?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  const initials = tarefa.responsavel?.nome.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <article draggable={Boolean(onDragStart)} onDragStart={event => onDragStart?.(event, tarefa.id)} onClick={open}
      className="group flex min-w-0 flex-col gap-2 rounded-lg border border-l-[3px] border-[#E5E0D7] p-2.5 text-[#29251F] shadow-[0_1px_3px_rgba(40,32,20,0.04)] cursor-pointer transition-[border-color,box-shadow] duration-150 hover:border-[#C7A15F] hover:shadow-[0_4px_12px_rgba(40,32,20,0.08)]"
      style={{ backgroundColor: cardBg, borderLeftColor: accentColor }}>
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${priority.style}`}>
          {tarefa.prioridade === 'URGENTE' && <Flame className="h-2.5 w-2.5" />}{priority.label}
        </span>
        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 text-[#AAA193] group-hover:text-[#8F6F2D]" />
      </div>
      <h4 className="min-w-0 text-[12.5px] font-semibold leading-[1.35]">
        <button type="button" onClick={event => { event.stopPropagation(); open(); }} title={tarefa.titulo}
          className="block w-full cursor-pointer text-left [overflow-wrap:anywhere] line-clamp-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#C7A15F]">
          {tarefa.titulo}
        </button>
      </h4>
      {(tarefa.cliente || tarefa.servico) && (
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-[#827869]">
          {tarefa.cliente && <span className="inline-flex min-w-0 max-w-full items-center gap-1" title={tarefa.cliente.nomeFantasia}>
            <Building2 className="h-3 w-3 shrink-0" /><span className="truncate">{tarefa.cliente.nomeFantasia}</span>
          </span>}
          {tarefa.servico && <span className="max-w-full truncate rounded bg-[#F6F4EF] px-1.5 py-0.5 text-[9.5px]" title={tarefa.servico.tipoServico}>{tarefa.servico.tipoServico.replace(/_/g, ' ')}</span>}
        </div>
      )}
      {total > 0 && <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-[#827869]">
          <span className="inline-flex items-center gap-1"><CheckSquare className="h-3 w-3" />Checklist</span><span>{completed}/{total}</span>
        </div>
        <div role="progressbar" aria-label="Checklist concluído" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed} className="h-1 overflow-hidden rounded-full bg-[#EEEAE3]">
          <div className={`h-full rounded-full ${completed === total ? 'bg-[#438664]' : 'bg-[#C7A15F]'}`} style={{ width: `${completed / total * 100}%` }} />
        </div>
      </div>}
      <div className="flex min-w-0 items-center gap-1.5 border-t border-[#F0ECE5] pt-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5" title={`Responsável: ${tarefa.responsavel?.nome || 'Não atribuído'}`}>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EEE8DB] text-[8.5px] font-bold text-[#77613B]">{initials || <UserIcon className="h-2.5 w-2.5" />}</span>
          <span className="truncate text-[11px] text-[#716757]">{tarefa.responsavel?.nome || 'Não atribuído'}</span>
        </div>
        {comments > 0 && <span title={`${comments} comentários`} className="inline-flex shrink-0 items-center gap-1 text-[10px] text-[#928879]"><MessageSquare className="h-3 w-3" />{comments}</span>}
      </div>
      {validDue && <div className={`flex items-center gap-1 text-[10px] ${overdue ? 'text-red-600' : isToday && !finished ? 'text-amber-700' : 'text-[#928879]'}`} title={`Prazo: ${validDue.toLocaleDateString('pt-BR')}`}>
        {overdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
        {overdue ? `Atrasada · ${dueLabel}` : isToday ? 'Hoje' : dueLabel}
      </div>}
      {showWorkspace && tarefa.projeto && <span title={tarefa.projeto.nome} className="truncate text-[10px] text-[#928879]">{tarefa.projeto.nome}</span>}
    </article>
  );
});
