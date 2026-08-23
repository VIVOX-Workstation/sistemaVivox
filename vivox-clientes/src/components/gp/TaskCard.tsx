import React from 'react';
import type { Tarefa, PrioridadeTarefa } from '../../types';
import { 
  MoreHorizontal, 
  Bookmark, 
  User as UserIcon, 
  Building2, 
  Calendar, 
  MessageSquare, 
  CheckSquare, 
  Flame, 
  AlertCircle, 
  Clock 
} from 'lucide-react';

interface TaskCardProps {
  tarefa: Tarefa;
  cardBg?: string;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  tarefa,
  cardBg = '#FFFFFF',
  onClick,
  onDragStart,
}) => {
  // Cálculo do progresso em 4 segmentos (Dashes horizontais)
  const checklistTotal = tarefa.checklist?.length || 0;
  const checklistConcluidos = tarefa.checklist?.filter((c) => c.concluido).length || 0;
  
  let percent = 0;
  if (checklistTotal > 0) {
    percent = checklistConcluidos / checklistTotal;
  } else {
    if (tarefa.status === 'CONCLUIDA') percent = 1;
    else if (tarefa.status === 'EM_REVISAO') percent = 0.75;
    else if (tarefa.status === 'EM_ANDAMENTO') percent = 0.5;
    else if (tarefa.status === 'A_FAZER') percent = 0.25;
    else percent = 0;
  }

  const activeDashes = Math.round(percent * 4); // 0 a 4
  const percentNumber = Math.round(percent * 100);

  // Formatação de data estilo 15.11.24 e status de urgência
  const getPrazoInfo = (dataStr?: string) => {
    if (!dataStr) return null;
    const prazo = new Date(dataStr);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const prazoZero = new Date(prazo);
    prazoZero.setHours(0, 0, 0, 0);

    const diffDays = Math.round((prazoZero.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    const dia = String(prazo.getDate()).padStart(2, '0');
    const mes = String(prazo.getMonth() + 1).padStart(2, '0');
    const ano = String(prazo.getFullYear()).slice(-2);
    const dataFormatada = `${dia}.${mes}.${ano}`;

    const isConcluida = tarefa.status === 'CONCLUIDA';
    const isAtrasada = !isConcluida && diffDays < 0;
    const isHoje = !isConcluida && diffDays === 0;

    if (isAtrasada) {
      return {
        label: `${dataFormatada}`,
        colorClass: 'text-[#B83B32] bg-[#B83B32]/10 border-[#B83B32]/30 font-bold',
        icon: AlertCircle,
        isAtrasada: true,
      };
    }
    if (isHoje) {
      return {
        label: 'Hoje',
        colorClass: 'text-[#D97706] bg-[#D97706]/10 border-[#D97706]/30 font-bold',
        icon: Clock,
        isAtrasada: false,
      };
    }
    return {
      label: dataFormatada,
      colorClass: 'text-[#625746] bg-[#FAF7F2] border-[#E5D9C8]',
      icon: Calendar,
      isAtrasada: false,
    };
  };

  const prazoInfo = getPrazoInfo(tarefa.prazo);
  const isUrgente = tarefa.prioridade === 'URGENTE';
  const comentariosCount = tarefa._count?.comentarios || (tarefa.comentarios?.length ?? 0);

  const getPrioridadeBadge = (prioridade: PrioridadeTarefa) => {
    switch (prioridade) {
      case 'URGENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#B83B32]/15 text-[#B83B32] border border-[#B83B32]/30">
            <Flame className="w-2.5 h-2.5 text-[#B83B32]" />
            Urgente
          </span>
        );
      case 'ALTA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFA800]/20 text-[#B45309] border border-[#FFA800]/30">
            Alta
          </span>
        );
      case 'MEDIA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C7A15F]/20 text-[#8F6F2D] border border-[#C7A15F]/30">
            Média
          </span>
        );
      case 'BAIXA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/5 text-[#8F8271]">
            Baixa
          </span>
        );
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, tarefa.id)}
      onClick={onClick}
      className="group rounded-[22px] p-4 shadow-2xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer flex flex-col gap-3 select-none relative border border-[#D8CBB8]/80 hover:border-[#1E1A16]"
      style={{ backgroundColor: cardBg }}
    >
      {/* Topo do Card: Título da Tarefa + Badge Prioridade + Menu */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-[13px] font-bold text-[#1E1A16] leading-snug line-clamp-2 flex-1">
          {tarefa.titulo}
        </h4>

        <div className="flex items-center gap-1 shrink-0">
          {getPrioridadeBadge(tarefa.prioridade)}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="text-[#1E1A16]/40 hover:text-[#1E1A16] p-1 rounded-md transition-colors"
            title="Abrir detalhes"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Seção Detalhada: Responsável e Cliente */}
      <div className="flex flex-col gap-1.5 pt-0.5">
        {/* Responsável com nome explícito */}
        <div className="flex items-center gap-2 text-xs">
          {tarefa.responsavel ? (
            <div
              title={`Responsável: ${tarefa.responsavel.nome}`}
              className="w-7 h-7 rounded-full bg-[#181512] text-[#C7A15F] border-2 border-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs"
            >
              {tarefa.responsavel.nome.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <div
              title="Sem responsável"
              className="w-7 h-7 rounded-full bg-black/5 text-[#8F8271] border-2 border-white flex items-center justify-center text-xs shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8F8271] leading-none">
              Responsável
            </span>
            <span className="text-xs font-bold text-[#1E1A16] truncate leading-tight mt-0.5">
              {tarefa.responsavel?.nome || 'Não atribuído'}
            </span>
          </div>
        </div>

        {/* Cliente Vinculado & Serviço Contratado (Se Houver) */}
        {(tarefa.cliente || tarefa.servico) && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#625746] pt-0.5 flex-wrap">
            {tarefa.cliente && (
              <div className="flex items-center gap-1 truncate max-w-[140px]">
                <Building2 className="w-3.5 h-3.5 text-[#8F8271] shrink-0" />
                <span className="font-bold text-[#1E1A16] truncate">
                  {tarefa.cliente.nomeFantasia}
                </span>
              </div>
            )}

            {tarefa.servico && (
              <span
                title={`Serviço: ${tarefa.servico.tipoServico}`}
                className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#C7A15F]/15 text-[#8F6F2D] border border-[#C7A15F]/30 shrink-0"
              >
                {tarefa.servico.tipoServico === 'GERENCIAMENTO_REDES' ? '📱 Redes'
                  : tarefa.servico.tipoServico === 'LANDING_PAGE' ? '🌐 LP'
                  : tarefa.servico.tipoServico === 'VIDEO' ? '🎬 Vídeo'
                  : tarefa.servico.tipoServico === 'TRAFEGO_PAGO' ? '📈 Tráfego'
                  : tarefa.servico.tipoServico === 'IDENTIDADE_VISUAL' ? '🎨 Branding'
                  : tarefa.servico.tipoServico?.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Barra de Progresso Segmentada (4 Dashes) + Checklist Count */}
      <div className="flex flex-col gap-1 pt-1 border-t border-black/5">
        <div className="flex items-center justify-between text-[10px] text-[#625746]">
          <span className="font-semibold flex items-center gap-1">
            <CheckSquare className="w-3 h-3 text-[#C7A15F]" />
            {checklistTotal > 0
              ? `${checklistConcluidos}/${checklistTotal} subtarefas`
              : `${percentNumber}% concluído`}
          </span>
          <span className="font-bold text-[#1E1A16]">{percentNumber}%</span>
        </div>

        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((dashIndex) => {
            const isFilled = dashIndex <= activeDashes;
            return (
              <div
                key={dashIndex}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  isFilled ? 'bg-[#181512]' : 'bg-black/10'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Rodapé: Prazo Formatado + Comentários + Tag Workspace */}
      <div className="flex items-center justify-between pt-1 border-t border-black/5 text-xs text-[#8F8271]">
        <div className="flex items-center gap-2.5">
          {/* Comentários */}
          <span
            title="Comentários"
            className="inline-flex items-center gap-1 text-[11px] text-[#8F8271] hover:text-[#1E1A16] transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="font-bold">{comentariosCount}</span>
          </span>

          {/* Bookmark Workspace */}
          <span
            title={tarefa.projeto?.nome || 'Workspace'}
            className="inline-flex items-center gap-1 text-[11px] text-[#8F8271] truncate max-w-[90px]"
          >
            <Bookmark className="w-3 h-3 text-[#C7A15F]" />
            <span className="truncate">{tarefa.projeto?.nome || 'Geral'}</span>
          </span>
        </div>

        {/* Prazo */}
        {prazoInfo ? (
          <span
            title={prazoInfo.isAtrasada ? `Prazo Atrasado: ${prazoInfo.label}` : `Prazo: ${prazoInfo.label}`}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] whitespace-nowrap shrink-0 ${prazoInfo.colorClass}`}
          >
            <prazoInfo.icon className="w-3 h-3 shrink-0" />
            <span>{prazoInfo.isAtrasada ? `Atrasada • ${prazoInfo.label}` : prazoInfo.label}</span>
          </span>
        ) : (
          <span className="text-[10px] text-[#8F8271] whitespace-nowrap shrink-0">Sem prazo</span>
        )}
      </div>
    </div>
  );
};
