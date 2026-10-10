import { ForbiddenException, BadRequestException } from '@nestjs/common';

export type SyncActor = { id: string; role: string };
export type SyncAction = 'iniciar' | 'pausar' | 'entregar' | 'aprovar' | 'corrigir' | 'mover';
export function syncPermissions(task: any, actor: SyncActor) {
  const admin = actor.role === 'ADMIN';
  const owner = !!actor.id && task.autorId === actor.id;
  const reviewer = !!actor.id && task.revisorId === actor.id;
  const executor = !!actor.id && task.responsavelId === actor.id;
  const reviewing = task.status === 'EM_REVISAO';
  const closed = task.status === 'CONCLUIDA' || task.status === 'CANCELADA';
  const running = (task.sessoes || []).some((s: any) => !s.fim);
  const participant = admin || owner || reviewer || executor || (task.observadores || []).some((u: any) => u.id === actor.id);
  return {
    visualizar: participant,
    editar: admin || owner || reviewer,
    excluir: admin || owner,
    iniciar: !!task.responsavelId && (admin || executor) && !reviewing && !closed && !running,
    pausar: (admin || executor) && running,
    entregar: !!task.responsavelId && (admin || executor) && !reviewing && !closed,
    aprovar: (admin || reviewer || owner) && reviewing,
    corrigir: (admin || reviewer || owner) && reviewing,
    mover: admin || owner || reviewer || executor,
    editarChecklist: admin || owner || reviewer,
    marcarChecklist: admin || executor,
    comentar: participant,
  };
}

export function assertPermission(task: any, actor: SyncActor, action: keyof ReturnType<typeof syncPermissions>) {
  if (!syncPermissions(task, actor)[action]) throw new ForbiddenException('Você não tem permissão para esta ação na tarefa.');
}

export function moveAction(task: any, destination: any): SyncAction | 'reordenar' | 'organizar' {
  if (task.colunaId === destination.id) return 'reordenar';
  if (destination.papel === 'done') return 'aprovar';
  if (destination.papel === 'review') return 'entregar';
  if (task.status === 'EM_REVISAO') {
    if (destination.papel !== 'doing') throw new BadRequestException('Use Pedir correção para retornar à execução.');
    return 'corrigir';
  }
  if (task.status === 'CONCLUIDA' || task.status === 'CANCELADA') {
    throw new BadRequestException('Tarefas encerradas não podem ser reabertas por arraste.');
  }
  if (destination.papel === 'doing') return 'iniciar';
  return 'organizar';
}
