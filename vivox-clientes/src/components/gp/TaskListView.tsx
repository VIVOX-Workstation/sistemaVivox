import React from 'react';
import type { Tarefa, StatusTarefa, PrioridadeTarefa } from '../../types';
import { 
  CheckCircle2, 
  Circle, 
  Building2, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckSquare, 
  Flame, 
  User as UserIcon, 
  Trash2, 
  ExternalLink 
} from 'lucide-react';

interface TaskListViewProps {
  tarefas: Tarefa[];
  onSelectTarefa: (tarefa: Tarefa) => void;
  onUpdateStatus: (tarefaId: string, novoStatus: StatusTarefa) => void;
  onDeleteTarefa: (tarefaId: string) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tarefas,
  onSelectTarefa,
  onUpdateStatus,
  onDeleteTarefa,
}) => {
  const getPrioridadeBadge = (prioridade: PrioridadeTarefa) => {
    switch (prioridade) {
      case 'URGENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#B83B32]/15 text-[#B83B32] border border-[#B83B32]/30">
            <Flame className="w-2.5 h-2.5 text-[#B83B32]" />
            Urgente
          </span>
        );
      case 'ALTA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30">
            Alta
          </span>
        );
      case 'MEDIA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#C7A15F]/20 text-[#8F6F2D] border border-[#C7A15F]/30">
            Média
          </span>
        );
      case 'BAIXA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#8F8271]/15 text-[#625746] border border-[#D8CBB8]">
            Baixa
          </span>
        );
    }
  };

  const getStatusLabel = (status: StatusTarefa) => {
    switch (status) {
      case 'BACKLOG':
        return { label: 'Backlog', color: 'text-[#625746] bg-[#EEE7DC] border-[#D8CBB8]' };
      case 'A_FAZER':
        return { label: 'A Fazer', color: 'text-[#1D4ED8] bg-[#3B82F6]/10 border-[#3B82F6]/30' };
      case 'EM_ANDAMENTO':
        return { label: 'Em Andamento', color: 'text-[#8F6F2D] bg-[#C7A15F]/15 border-[#C7A15F]/30 font-bold' };
      case 'EM_REVISAO':
        return { label: 'Em Revisão', color: 'text-[#6D28D9] bg-[#8B5CF6]/10 border-[#8B5CF6]/30' };
      case 'CONCLUIDA':
        return { label: 'Concluída', color: 'text-[#247A4A] bg-[#247A4A]/10 border-[#247A4A]/30 font-bold' };
      case 'CANCELADA':
        return { label: 'Cancelada', color: 'text-[#8F8271] bg-[#EEE7DC] border-[#D8CBB8]' };
    }
  };

  const formatPrazo = (prazoStr?: string, status?: StatusTarefa) => {
    if (!prazoStr) return <span className="text-[#8F8271] text-xs">—</span>;
    const prazo = new Date(prazoStr);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const prazoZero = new Date(prazo);
    prazoZero.setHours(0, 0, 0, 0);
    const diffDays = Math.round((prazoZero.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    const isConcluida = status === 'CONCLUIDA';
    const isAtrasada = !isConcluida && diffDays < 0;
    const isHoje = !isConcluida && diffDays === 0;

    const dataFormatada = prazo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (isAtrasada) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B83B32]">
          <AlertCircle className="w-3.5 h-3.5" />
          {dataFormatada}
        </span>
      );
    }
    if (isHoje) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706]">
          <Clock className="w-3.5 h-3.5" />
          Hoje
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#625746]">
        <Calendar className="w-3.5 h-3.5 text-[#8F8271]" />
        {dataFormatada}
      </span>
    );
  };

  return (
    <div className="w-full bg-[#FFFDF8] border border-[#D8CBB8] rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D8CBB8] bg-[#F6F0E7] text-[11px] font-bold uppercase tracking-wider text-[#8F8271]">
              <th className="py-3 px-4 w-12 text-center">Status</th>
              <th className="py-3 px-4">Tarefa</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Responsável</th>
              <th className="py-3 px-4">Prioridade</th>
              <th className="py-3 px-4">Prazo</th>
              <th className="py-3 px-4">Subtarefas</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5D9C8] text-xs">
            {tarefas.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#8F8271]">
                  Nenhuma tarefa encontrada.
                </td>
              </tr>
            ) : (
              tarefas.map((tarefa) => {
                const isConcluida = tarefa.status === 'CONCLUIDA';
                const statusInfo = getStatusLabel(tarefa.status);
                const checklistTotal = tarefa.checklist?.length || 0;
                const checklistConcluidos = tarefa.checklist?.filter((c) => c.concluido).length || 0;

                return (
                  <tr
                    key={tarefa.id}
                    className="hover:bg-[#FAF7F2] transition-colors group cursor-pointer"
                    onClick={() => onSelectTarefa(tarefa)}
                  >
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(tarefa.id, isConcluida ? 'A_FAZER' : 'CONCLUIDA');
                      }}
                    >
                      <button
                        title={isConcluida ? 'Reabrir tarefa' : 'Concluir tarefa'}
                        className="inline-flex items-center justify-center text-[#8F8271] hover:text-[#247A4A] transition-colors cursor-pointer"
                      >
                        {isConcluida ? (
                          <CheckCircle2 className="w-4 h-4 text-[#247A4A]" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#D8CBB8] hover:text-[#C7A15F]" />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span
                          className={`font-semibold text-xs leading-snug ${
                            isConcluida
                              ? 'line-through text-[#8F8271]'
                              : 'text-[#1E1A16] group-hover:text-[#8F6F2D]'
                          }`}
                        >
                          {tarefa.titulo}
                        </span>
                        {tarefa.descricao && (
                          <span className="text-[11px] text-[#8F8271] line-clamp-1 mt-0.5">
                            {tarefa.descricao}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {tarefa.cliente ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#EEE7DC] text-[#4A4032] border border-[#D8CBB8] truncate max-w-[150px]">
                          <Building2 className="w-3 h-3 text-[#8F8271]" />
                          {tarefa.cliente.nomeFantasia}
                        </span>
                      ) : (
                        <span className="text-[#8F8271] text-xs">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {tarefa.responsavel ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#24201A] text-[#C7A15F] border border-[#C7A15F]/40 flex items-center justify-center text-[9px] font-bold shadow-2xs">
                            {tarefa.responsavel.nome.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-[#1E1A16] truncate max-w-[120px]">
                            {tarefa.responsavel.nome}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8F8271] flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5" /> Não atribuído
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">{getPrioridadeBadge(tarefa.prioridade)}</td>

                    <td className="py-3 px-4">{formatPrazo(tarefa.prazo, tarefa.status)}</td>

                    <td className="py-3 px-4">
                      {checklistTotal > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#625746] font-medium">
                          <CheckSquare className="w-3.5 h-3.5 text-[#C7A15F]" />
                          {checklistConcluidos}/{checklistTotal}
                        </span>
                      ) : (
                        <span className="text-xs text-[#8F8271]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={tarefa.status}
                          onChange={(e) => onUpdateStatus(tarefa.id, e.target.value as StatusTarefa)}
                          className={`text-[11px] py-1 px-2.5 rounded-lg border font-semibold outline-none cursor-pointer ${statusInfo.color}`}
                        >
                          <option value="BACKLOG">Backlog</option>
                          <option value="A_FAZER">A Fazer</option>
                          <option value="EM_ANDAMENTO">Em Andamento</option>
                          <option value="EM_REVISAO">Em Revisão</option>
                          <option value="CONCLUIDA">Concluída</option>
                          <option value="CANCELADA">Cancelada</option>
                        </select>

                        <button
                          onClick={() => onSelectTarefa(tarefa)}
                          title="Abrir detalhes"
                          className="p-1.5 text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#EEE7DC] rounded-md transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteTarefa(tarefa.id)}
                          title="Excluir tarefa"
                          className="p-1.5 text-[#8F8271] hover:text-[#B83B32] hover:bg-[#B83B32]/10 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
