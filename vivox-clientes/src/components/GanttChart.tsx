import React, { useMemo, useState, useRef, useEffect } from 'react';
import { differenceInDays, addDays, format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

export type StatusMarco = 'PENDENTE' | 'CONCLUIDO' | 'ATRASADO';

export interface GanttTask {
  id: string;
  titulo: string;
  dataInicio?: string;
  dataPrevista: string;
  status: StatusMarco;
  dependeDeId?: string;
}

interface Props {
  tasks: GanttTask[];
  onAddTask?: () => void;
  onUpdateTask?: (taskId: string, updates: Partial<GanttTask>) => void;
  onEditTask?: (task: GanttTask) => void;
  onDeleteTask?: (taskId: string) => void;
}

const CELL_WIDTH = 24;

export function GanttChart({ tasks, onAddTask, onUpdateTask, onEditTask, onDeleteTask }: Props) {
  // Estado estável das bordas do calendário para evitar "pulos" visuais quando as tarefas mudam
  const [timelineBounds, setTimelineBounds] = useState<{ minDate: Date, maxDate: Date } | null>(null);

  const { minDate, maxDate, totalDays } = useMemo(() => {
    let calcMin = new Date();
    let calcMax = new Date();

    if (tasks.length > 0) {
      calcMin = new Date(tasks[0].dataInicio || tasks[0].dataPrevista);
      calcMax = new Date(tasks[0].dataPrevista);

      tasks.forEach(t => {
        const start = new Date(t.dataInicio || t.dataPrevista);
        const end = new Date(t.dataPrevista);
        if (start < calcMin) calcMin = start;
        if (end > calcMax) calcMax = end;
      });
    }

    // Margens
    calcMin = subDays(calcMin, 45);
    calcMax = addDays(calcMax, 180);

    // Se já temos bounds, só atualizamos se a tarefa vazou das bordas originais
    if (timelineBounds) {
      if (calcMin >= timelineBounds.minDate && calcMax <= timelineBounds.maxDate) {
        // Usa o antigo para não causar pulos na tela
        return {
          minDate: timelineBounds.minDate,
          maxDate: timelineBounds.maxDate,
          totalDays: differenceInDays(timelineBounds.maxDate, timelineBounds.minDate) + 1
        };
      }
    }

    // Se vazou ou é o inicial, atualiza o estado de bounds de forma assíncrona
    return {
      minDate: calcMin,
      maxDate: calcMax,
      totalDays: differenceInDays(calcMax, calcMin) + 1,
      needsUpdate: true // Flag pra atualizar o state
    };
  }, [tasks, timelineBounds]);

  // Atualiza o estado fixo se precisou expandir
  useEffect(() => {
    if ((minDate as any).needsUpdate || !timelineBounds) {
      setTimelineBounds({ minDate, maxDate });
    }
  }, [minDate, maxDate, timelineBounds]);

  const daysArray = useMemo(() => Array.from({ length: totalDays }, (_, i) => addDays(minDate, i)), [totalDays, minDate]);

  // Agrupar dias por mês
  const months = useMemo(() => {
    const grouped: { month: string; days: Date[]; colSpan: number }[] = [];
    daysArray.forEach(d => {
      const monthName = format(d, 'MMM/yy', { locale: ptBR });
      const last = grouped[grouped.length - 1];
      if (last && last.month === monthName) {
        last.days.push(d);
        last.colSpan++;
      } else {
        grouped.push({ month: monthName, days: [d], colSpan: 1 });
      }
    });
    return grouped;
  }, [daysArray]);

  const getTaskGridPosition = (task: GanttTask) => {
    const start = new Date(task.dataInicio || task.dataPrevista);
    const end = new Date(task.dataPrevista);
    const actualStart = start > end ? end : start;

    const startOffset = differenceInDays(actualStart, minDate);
    const duration = Math.max(1, differenceInDays(end, actualStart) + 1); // no minimo 1 dia

    return {
      left: startOffset * CELL_WIDTH,
      width: duration * CELL_WIDTH,
    };
  };

  const getStatusColor = (status: StatusMarco) => {
    switch (status) {
      case 'CONCLUIDO': return 'bg-emerald-500';
      case 'ATRASADO': return 'bg-red-500';
      default: return 'bg-indigo-400';
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoScroll = (direction: 'left' | 'right') => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    scrollIntervalRef.current = setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += direction === 'right' ? 20 : -20;
      }
    }, 30);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  // Limpa o intervalo se o componente desmontar
  useEffect(() => {
    return () => stopAutoScroll();
  }, []);
  
  // ESTADOS DE DRAG & RESIZE
  const [draggingTask, setDraggingTask] = useState<{
    id: string;
    mode: 'move' | 'resize';
    startX: number;
    initialLeft: number;
    initialWidth: number;
    initialScrollLeft: number;
    currentLeft: number;
    currentWidth: number;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, task: GanttTask, mode: 'move' | 'resize') => {
    e.stopPropagation();
    if (e.button !== 0) return; // Only left click

    const pos = getTaskGridPosition(task);
    setDraggingTask({
      id: task.id,
      mode,
      startX: e.clientX,
      initialScrollLeft: scrollContainerRef.current?.scrollLeft || 0,
      initialLeft: pos.left,
      initialWidth: pos.width,
      currentLeft: pos.left,
      currentWidth: pos.width,
    });

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTask) return;

    const currentScrollLeft = scrollContainerRef.current?.scrollLeft || 0;
    const scrollDelta = currentScrollLeft - draggingTask.initialScrollLeft;

    // deltaX real considera tanto o movimento do mouse na tela quanto o quanto a tela scrollou
    const deltaX = (e.clientX - draggingTask.startX) + scrollDelta;
    
    // Snap to grid (24px cells)
    const snappedDeltaX = Math.round(deltaX / CELL_WIDTH) * CELL_WIDTH;

    if (draggingTask.mode === 'move') {
      setDraggingTask(prev => ({
        ...prev!,
        currentLeft: Math.max(0, prev!.initialLeft + snappedDeltaX)
      }));
    } else if (draggingTask.mode === 'resize') {
      setDraggingTask(prev => ({
        ...prev!,
        currentWidth: Math.max(CELL_WIDTH, prev!.initialWidth + snappedDeltaX)
      }));
    }

    // Auto-scroll se o mouse estiver perto da borda
    if (scrollContainerRef.current) {
      const rect = scrollContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX;
      
      // Área sensível de 100px nas bordas
      const scrollThreshold = 100;
      
      // Se estiver arrastando para a direita (perto da borda direita)
      if (mouseX > rect.right - scrollThreshold) {
        scrollContainerRef.current.scrollLeft += 15;
      }
      // Se estiver arrastando para a esquerda (perto da borda esquerda da timeline)
      else if (mouseX < rect.left + scrollThreshold) {
        scrollContainerRef.current.scrollLeft -= 15;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingTask) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);

    const task = tasks.find(t => t.id === draggingTask.id);
    if (task && onUpdateTask) {
      // Calcular as novas datas a partir da posição
      const newStartOffset = draggingTask.currentLeft / CELL_WIDTH;
      const newDurationDays = draggingTask.currentWidth / CELL_WIDTH;
      
      const newStartDate = addDays(minDate, newStartOffset);
      const newEndDate = addDays(newStartDate, newDurationDays - 1); // -1 porque o fim é inclusivo

      // Só disparar update se realmente mudou
      const oldStart = new Date(task.dataInicio || task.dataPrevista);
      const oldEnd = new Date(task.dataPrevista);
      
      if (differenceInDays(newStartDate, oldStart) !== 0 || differenceInDays(newEndDate, oldEnd) !== 0) {
        onUpdateTask(task.id, {
          dataInicio: newStartDate.toISOString(),
          dataPrevista: newEndDate.toISOString()
        });
      }
    }

    setDraggingTask(null);
  };

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm relative group/gantt">
      {/* Botões de Scroll Automático Overlay */}
      <div 
        className="absolute top-[60px] bottom-0 left-[450px] w-12 bg-gradient-to-r from-white via-white/80 to-transparent z-30 flex items-center justify-start opacity-0 group-hover/gantt:opacity-100 transition-opacity"
        onMouseEnter={() => startAutoScroll('left')}
        onMouseLeave={stopAutoScroll}
      >
        <div className="bg-white border border-slate-200 shadow-md rounded-full p-1 -ml-3 cursor-pointer text-slate-500 hover:text-indigo-600 hover:scale-110 transition-transform">
          <ChevronLeft className="w-5 h-5" />
        </div>
      </div>

      <div 
        className="absolute top-[60px] bottom-0 right-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent z-30 flex items-center justify-end opacity-0 group-hover/gantt:opacity-100 transition-opacity"
        onMouseEnter={() => startAutoScroll('right')}
        onMouseLeave={stopAutoScroll}
      >
        <div className="bg-white border border-slate-200 shadow-md rounded-full p-1 -mr-3 cursor-pointer text-slate-500 hover:text-indigo-600 hover:scale-110 transition-transform">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      <div className="flex flex-row relative">
        
        {/* LADO ESQUERDO: Tabela (Não scrolla horizontalmente) */}
        <div className="flex-none w-[450px] border-r border-slate-200 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
          
          <div className="h-[60px] border-b border-slate-200 flex flex-col justify-end bg-slate-50">
            <div className="flex text-xs font-semibold text-slate-500 uppercase tracking-wider p-2">
              <div className="flex-1 truncate px-2">Nome da tarefa</div>
              <div className="w-16 text-center px-1">Duração</div>
              <div className="w-24 text-center px-1">Início</div>
              <div className="w-24 text-center px-1">Término</div>
            </div>
          </div>

          <div className="flex flex-col">
            {tasks.map(task => {
              // Se a tarefa está sendo movida visualmente, mostrar a previsão na tabela também!
              let start = new Date(task.dataInicio || task.dataPrevista);
              let end = new Date(task.dataPrevista);
              let duration = differenceInDays(end, start) + 1;

              if (draggingTask && draggingTask.id === task.id) {
                const newStartOffset = draggingTask.currentLeft / CELL_WIDTH;
                const newDurationDays = draggingTask.currentWidth / CELL_WIDTH;
                start = addDays(minDate, newStartOffset);
                end = addDays(start, newDurationDays - 1);
                duration = newDurationDays;
              }

              return (
                <div 
                  key={task.id} 
                  className="h-10 border-b border-slate-100 flex items-center text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                  onDoubleClick={() => onEditTask && onEditTask(task)}
                  title="Duplo clique para editar"
                >
                  <div className="flex-1 truncate px-4 font-medium">
                    {task.titulo}
                  </div>
                  <div className="w-16 text-center text-xs text-slate-500">{duration} d</div>
                  <div className="w-24 text-center text-xs">{format(start, 'dd/MM')}</div>
                  <div className="w-24 text-center text-xs">{format(end, 'dd/MM')}</div>
                  <div className="w-8 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteTask && onDeleteTask(task.id); }}
                      className="text-slate-400 hover:text-red-500"
                      title="Excluir Tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
        </div>

        {/* LADO DIREITO: Cronograma (Container com scroll) */}
        <div 
          ref={scrollContainerRef}
          className="flex-auto overflow-x-auto relative"
        >
          {/* Conteúdo Largo */}
          <div 
            className="w-max min-w-[600px] bg-slate-50 relative select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
          
          {/* Header do Cronograma */}
          <div className="h-[60px] border-b border-slate-200 flex flex-col bg-white">
            <div className="flex h-1/2 border-b border-slate-100">
              {months.map(m => (
                <div 
                  key={m.month} 
                  className="flex-none border-r border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50"
                  style={{ width: `${m.colSpan * CELL_WIDTH}px` }}
                >
                  {m.month}
                </div>
              ))}
            </div>
            <div className="flex h-1/2">
              {daysArray.map((d, i) => (
                <div 
                  key={i} 
                  className={`flex-none w-[${CELL_WIDTH}px] border-r border-slate-100 flex items-center justify-center text-[10px] ${d.getDay() === 0 || d.getDay() === 6 ? 'text-rose-400 bg-rose-50/30' : 'text-slate-400'}`}
                  style={{ width: `${CELL_WIDTH}px` }}
                >
                  {format(d, 'dd')}
                </div>
              ))}
            </div>
          </div>

          {/* Grid e Barras */}
          <div className="relative">
            {/* Linhas de Fundo */}
            <div className="absolute inset-0 flex pointer-events-none">
              {daysArray.map((d, i) => (
                <div 
                  key={i} 
                  className={`flex-none border-r border-slate-100 ${d.getDay() === 0 || d.getDay() === 6 ? 'bg-slate-200/40' : ''}`} 
                  style={{ width: `${CELL_WIDTH}px` }}
                />
              ))}
            </div>

            {/* Barras */}
            <div className="relative z-10 flex flex-col">
              {tasks.map((task) => {
                const pos = getTaskGridPosition(task);
                
                // Usar valores do drag se for esta tarefa
                const isDraggingThis = draggingTask?.id === task.id;
                const left = isDraggingThis ? draggingTask.currentLeft : pos.left;
                const width = isDraggingThis ? draggingTask.currentWidth : pos.width;

                return (
                  <div key={task.id} className="h-10 border-b border-transparent relative flex items-center">
                    
                    {/* A BARRA PRINCIPAL */}
                    <div 
                      className={`absolute h-6 rounded-md shadow-sm group ${getStatusColor(task.status)} ${isDraggingThis ? 'opacity-100 ring-2 ring-slate-800' : 'opacity-90 hover:opacity-100 cursor-move'}`}
                      style={{ left: `${left}px`, width: `${width}px` }}
                      onPointerDown={(e) => handlePointerDown(e, task, 'move')}
                      onDoubleClick={(e) => { e.stopPropagation(); onEditTask && onEditTask(task); }}
                      title={`${task.titulo}\nDuplo clique para editar`}
                    >
                      {/* Título interno (se a barra for grande o suficiente) */}
                      {width > 60 && (
                        <div className="px-2 text-[10px] text-white/90 font-medium truncate leading-6 pointer-events-none">
                          {task.titulo}
                        </div>
                      )}

                      {/* RESIZE HANDLE DIREITO */}
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/10 hover:bg-black/20 rounded-r-md transition-colors"
                        onPointerDown={(e) => handlePointerDown(e, task, 'resize')}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
