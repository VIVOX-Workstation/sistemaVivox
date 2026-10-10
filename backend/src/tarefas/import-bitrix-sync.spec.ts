import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TarefasController } from './tarefas.controller';
import { TarefasService } from './tarefas.service';

jest.mock('ai', () => ({ generateText: jest.fn() }));
jest.mock('@ai-sdk/groq', () => ({ groq: jest.fn() }));
jest.mock('../storage/storage.service', () => ({ StorageService: class {} }));

describe('Bitrix reimport respects the Sync workflow', () => {
  const req = { user: { userId: 'reviewer', role: 'COLABORADOR' } };
  const actor = { id: 'reviewer', role: 'COLABORADOR' };
  const existing = { id: 'task', origemBitrixId: '123', status: 'EM_REVISAO', projetoId: 'old-workspace', versao: 4, permissoes: { editar: true } };
  function html(status = 'Concluída') {
    const cells = Array(31).fill('');
    cells[0] = '123'; cells[1] = 'Imported task'; cells[9] = status;
    return Buffer.from('<table><tbody><tr>' + cells.map(value => '<td>' + value + '</td>').join('') + '</tr></tbody></table>');
  }
  function fixture(found: any = existing) {
    const prisma = {
      user: { findMany: jest.fn().mockResolvedValue([]) },
      cliente: { findMany: jest.fn().mockResolvedValue([]) },
      servicoContratado: { findMany: jest.fn().mockResolvedValue([]) },
      tarefa: { findUnique: jest.fn().mockResolvedValue(found), update: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'new' }) },
    };
    const service = new TarefasService(prisma as any);
    const kanban = {
      getTask: jest.fn().mockResolvedValue(found),
      updateTask: jest.fn().mockImplementation(async (_id, dto) => ({ ...existing, ...dto, versao: dto.versao + 1 })),
    };
    return { prisma, service, kanban, controller: new TarefasController(service, {} as any, kanban as any) };
  }

  test('an existing task moves and changes workspace through separate versioned Kanban operations', async () => {
    const { controller, kanban, prisma } = fixture();
    await expect(controller.importarBitrix({ buffer: html() } as any, 'new-workspace', 'CONCLUIDA', req)).resolves.toMatchObject({ atualizadas: 1, criadas: 0 });
    expect(kanban.getTask).toHaveBeenCalledWith('task', actor);
    expect(kanban.updateTask).toHaveBeenNthCalledWith(1, 'task', { status: 'CONCLUIDA', versao: 4 }, actor);
    expect(kanban.updateTask).toHaveBeenNthCalledWith(2, 'task', { projetoId: 'new-workspace', versao: 5 }, actor);
    expect(prisma.tarefa.update).not.toHaveBeenCalled();
    expect(prisma.tarefa.create).not.toHaveBeenCalled();
  });

  test('an approval failure is surfaced and cannot move the task to another workspace', async () => {
    const { controller, kanban, prisma } = fixture();
    kanban.updateTask.mockRejectedValueOnce(new ForbiddenException('Approval forbidden'));
    await expect(controller.importarBitrix({ buffer: html() } as any, 'new-workspace', 'CONCLUIDA', req)).rejects.toThrow(ForbiddenException);
    expect(kanban.updateTask).toHaveBeenCalledTimes(1);
    expect(prisma.tarefa.update).not.toHaveBeenCalled();
  });

  test('workflow errors such as missing correction reason are not swallowed as duplicates', async () => {
    const { controller, kanban, prisma } = fixture();
    kanban.updateTask.mockRejectedValueOnce(new BadRequestException('Informe o motivo da correção.'));
    await expect(controller.importarBitrix({ buffer: html() } as any, undefined, 'EM_ANDAMENTO', req)).rejects.toThrow(BadRequestException);
    expect(prisma.tarefa.update).not.toHaveBeenCalled();
  });

  test('workspace permission is checked before initiating any transition', async () => {
    const { controller, kanban, prisma } = fixture({ ...existing, permissoes: { editar: false } });
    await expect(controller.importarBitrix({ buffer: html() } as any, 'new-workspace', 'CONCLUIDA', req)).rejects.toThrow(ForbiddenException);
    expect(kanban.updateTask).not.toHaveBeenCalled();
    expect(prisma.tarefa.update).not.toHaveBeenCalled();
  });

  test('a service caller without an authorized updater cannot directly change an existing task', async () => {
    const { service, prisma } = fixture();
    await expect(service.importarBitrix(html(), 'new-workspace', 'CONCLUIDA')).rejects.toThrow(ForbiddenException);
    expect(prisma.tarefa.update).not.toHaveBeenCalled();
  });

  test('reimport without a destination stage still skips duplicate tasks', async () => {
    const { controller, kanban, prisma } = fixture();
    await expect(controller.importarBitrix({ buffer: html() } as any, undefined, undefined, req)).resolves.toMatchObject({ atualizadas: 0, ignoradasDuplicadas: 1 });
    expect(kanban.updateTask).not.toHaveBeenCalled();
    expect(prisma.tarefa.update).not.toHaveBeenCalled();
  });

  test('new historical imports retain their imported completion status', async () => {
    const { controller, kanban, prisma } = fixture(null);
    await expect(controller.importarBitrix({ buffer: html() } as any, 'workspace', undefined, req)).resolves.toMatchObject({ criadas: 1, atualizadas: 0 });
    expect(prisma.tarefa.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ titulo: 'Imported task', status: 'CONCLUIDA', projetoId: 'workspace', origemBitrixId: '123' }) }));
    expect(kanban.updateTask).not.toHaveBeenCalled();
  });

  test('backup collisions create an independent historical task rather than updating the existing one', async () => {
    const { service, prisma } = fixture();
    prisma.tarefa.create.mockRejectedValueOnce({ code: 'P2002' }).mockResolvedValueOnce({ id: 'new' });
    await expect(service.importarBackup([{ titulo: 'Backup task', origemBitrixId: '123', status: 'CONCLUIDA' }], 'workspace')).resolves.toMatchObject({ criadas: 1, ignoradas: 0 });
    expect(prisma.tarefa.create).toHaveBeenCalledTimes(2);
    expect(prisma.tarefa.create.mock.calls[1][0].data).not.toHaveProperty('origemBitrixId');
    expect(prisma.tarefa.update).not.toHaveBeenCalled();
  });
});
