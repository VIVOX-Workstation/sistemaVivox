import { BadRequestException, ForbiddenException, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { TarefasController } from './tarefas.controller';

jest.mock('./tarefas.service', () => ({ TarefasService: class {} }));
jest.mock('../storage/storage.service', () => ({ StorageService: class {} }));

describe('legacy workspace routes with VVOX Sync', () => {
  const req = { user: { userId: 'admin', role: 'ADMIN' } };
  const task = {
    id: 'first', quadroId: 'board', colunaId: 'backlog', status: 'BACKLOG', versao: 3,
    permissoes: { mover: true, iniciar: true, pausar: true, entregar: true, aprovar: true },
    tempo: { sessaoAtiva: null },
  };
  const columns = [
    { id: 'queue', papel: 'queue', statusLegado: 'A_FAZER' },
    { id: 'doing', papel: 'doing', statusLegado: 'EM_ANDAMENTO' },
    { id: 'done', papel: 'done', statusLegado: 'CONCLUIDA' },
  ];
  function fixture(tasks: any[] = [task]) {
    const kanban = {
      listTasks: jest.fn().mockResolvedValue(tasks),
      legacyDestination: jest.fn().mockImplementation(async (_id, status) => columns.find(column => column.statusLegado === status)),
      command: jest.fn().mockResolvedValue({}),
    };
    const service = { importarBackup: jest.fn().mockResolvedValue({ criadas: 1 }), exportarWorkspace: jest.fn() };
    return { controller: new TarefasController(service as any, {} as any, kanban as any), kanban, service };
  }

  test('preserves the import, export, observer and batch-move route contracts', () => {
    for (const [name, path, method] of [
      ['exportarWorkspace', 'exportar', RequestMethod.GET],
      ['importarBitrix', 'importar-bitrix', RequestMethod.POST],
      ['importarBackup', 'importar-backup', RequestMethod.POST],
      ['setObservadores', ':id/observadores', RequestMethod.PATCH],
      ['moverEtapa', 'mover-etapa', RequestMethod.PATCH],
    ] as const) {
      const handler = TarefasController.prototype[name];
      expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(path);
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(method);
    }
  });

  test('maps a workspace batch to versioned moves in each persisted board', async () => {
    const { controller, kanban } = fixture([task, { ...task, id: 'second', versao: 7 }]);
    await expect(controller.moverEtapa('workspace', 'BACKLOG', 'A_FAZER', req)).resolves.toEqual({ movidas: 2 });
    expect(kanban.listTasks).toHaveBeenCalledWith({ id: 'admin', role: 'ADMIN' }, { projetoId: 'workspace', status: 'BACKLOG' });
    expect(kanban.command).toHaveBeenNthCalledWith(1, 'first', 'mover', { colunaId: 'queue', versao: 3 }, { id: 'admin', role: 'ADMIN' });
    expect(kanban.command).toHaveBeenNthCalledWith(2, 'second', 'mover', { colunaId: 'queue', versao: 7 }, { id: 'admin', role: 'ADMIN' });
  });


  test('a newly persisted empty custom stage is used by the legacy batch route', async () => {
    const { controller, kanban } = fixture();
    kanban.legacyDestination.mockResolvedValueOnce({ id: 'legacy-custom', papel: 'none', statusLegado: 'col_123_custom' });
    await expect(controller.moverEtapa('workspace', 'BACKLOG', 'col_123_custom', req)).resolves.toEqual({ movidas: 1 });
    expect(kanban.legacyDestination).toHaveBeenCalledWith('first', 'col_123_custom', { id: 'admin', role: 'ADMIN' }, 3);
    expect(kanban.command).toHaveBeenCalledWith('first', 'mover', { colunaId: 'legacy-custom', versao: 3 }, { id: 'admin', role: 'ADMIN' });
  });

  test('preflights the whole batch so a forbidden approval cannot partly move it', async () => {
    const reviewing = { ...task, colunaId: 'review', status: 'EM_REVISAO' };
    const { controller, kanban } = fixture([reviewing, { ...reviewing, id: 'second', permissoes: { ...task.permissoes, aprovar: false } }]);
    await expect(controller.moverEtapa('workspace', 'EM_REVISAO', 'CONCLUIDA', req)).rejects.toThrow(ForbiddenException);
    expect(kanban.command).not.toHaveBeenCalled();
  });

  test('a batch cannot bypass the reason required for a correction', async () => {
    const { controller, kanban } = fixture([{ ...task, colunaId: 'review', status: 'EM_REVISAO' }]);
    await expect(controller.moverEtapa('workspace', 'EM_REVISAO', 'EM_ANDAMENTO', req)).rejects.toThrow(BadRequestException);
    expect(kanban.command).not.toHaveBeenCalled();
  });

  test('a batch cannot pause a running executor timer without pause permission', async () => {
    const { controller, kanban } = fixture([{ ...task, status: 'EM_ANDAMENTO', colunaId: 'doing', permissoes: { ...task.permissoes, pausar: false }, tempo: { sessaoAtiva: { id: 'session' } } }]);
    await expect(controller.moverEtapa('workspace', 'EM_ANDAMENTO', 'A_FAZER', req)).rejects.toThrow(ForbiddenException);
    expect(kanban.command).not.toHaveBeenCalled();
  });

  test('native backup import keeps forwarding task data and the destination workspace', async () => {
    const { controller, service } = fixture();
    const tasks = [{ titulo: 'Existing backup task', status: 'EM_ANDAMENTO' }];
    await expect(controller.importarBackup({ buffer: Buffer.from(JSON.stringify({ tarefas: tasks })) } as any, 'workspace')).resolves.toEqual({ criadas: 1 });
    expect(service.importarBackup).toHaveBeenCalledWith(tasks, 'workspace');
  });

  test('invalid backup input is rejected without importing records', async () => {
    const { controller, service } = fixture();
    await expect(controller.importarBackup({ buffer: Buffer.from('invalid json') } as any, 'workspace')).rejects.toThrow(BadRequestException);
    expect(service.importarBackup).not.toHaveBeenCalled();
  });
});
