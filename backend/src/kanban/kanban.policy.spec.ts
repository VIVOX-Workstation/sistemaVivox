import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { syncPermissions, assertPermission, moveAction } from './kanban.policy';

describe('VVOX Sync task policy', () => {
  const task = { autorId: 'owner', responsavelId: 'executor', revisorId: 'reviewer', status: 'EM_REVISAO', colunaId: 'review', sessoes: [], observadores: [{ id: 'observer' }] };
  const actor = (id: string, role = 'COLABORADOR') => ({ id, role });
  test.each(['owner', 'reviewer'])('%s can approve or request correction', id => {
    expect(syncPermissions(task, actor(id)).aprovar).toBe(true);
    expect(syncPermissions(task, actor(id)).corrigir).toBe(true);
  });
  test('administrator can approve and another participant cannot', () => {
    expect(syncPermissions(task, actor('admin','ADMIN')).aprovar).toBe(true);
    expect(() => assertPermission(task, actor('executor'), 'aprovar')).toThrow(ForbiddenException);
    expect(() => assertPermission(task, actor('observer'), 'aprovar')).toThrow(ForbiddenException);
  });
  test('only executor/admin controls work and marks checklist', () => {
    const queued = { ...task, status: 'A_FAZER' };
    expect(syncPermissions(queued, actor('executor')).iniciar).toBe(true);
    expect(syncPermissions(queued, actor('owner')).iniciar).toBe(false);
    expect(syncPermissions(queued, actor('reviewer')).marcarChecklist).toBe(false);
    expect(syncPermissions(queued, actor('executor')).marcarChecklist).toBe(true);
    expect(syncPermissions({ ...queued, responsavelId: null }, actor('admin','ADMIN')).iniciar).toBe(false);
  });
  test('review is required and completed work cannot restart through drag', () => {
    expect(syncPermissions({ ...task, status: 'EM_ANDAMENTO' }, actor('owner')).aprovar).toBe(false);
    expect(moveAction(task, { id: 'done', papel: 'done' })).toBe('aprovar');
    expect(moveAction(task, { id: 'doing', papel: 'doing' })).toBe('corrigir');
    expect(() => moveAction(task, { id: 'queue', papel: 'queue' })).toThrow(BadRequestException);
    expect(() => moveAction({ ...task, status: 'CONCLUIDA', colunaId: 'done' }, { id: 'doing', papel: 'doing' })).toThrow(BadRequestException);
  });
  test('same-column reorder never restarts timers or reopens completed work', () => {
    expect(moveAction({ ...task, status: 'EM_ANDAMENTO', colunaId: 'doing' }, { id: 'doing', papel: 'doing' })).toBe('reordenar');
    expect(moveAction({ ...task, status: 'CONCLUIDA', colunaId: 'done' }, { id: 'done', papel: 'done' })).toBe('reordenar');
    expect(syncPermissions({ ...task, status: 'CONCLUIDA' }, actor('owner')).mover).toBe(true);
  });
  test('only participants see a task and executor cannot change its structure', () => {
    expect(syncPermissions(task, actor('outside')).visualizar).toBe(false);
    expect(syncPermissions(task, actor('observer')).visualizar).toBe(true);
    expect(syncPermissions(task, actor('executor')).editarChecklist).toBe(false);
    expect(syncPermissions(task, actor('executor')).editar).toBe(false);
  });
});
