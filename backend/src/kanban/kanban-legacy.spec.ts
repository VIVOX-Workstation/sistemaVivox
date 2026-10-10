import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { KanbanService } from './kanban.service';

const owner = { id: 'owner', role: 'COLABORADOR' };
const custom = 'col_1791660000000_producao_criativa';
function setup(overrides: any = {}) {
  const task = { id: 'task', quadroId: 'board', colunaId: 'queue', status: 'A_FAZER', autorId: owner.id, responsavelId: 'executor', versao: 4, sessoes: [], observadores: [{ id: 'observer' }], ...overrides };
  const columns = {
    findFirst: jest.fn().mockResolvedValue(null),
    aggregate: jest.fn().mockResolvedValue({ _max: { ordem: 4 } }),
    upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve(create)),
  };
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    kanbanQuadro: { findUnique: jest.fn().mockResolvedValue({ id: 'board' }) },
    kanbanColuna: columns,
    tarefa: {
      findUnique: jest.fn().mockResolvedValue(task), findUniqueOrThrow: jest.fn().mockResolvedValue(task),
      aggregate: jest.fn().mockResolvedValue({ _max: { ordem: 0 } }), create: jest.fn().mockResolvedValue(task),
    },
  };
  const prisma = { $transaction: jest.fn(fn => fn(tx)), tarefa: tx.tarefa, kanbanColuna: columns };
  return { service: new KanbanService(prisma as any), tx };
}

describe('GP legacy custom columns integrated with Sync', () => {
  test('creates a task in a newly configured legacy column with consistent status and column', async () => {
    const { service, tx } = setup();
    jest.spyOn(service, 'getTask').mockResolvedValue({ id: 'task' } as any);
    await service.createTask({ titulo: 'Criar conteúdo', quadroId: 'board', status: custom }, owner);
    const column = tx.kanbanColuna.upsert.mock.calls[0][0].create;
    expect(column).toMatchObject({ quadroId: 'board', nome: 'PRODUCAO CRIATIVA', papel: 'none', statusLegado: custom });
    expect(tx.tarefa.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: custom, colunaId: column.id }) }));
  });
  test('moves to a newly configured column through the authorized versioned command', async () => {
    const { service, tx } = setup();
    const command = jest.spyOn(service, 'command').mockResolvedValue({ id: 'task' } as any);
    await service.updateTask('task', { status: custom, versao: 4 }, owner);
    const column = tx.kanbanColuna.upsert.mock.calls[0][0].create;
    expect(command).toHaveBeenCalledWith('task', 'mover', { colunaId: column.id, versao: 4 }, owner);
  });
  test('an observer cannot create a column by attempting to move a task', async () => {
    const { service, tx } = setup();
    await expect(service.legacyDestination('task', custom, { id: 'observer', role: 'COLABORADOR' }, 4)).rejects.toThrow(ForbiddenException);
    expect(tx.kanbanColuna.upsert).not.toHaveBeenCalled();
  });
  test.each(['EM_REVISAO', 'CONCLUIDA', 'CANCELADA'])('custom stages cannot bypass workflow from %s', async status => {
    const { service, tx } = setup({ status });
    await expect(service.legacyDestination('task', custom, owner, 4)).rejects.toThrow(BadRequestException);
    expect(tx.kanbanColuna.upsert).not.toHaveBeenCalled();
  });
  test('creating a custom destination cannot bypass the active executor timer', async () => {
    const { service, tx } = setup({ sessoes: [{ id: 'timer', fim: null }] });
    await expect(service.legacyDestination('task', custom, owner, 4)).rejects.toThrow(ForbiddenException);
    expect(tx.kanbanColuna.upsert).not.toHaveBeenCalled();
  });
  test('a stale move cannot create a new column', async () => {
    const { service, tx } = setup();
    await expect(service.legacyDestination('task', custom, owner, 3)).rejects.toThrow(ConflictException);
    expect(tx.kanbanColuna.upsert).not.toHaveBeenCalled();
  });
  test('missing workflow columns are never replaced by neutral columns', async () => {
    const { service, tx } = setup();
    await expect(service.legacyDestination('task', 'CONCLUIDA', owner, 4)).rejects.toThrow(BadRequestException);
    expect(tx.kanbanColuna.upsert).not.toHaveBeenCalled();
  });
  test('creation cannot mark new work as approved', async () => {
    const { service, tx } = setup();
    tx.kanbanColuna.findFirst.mockResolvedValue({ id: 'done', papel: 'done', statusLegado: 'CONCLUIDA' } as any);
    await expect(service.createTask({ titulo: 'Conteúdo', status: 'CONCLUIDA' }, owner)).rejects.toThrow(BadRequestException);
    expect(tx.tarefa.create).not.toHaveBeenCalled();
  });
});
