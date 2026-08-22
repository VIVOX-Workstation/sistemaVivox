import React from 'react';
import type { Tarefa, StatusTarefa } from '../../types';
import { TaskCard } from './TaskCard';
import { AlertCircle, Clock, Calendar, CalendarDays, HelpCircle } from 'lucide-react';

interface TaskDeadlineViewProps {
  tarefas: Tarefa[];
  onSelectTarefa: (tarefa: Tarefa) => void;
  onUpdateStatus: (tarefaId: string, novoStatus: StatusTarefa) => void;
}

export const TaskDeadlineView: React.FC<TaskDeadlineViewProps> = ({
  tarefas,
  onSelectTarefa,
}) => {
  const agora = new Date();
  const hojeZero = new Date(agora);
  hojeZero.setHours(0, 0, 0, 0);

  const fimSemana = new Date(hojeZero);
  fimSemana.setDate(hojeZero.getDate() + (6 - hojeZero.getDay()));
  fimSemana.setHours(23, 59, 59, 999);

  const atrasadas: Tarefa[] = [];
  const hoje: Tarefa[] = [];
  const estaSemana: Tarefa[] = [];
  const proximasSemanas: Tarefa[] = [];
  const semPrazo: Tarefa[] = [];

  tarefas.forEach((tarefa) => {
    if (tarefa.status === 'CONCLUIDA' || tarefa.status === 'CANCELADA') {
      return;
    }

    if (!tarefa.prazo) {
      semPrazo.push(tarefa);
      return;
    }

    const prazo = new Date(tarefa.prazo);
    prazo.setHours(0, 0, 0, 0);

    const diffDays = Math.round((prazo.getTime() - hojeZero.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      atrasadas.push(tarefa);
    } else if (diffDays === 0) {
      hoje.push(tarefa);
    } else if (prazo <= fimSemana) {
      estaSemana.push(tarefa);
    } else {
      proximasSemanas.push(tarefa);
    }
  });

  const secoes = [
    {
      id: 'atrasadas',
      titulo: 'Atrasadas',
      subtitulo: 'Requer atenção imediata',
      icon: AlertCircle,
      corClass: 'text-[#B83B32]',
      dotClass: 'bg-[#B83B32]',
      badgeBg: 'bg-[#B83B32]/15 text-[#B83B32] font-bold',
      items: atrasadas,
    },
    {
      id: 'hoje',
      titulo: 'Vencem Hoje',
      subtitulo: 'Entregas do dia',
      icon: Clock,
      corClass: 'text-[#D97706]',
      dotClass: 'bg-[#D97706]',
      badgeBg: 'bg-[#D97706]/15 text-[#D97706] font-bold',
      items: hoje,
    },
    {
      id: 'estaSemana',
      titulo: 'Esta Semana',
      subtitulo: 'Próximos dias',
      icon: Calendar,
      corClass: 'text-[#8A6828]',
      dotClass: 'bg-[#C7A15F]',
      badgeBg: 'bg-[#C7A15F]/20 text-[#8F6F2D] font-bold',
      items: estaSemana,
    },
    {
      id: 'proximasSemanas',
      titulo: 'Próximas Semanas',
      subtitulo: 'Planejamento futuro',
      icon: CalendarDays,
      corClass: 'text-[#1D4ED8]',
      dotClass: 'bg-[#3B82F6]',
      badgeBg: 'bg-[#3B82F6]/15 text-[#1D4ED8]',
      items: proximasSemanas,
    },
    {
      id: 'semPrazo',
      titulo: 'Sem Prazo Definido',
      subtitulo: 'Prazos em aberto',
      icon: HelpCircle,
      corClass: 'text-[#8F8271]',
      dotClass: 'bg-[#8F8271]',
      badgeBg: 'bg-[#EEE7DC] text-[#4A4032]',
      items: semPrazo,
    },
  ];

  return (
    <div className="flex-1 w-full h-full flex overflow-x-auto p-4 gap-3.5 bg-[#FAF7F2]">
      {secoes.map((secao) => (
        <div
          key={secao.id}
          className="flex-1 min-w-[290px] max-w-[340px] h-full flex flex-col rounded-2xl bg-[#F6F0E7]/80 border border-[#E5D9C8] overflow-hidden"
        >
          {/* Header da Seção de Prazos */}
          <div className="p-3.5 flex items-center justify-between shrink-0 bg-transparent">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${secao.dotClass}`} />
              <h3 className="text-xs font-bold text-[#1E1A16] tracking-tight">
                {secao.titulo}
              </h3>
            </div>

            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${secao.badgeBg}`}>
              {secao.items.length}
            </span>
          </div>

          {/* Cards da Seção com Scroll Vertical */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2.5">
            {secao.items.length === 0 ? (
              <div className="h-28 rounded-xl border border-dashed border-[#D8CBB8] bg-[#FFFDF8]/40 flex flex-col items-center justify-center text-center p-3 text-[#8F8271]">
                <span className="text-[11px] font-medium">Nenhuma tarefa nesta faixa</span>
              </div>
            ) : (
              secao.items.map((tarefa) => (
                <TaskCard
                  key={tarefa.id}
                  tarefa={tarefa}
                  onClick={() => onSelectTarefa(tarefa)}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
