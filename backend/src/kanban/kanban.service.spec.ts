import { KanbanService } from './kanban.service';
import { ConflictException, ForbiddenException } from '@nestjs/common';

describe('VVOX Sync time and command boundaries', () => {
  const owner = { id: 'owner', role: 'COLABORADOR' };
  test('adds active elapsed time to preserved legacy hours without modifying stored hours', () => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-10T14:00:10Z').getTime());
    const service = new KanbanService({} as any);
    const task = { id: 't', autorId: 'owner', horasGastas: 2.5, status: 'EM_ANDAMENTO', sessoes: [{ id: 's', usuarioId: 'executor', inicio: new Date('2026-10-10T14:00:00Z'), fim: null }] };
    const result = service.present(task, owner);
    expect(result.tempo).toEqual({ acumuladoSegundos: 9000, totalSegundos: 9010, sessaoAtiva: { id: 's', usuarioId: 'executor', inicio: new Date('2026-10-10T14:00:00Z') } });
    expect(task.horasGastas).toBe(2.5);
    expect(result).not.toHaveProperty('sessoes');
    jest.restoreAllMocks();
  });

  function serviceFor(task: any) {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      tarefa: { findUnique: jest.fn().mockResolvedValue(task), findUniqueOrThrow: jest.fn().mockResolvedValue(task), update: jest.fn() },
      kanbanColuna: { findMany: jest.fn().mockResolvedValue([{ id: 'done', papel: 'done' }]) },
      tarefaSessao: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      tarefaComentario: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn(callback => callback(tx)), tarefa: { findUnique: jest.fn().mockResolvedValue(task) } };
    return { service: new KanbanService(prisma as any), tx };
  }

  const reviewing = { id: 't', quadroId: 'board', colunaId: 'review', autorId: 'owner', responsavelId: 'executor', revisorId: 'reviewer', status: 'EM_REVISAO', versao: 2, sessoes: [], observadores: [] };
  test('a stale command fails before status, session or history writes', async () => {
    const { service, tx } = serviceFor(reviewing);
    await expect(service.command('t', 'aprovar', { versao: 1 }, owner)).rejects.toThrow(ConflictException);
    expect(tx.tarefa.update).not.toHaveBeenCalled();
    expect(tx.tarefaSessao.create).not.toHaveBeenCalled();
  });
  test('an executor cannot approve through the same command used by the UI', async () => {
    const { service, tx } = serviceFor(reviewing);
    await expect(service.command('t', 'aprovar', { versao: 2 }, { id: 'executor', role: 'COLABORADOR' })).rejects.toThrow(ForbiddenException);
    expect(tx.tarefa.update).not.toHaveBeenCalled();
  });
  test('repeated start does not create or count a second session', async () => {
    const task = { ...reviewing, status: 'EM_ANDAMENTO', sessoes: [{ id: 'session', usuarioId: 'executor', inicio: new Date(), fim: null }] };
    const { service, tx } = serviceFor(task);
    await service.command('t', 'iniciar', {}, { id: 'executor', role: 'COLABORADOR' });
    expect(tx.tarefaSessao.create).not.toHaveBeenCalled();
    expect(tx.tarefa.update).not.toHaveBeenCalled();
  });

  test('a collaborator cannot seed manual worked hours on creation', async () => {
    const prisma = { $transaction: jest.fn() };
    const service = new KanbanService(prisma as any);
    await expect(service.createTask({ titulo: 'Demand', horasGastas: 3 }, owner)).rejects.toThrow(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  test('moving back to queue cannot bypass executor-only pause', async () => {
    const active = { ...reviewing, status: 'EM_ANDAMENTO', colunaId: 'doing', sessoes: [{ id: 's', inicio: new Date(), fim: null }] };
    const { service, tx } = serviceFor(active);
    tx.kanbanColuna.findMany.mockResolvedValue([{ id: 'queue', papel: 'queue' }]);
    await expect(service.command('t', 'mover', { colunaId: 'queue' }, owner)).rejects.toThrow(ForbiddenException);
    expect(tx.tarefa.update).not.toHaveBeenCalled();
  });
  test.each(['owner', 'reviewer'])('retains admin-only deadline changes for %s', async (id) => {
    const { service, tx } = serviceFor({ ...reviewing, prazo: new Date('2026-10-20T00:00:00Z') });
    await expect(service.updateTask('t', { prazo: '2026-10-21T00:00:00Z' }, { id, role: 'COLABORADOR' })).rejects.toThrow(ForbiddenException);
    expect(tx.tarefa.update).not.toHaveBeenCalled();
    expect(tx.tarefaComentario.create).not.toHaveBeenCalled();
  });
  test('a task owner cannot remove an existing deadline', async () => {
    const { service, tx } = serviceFor({ ...reviewing, prazo: new Date('2026-10-20T00:00:00Z') });
    await expect(service.updateTask('t', { prazo: null }, owner)).rejects.toThrow(ForbiddenException);
    expect(tx.tarefa.update).not.toHaveBeenCalled();
  });
  test('an unchanged deadline does not prevent an owner editing the task', async () => {
    const deadline = new Date('2026-10-20T00:00:00Z');
    const { service, tx } = serviceFor({ ...reviewing, prazo: deadline });
    await service.updateTask('t', { titulo: 'Updated task', prazo: deadline.toISOString() }, owner);
    expect(tx.tarefa.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ titulo: 'Updated task', prazo: deadline }) }));
    expect(tx.tarefaComentario.create).not.toHaveBeenCalled();
  });
  test.each(['2026-10-21T00:00:00Z', null])('an administrator may change or remove a deadline (%s)', async (prazo) => {
    const { service, tx } = serviceFor({ ...reviewing, prazo: new Date('2026-10-20T00:00:00Z') });
    await service.updateTask('t', { prazo }, { id: 'admin', role: 'ADMIN' });
    expect(tx.tarefa.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ prazo: prazo ? new Date(prazo) : null }) }));
    expect(tx.tarefaComentario.create).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['legacy-stage', 'legacy-stage'],
    [null, 'A_FAZER'],
  ])('keeps legacy status and column consistent on custom moves (%s)', async (statusLegado, expected) => {
    const task = { ...reviewing, status: 'A_FAZER', colunaId: 'queue' };
    const { service, tx } = serviceFor(task);
    tx.kanbanColuna.findMany.mockResolvedValue([{ id: 'custom', papel: 'none', statusLegado, nome: 'Custom' }] as any);
    (tx.tarefa as any).findMany = jest.fn().mockResolvedValue([]);
    (tx as any).chamado = { updateMany: jest.fn() };
    await service.command('t', 'mover', { colunaId: 'custom', versao: 2 }, owner);
    expect(tx.tarefa.update).toHaveBeenCalledWith({ where: { id: 't' }, data: { ordem: 0, colunaId: 'custom' } });
    expect(tx.tarefa.update).toHaveBeenCalledWith({ where: { id: 't' }, data: { versao: { increment: 1 }, status: expected } });
  });

});
