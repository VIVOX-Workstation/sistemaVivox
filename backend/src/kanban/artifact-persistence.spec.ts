jest.mock('../tarefas/tarefas.service', () => ({ TarefasService: jest.fn() }));
jest.mock('../storage/storage.service', () => ({ StorageService: jest.fn() }));
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ForbiddenException } from '@nestjs/common';
import { CreateTarefaDto } from '../tarefas/dto/create-tarefa.dto';
import { KanbanService } from './kanban.service';
import { TarefasController } from '../tarefas/tarefas.controller';

const executor = { id: 'executor', role: 'COLABORADOR' };
const owner = { id: 'owner', role: 'COLABORADOR' };
const link = { id: 'l1', url: 'https://example.com/brief', title: 'Briefing', by: 'Falso', at: '2000-01-01T00:00:00.000Z' };
function setup(links: any[] = []) {
  const task: any = { id: 't', quadroId: 'board', autorId: owner.id, responsavelId: executor.id, versao: 1, sessoes: [], observadores: [], linksReferencia: links };
  const tx: any = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    user: { findUnique: jest.fn().mockResolvedValue({ nome: 'Pessoa real' }) },
    tarefa: { findUnique: jest.fn().mockResolvedValue(task), findUniqueOrThrow: jest.fn().mockResolvedValue(task), update: jest.fn() },
  };
  const prisma: any = { $transaction: jest.fn((fn: any) => fn(tx)), tarefa: tx.tarefa };
  return { service: new KanbanService(prisma), tx };
}

describe('VVOX Sync Artifact persistence boundaries', () => {
  test('accepts real task fields and rejects unsafe links and oversized lists', async () => {
    const data = { titulo: 'Conteúdo', clienteNome: 'Cliente', fonte: 'WhatsApp', linksReferencia: [link] };
    expect(await validate(plainToInstance(CreateTarefaDto, data))).toHaveLength(0);
    expect(await validate(plainToInstance(CreateTarefaDto, { ...data, linksReferencia: [{ ...link, url: 'javascript:alert(1)' }] }))).not.toHaveLength(0);
    expect(await validate(plainToInstance(CreateTarefaDto, { ...data, linksReferencia: Array.from({ length: 31 }, () => link) }))).not.toHaveLength(0);
  });
  test('creating or duplicating a task replaces supplied link identity and date on the server', async () => {
    const { service, tx } = setup();
    tx.kanbanQuadro = { findUnique: jest.fn().mockResolvedValue({ id: 'board' }) };
    tx.kanbanColuna = { findFirst: jest.fn().mockResolvedValue({ id: 'queue', papel: 'queue', statusLegado: 'A_FAZER' }) };
    tx.tarefa.aggregate = jest.fn().mockResolvedValue({ _max: { ordem: 0 } });
    tx.tarefa.create = jest.fn().mockResolvedValue({ id: 'copy' });
    jest.spyOn(service, 'getTask').mockResolvedValue({ id: 'copy' } as any);
    const started = Date.now();
    await service.createTask({ titulo: 'Conteúdo (cópia)', quadroId: 'board', linksReferencia: [{ ...link, autorId: 'forged-actor' }] }, owner);
    const stored = tx.tarefa.create.mock.calls[0][0].data.linksReferencia[0];
    expect(stored).toMatchObject({ id: 'l1', url: link.url, title: link.title, by: 'Pessoa real', autorId: owner.id });
    expect(Date.parse(stored.at)).toBeGreaterThanOrEqual(started);
    expect(Date.parse(stored.at)).toBeLessThanOrEqual(Date.now());
    expect(stored.at).not.toBe(link.at);
  });
  test('executor may attach a link and the server supplies identity and timestamp', async () => {
    const { service, tx } = setup();
    await service.updateTask('t', { linksReferencia: [link], versao: 1 }, executor);
    const stored = tx.tarefa.update.mock.calls[0][0].data.linksReferencia[0];
    expect(stored).toMatchObject({ id: 'l1', by: 'Pessoa real', autorId: executor.id });
    expect(stored.at).not.toBe(link.at);
  });
  test('executor cannot use a links update to change general task fields', async () => {
    const { service, tx } = setup();
    await expect(service.updateTask('t', { linksReferencia: [link], clienteNome: 'Outro', versao: 1 }, executor)).rejects.toThrow(ForbiddenException);
    expect(tx.tarefa.update).not.toHaveBeenCalled();
  });
  test('executor cannot remove another participant link', async () => {
    const { service, tx } = setup([{ ...link, autorId: owner.id }]);
    await expect(service.updateTask('t', { linksReferencia: [], versao: 1 }, executor)).rejects.toThrow(ForbiddenException);
    expect(tx.tarefa.update).not.toHaveBeenCalled();
  });
  test('link author may remove their own link', async () => {
    const { service, tx } = setup([{ ...link, autorId: executor.id }]);
    await service.updateTask('t', { linksReferencia: [], versao: 1 }, executor);
    expect(tx.tarefa.update.mock.calls[0][0].data.linksReferencia).toEqual([]);
  });
  test('manager may update client/source and remove links', async () => {
    const { service, tx } = setup([{ ...link, autorId: executor.id }]);
    await service.updateTask('t', { clienteNome: 'Cliente novo', fonte: 'Reunião', linksReferencia: [], versao: 1 }, owner);
    expect(tx.tarefa.update.mock.calls[0][0].data).toMatchObject({ clienteNome: 'Cliente novo', fonte: 'Reunião', linksReferencia: [] });
  });
  test('audio metadata is passed to the persisted attachment after access check', async () => {
    const storage = { uploadFile: jest.fn().mockResolvedValue('http://localhost:9000/test/audio.wav') };
    const kanban = { getTask: jest.fn().mockResolvedValue({ permissoes: { comentar: true } }), comment: jest.fn().mockResolvedValue({ id: 'comment' }) };
    const controller = new TarefasController({} as any, storage as any, kanban as any);
    const file = { originalname: 'audio.wav', mimetype: 'audio/wav', size: 40 } as Express.Multer.File;
    await controller.uploadAnexo('t', file, { audioDuracao: 3 }, { user: executor });
    expect(kanban.comment).toHaveBeenCalledWith('t', expect.stringContaining('audio.wav'), executor, { anexoTipo: 'audio/wav', anexoTamanho: 40, audioDuracao: 3 });
    kanban.getTask.mockResolvedValue({ permissoes: { comentar: false } });
    await expect(controller.uploadAnexo('t', file, { audioDuracao: 3 }, { user: executor })).rejects.toThrow(ForbiddenException);
    expect(storage.uploadFile).toHaveBeenCalledTimes(1);
  });
});
