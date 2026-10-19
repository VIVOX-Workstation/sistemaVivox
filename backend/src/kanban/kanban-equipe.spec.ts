import { ForbiddenException } from '@nestjs/common';
import { funcaoDe, limparCargos, limparDiasClientes, limparPermissoes, permOn, pode } from './kanban-equipe.policy';
import { KanbanEquipeService } from './kanban-equipe.service';

describe('Equipe do VVOX Sync', () => {
  it('usa a função salva na conta ou deduz pelo acesso', () => {
    expect(funcaoDe({ role: 'ADMIN' })).toBe('owner');
    expect(funcaoDe({ role: 'COLABORADOR' })).toBe('maker');
    expect(funcaoDe({ role: 'COLABORADOR', funcaoKanban: 'lead' })).toBe('lead');
    expect(funcaoDe({ role: 'COLABORADOR', funcaoKanban: 'hacker' })).toBe('maker');
  });

  it('segue a matriz padrão e as mudanças do administrador', () => {
    expect(permOn({}, 'maker', 'task_move')).toBe(true);
    expect(permOn({}, 'maker', 'approve')).toBe(false);
    expect(permOn({}, 'lead', 'approve')).toBe(true);
    expect(permOn({ maker: { task_move: false } }, 'maker', 'task_move')).toBe(false);
    expect(permOn({ owner: { comment: false } } as any, 'owner', 'comment')).toBe(true);
    expect(pode({ role: 'ADMIN', funcaoKanban: 'viewer' }, { viewer: { comment: false } }, 'comment')).toBe(true);
    expect(pode({ role: 'COLABORADOR', funcaoKanban: 'viewer' }, {}, 'task_create')).toBe(false);
  });

  it('descarta valores desconhecidos ao salvar', () => {
    expect(limparPermissoes({ owner: { comment: false }, lead: { approve: false, x: true, export: 'sim' } })).toEqual({ lead: { approve: false } });
    expect(limparCargos([' Designer ', 'Designer', '', 'x'.repeat(40), 3])).toEqual(['Designer']);
    expect(limparDiasClientes({ 'Clínica Aurora': [4, 2, 2, 9], '': [1], Outro: 'x' })).toEqual({ 'Clínica Aurora': [2, 4] });
  });

  function service(user: any, permissoes: any = {}) {
    const prisma: any = {
      user: { findUnique: jest.fn().mockResolvedValue(user), update: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      kanbanConfig: { findUnique: jest.fn().mockResolvedValue({ permissoes, cargos: [], diasClientes: {} }), upsert: jest.fn() },
      cliente: { findMany: jest.fn().mockResolvedValue([]) },
    };
    return { svc: new KanbanEquipeService(prisma), prisma };
  }

  it('bloqueia no servidor o que a função não permite', async () => {
    const { svc } = service({ id: 'u1', role: 'COLABORADOR', funcaoKanban: 'maker' });
    await expect(svc.exigir({ id: 'u1', role: 'COLABORADOR' }, 'task_delete')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.exigir({ id: 'u1', role: 'COLABORADOR' }, 'task_move')).resolves.toBeUndefined();
  });

  it('só o administrador muda função, cargo e permissões', async () => {
    const { svc, prisma } = service({ id: 'u1', role: 'COLABORADOR' });
    await expect(svc.atualizarPessoa('u2', { funcao: 'lead' }, { id: 'u1', role: 'COLABORADOR' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.salvarPermissoes({}, { id: 'u1', role: 'COLABORADOR' })).rejects.toBeInstanceOf(ForbiddenException);
    prisma.user.findUnique.mockResolvedValue({ id: 'u2', role: 'COLABORADOR' });
    prisma.user.update.mockResolvedValue({ id: 'u2', nome: 'Ana', email: 'a@x', role: 'COLABORADOR', cargo: 'Designer', funcaoKanban: 'lead', fotoUrl: null });
    const out = await svc.atualizarPessoa('u2', { funcao: 'lead', cargo: 'Designer' }, { id: 'adm', role: 'ADMIN' });
    expect(out).toMatchObject({ funcao: 'lead', cargo: 'Designer' });
    expect(prisma.kanbanConfig.upsert).toHaveBeenCalled();
  });

  it('dias de postagem exigem a permissão do calendário', async () => {
    const { svc, prisma } = service({ id: 'u1', role: 'COLABORADOR', funcaoKanban: 'lead' });
    await expect(svc.salvarDiasCliente('Clínica Aurora', [1, 3], { id: 'u1', role: 'COLABORADOR' })).rejects.toBeInstanceOf(ForbiddenException);
    const ok = await svc.salvarDiasCliente('Clínica Aurora', [3, 1], { id: 'adm', role: 'ADMIN' });
    expect(ok.diasClientes).toEqual({ 'Clínica Aurora': [1, 3] });
    expect(prisma.kanbanConfig.upsert).toHaveBeenCalled();
  });
});
