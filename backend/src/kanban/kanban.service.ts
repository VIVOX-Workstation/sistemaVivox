import { createHash } from 'node:crypto';
import { Injectable, BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SyncActor, SyncAction, assertPermission, moveAction, syncPermissions } from './kanban.policy';

const userSelect = { id: true, nome: true, email: true };
const include = {
  autor: { select: userSelect }, responsavel: { select: userSelect }, revisor: { select: userSelect },
  observadores: { select: userSelect }, cliente: { select: { id: true, nomeFantasia: true, logoUrl: true } },
  projeto: { select: { id: true, nome: true, cor: true } },
  servico: { select: { id: true, tipoServico: true, status: true } },
  coluna: true,
  checklist: { orderBy: { ordem: 'asc' as const } },
  sessoes: { where: { fim: null } },
  _count: { select: { comentarios: true, checklist: true } },
};
type Tx = Prisma.TransactionClient;

@Injectable()
export class KanbanService {
  constructor(private readonly prisma: PrismaService) {}

  visibility(actor: SyncActor): any {
    return actor.role === 'ADMIN' ? {} : { OR: [
      { autorId: actor.id }, { responsavelId: actor.id }, { revisorId: actor.id }, { observadores: { some: { id: actor.id } } },
    ] };
  }

  present(task: any, actor: SyncActor) {
    const active = (task.sessoes || []).find((s: any) => !s.fim);
    const accumulated = Math.max(0, (task.horasGastas || 0) * 3600);
    const elapsed = active ? Math.max(0, (Date.now() - new Date(active.inicio).getTime()) / 1000) : 0;
    const { sessoes, ...rest } = task;
    return { ...rest, permissoes: syncPermissions(task, actor), tempo: {
      acumuladoSegundos: accumulated, totalSegundos: accumulated + elapsed,
      sessaoAtiva: active ? { id: active.id, usuarioId: active.usuarioId, inicio: active.inicio } : null,
    } };
  }

  async getTask(id: string, actor: SyncActor) {
    const task = await this.prisma.tarefa.findUnique({ where: { id }, include: {
      ...include, comentarios: { include: { autor: { select: userSelect } }, orderBy: { createdAt: 'asc' } },
    } });
    if (!task) throw new NotFoundException('Tarefa não encontrada.');
    assertPermission(task, actor, 'visualizar');
    return this.present(task, actor);
  }

  async listTasks(actor: SyncActor, filters: any = {}, quadroId?: string) {
    const where: any = { AND: [this.visibility(actor)] };
    for (const key of ['status', 'prioridade', 'responsavelId', 'clienteId', 'projetoId', 'servicoId']) {
      if (filters[key]) where[key] = filters[key];
    }
    if (quadroId) where.quadroId = quadroId;
    if (filters.search?.trim()) {
      const search = filters.search.trim();
      const number = /^#?\d+$/.test(search) ? Number(search.replace('#', '')) : null;
      where.AND.push({ OR: [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { cliente: { nomeFantasia: { contains: search, mode: 'insensitive' } } },
        ...(number === null ? [] : [{ numero: number }]),
      ] });
    }
    const tasks = await this.prisma.tarefa.findMany({ where, include, orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] });
    return tasks.map(t => this.present(t, actor));
  }

  async listBoards(actor: SyncActor) {
    const boards = await this.prisma.kanbanQuadro.findMany({ include: { colunas: { orderBy: { ordem: 'asc' } } }, orderBy: [{ fixo: 'desc' }, { createdAt: 'asc' }] });
    return boards.map(b => ({ ...b, permissoes: { configurar: !b.fixo && (actor.role === 'ADMIN' || b.criadorId === actor.id) } }));
  }

  async getBoard(id: string, actor: SyncActor) {
    const board = (await this.listBoards(actor)).find(b => b.id === id);
    if (!board) throw new NotFoundException('Quadro não encontrado.');
    return board;
  }

  async createBoard(nome: string, actor: SyncActor, appearance: any = {}) {
    const defaults = [
      ['Recebimento de demanda', 'queue', '#94a3b8', 'BACKLOG'],
      ['Estruturação e a fazer', 'queue', '#c7a15f', 'A_FAZER'],
      ['Em execução', 'doing', '#3b82f6', 'EM_ANDAMENTO'],
      ['Aprovação interna', 'review', '#a855f7', 'EM_REVISAO'],
      ['Concluídas', 'done', '#22c55e', 'CONCLUIDA'],
    ];
    const customColumns = appearance.colunas;
    if (customColumns) {
      for (const role of ['doing', 'review', 'done']) {
        if (customColumns.filter((c: any) => c.papel === role).length !== 1) throw new BadRequestException('O quadro precisa de uma etapa de execução, uma de aprovação e uma de conclusão.');
      }
      if (!customColumns.some((c: any) => ['queue', 'none'].includes(c.papel || 'none'))) throw new BadRequestException('Inclua uma etapa inicial no quadro.');
    }
    const columns = customColumns ? customColumns.map((c: any, ordem: number) => ({
      nome: this.name(c.nome), papel: c.papel || 'none', cor: c.cor || '#C7A15F', corInterface: c.corInterface,
      icone: c.icone, marcador: c.marcador, preenchida: c.preenchida, planoPublicacao: c.planoPublicacao, ordem,
      statusLegado: ({ doing: 'EM_ANDAMENTO', review: 'EM_REVISAO', done: 'CONCLUIDA', queue: 'A_FAZER' } as any)[c.papel] || null,
    })) : defaults.map(([nome, papel, cor, statusLegado], ordem) => ({ nome, papel, cor, statusLegado, ordem }));
    const board = await this.prisma.kanbanQuadro.create({ data: {
      nome: this.name(nome), criadorId: actor.id, descricao: appearance.descricao, icone: appearance.icone, cor: appearance.cor,
      colunas: { create: columns },
    } });
    return this.getBoard(board.id, actor);
  }

  private name(value: string) {
    if (!value?.trim()) throw new BadRequestException('Informe um nome.');
    return value.trim();
  }

  private async configurable(id: string, actor: SyncActor, tx: any = this.prisma) {
    const board = await tx.kanbanQuadro.findUnique({ where: { id } });
    if (!board) throw new NotFoundException('Quadro não encontrado.');
    if (board.fixo) throw new ForbiddenException('A estrutura da Operação diária é fixa.');
    if (actor.role !== 'ADMIN' && board.criadorId !== actor.id) throw new ForbiddenException('Somente o proprietário do quadro ou administrador pode configurá-lo.');
    return board;
  }

  async updateBoard(id: string, dto: any, actor: SyncActor) {
    await this.configurable(id, actor);
    await this.prisma.kanbanQuadro.update({ where: { id }, data: { nome: this.name(dto.nome), descricao: dto.descricao, icone: dto.icone, cor: dto.cor } });
    return this.getBoard(id, actor);
  }

  async removeBoard(id: string, actor: SyncActor) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "KanbanQuadro" WHERE "id"=${id} FOR UPDATE`;
      await this.configurable(id, actor, tx);
      if (await tx.tarefa.count({ where: { quadroId: id } })) throw new BadRequestException('Só é possível excluir um quadro vazio.');
      return tx.kanbanQuadro.delete({ where: { id } });
    });
  }

  async addColumn(id: string, dto: any, actor: SyncActor) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "KanbanQuadro" WHERE "id"=${id} FOR UPDATE`;
      await this.configurable(id, actor, tx);
      const papel = dto.papel || 'none';
      await this.validateRole(tx, id, papel);
      const last = await tx.kanbanColuna.aggregate({ where: { quadroId: id }, _max: { ordem: true } });
      return tx.kanbanColuna.create({ data: { quadroId: id, nome: this.name(dto.nome), papel, cor: dto.cor || '#C7A15F', corInterface: dto.corInterface, icone: dto.icone, marcador: dto.marcador, preenchida: dto.preenchida, planoPublicacao: dto.planoPublicacao, ordem: (last._max.ordem ?? -1) + 1 } });
    });
  }

  async updateColumn(id: string, dto: any, actor: SyncActor) {
    return this.prisma.$transaction(async tx => {
      const col = await tx.kanbanColuna.findUnique({ where: { id } });
      if (!col) throw new NotFoundException('Coluna não encontrada.');
      await tx.$queryRaw`SELECT "id" FROM "KanbanQuadro" WHERE "id"=${col.quadroId} FOR UPDATE`;
      await this.configurable(col.quadroId, actor, tx);
      if (dto.papel && dto.papel !== col.papel) {
        if (['doing', 'review', 'done'].includes(col.papel)) throw new BadRequestException('Preserve as etapas de execução, revisão e conclusão.');
        if (await tx.tarefa.count({ where: { colunaId: id } })) throw new BadRequestException('Esvazie a coluna antes de alterar sua função.');
        await this.validateRole(tx, col.quadroId, dto.papel, id);
      }
      const result = await tx.kanbanColuna.update({ where: { id }, data: {
        ...(dto.nome !== undefined ? { nome: this.name(dto.nome) } : {}),
        ...(dto.cor !== undefined ? { cor: dto.cor } : {}),
        ...(dto.corInterface !== undefined ? { corInterface: dto.corInterface } : {}),
        ...(dto.icone !== undefined ? { icone: dto.icone } : {}),
        ...(dto.marcador !== undefined ? { marcador: dto.marcador } : {}),
        ...(dto.preenchida !== undefined ? { preenchida: dto.preenchida } : {}),
        ...(dto.planoPublicacao !== undefined ? { planoPublicacao: dto.planoPublicacao } : {}),
        ...(dto.papel !== undefined ? { papel: dto.papel } : {}),
      } });
      if (dto.ordem !== undefined) {
        const columns = await tx.kanbanColuna.findMany({ where: { quadroId: col.quadroId, id: { not: id } }, orderBy: { ordem: 'asc' } });
        columns.splice(Math.min(dto.ordem, columns.length), 0, result);
        for (const [ordem, c] of columns.entries()) await tx.kanbanColuna.update({ where: { id: c.id }, data: { ordem } });
      }
      return tx.kanbanColuna.findUnique({ where: { id } });
    });
  }

  async removeColumn(id: string, actor: SyncActor) {
    return this.prisma.$transaction(async tx => {
      const col = await tx.kanbanColuna.findUnique({ where: { id } });
      if (!col) throw new NotFoundException('Coluna não encontrada.');
      await tx.$queryRaw`SELECT "id" FROM "KanbanQuadro" WHERE "id"=${col.quadroId} FOR UPDATE`;
      await this.configurable(col.quadroId, actor, tx);
      if (['doing', 'review', 'done'].includes(col.papel)) throw new BadRequestException('As etapas do fluxo de aprovação são obrigatórias.');
      if (await tx.tarefa.count({ where: { colunaId: id } })) throw new BadRequestException('Mova as tarefas antes de excluir a coluna.');
      return tx.kanbanColuna.delete({ where: { id } });
    });
  }

  private async validateRole(tx: Tx, quadroId: string, papel: string, ignore?: string) {
    if (!['queue', 'doing', 'review', 'done', 'none'].includes(papel)) throw new BadRequestException('Função de coluna inválida.');
    if (['doing', 'review', 'done'].includes(papel) && await tx.kanbanColuna.count({ where: { quadroId, papel, ...(ignore ? { id: { not: ignore } } : {}) } })) {
      throw new BadRequestException('Já existe uma coluna com esta função.');
    }
  }

  private async validatePeople(tx: Tx, values: (string | null | undefined)[]) {
    const ids = [...new Set(values.filter(Boolean) as string[])];
    if (!ids.length) return;
    const count = await tx.user.count({ where: { id: { in: ids }, role: { not: 'CLIENTE' } } });
    if (count !== ids.length) throw new BadRequestException('Selecione participantes internos válidos.');
  }

  private async referenceLinks(tx: Tx, task: any, wanted: any, actor: SyncActor) {
    if (!Array.isArray(wanted) || wanted.length > 30) throw new BadRequestException('Limite de 30 links por tarefa.');
    const before: any[] = Array.isArray(task.linksReferencia) ? task.linksReferencia : [];
    const ids = new Set<string>();
    const urls = new Set<string>();
    const canManage = syncPermissions(task, actor).editar;
    for (const old of before) {
      if (!wanted.some(link => link.id === old.id) && !canManage && old.autorId !== actor.id) throw new ForbiddenException('Somente o autor do link ou quem gerencia a tarefa pode removê-lo.');
    }
    const person = await tx.user.findUnique({ where: { id: actor.id }, select: { nome: true } });
    return wanted.map(link => {
      if (!link || typeof link.id !== 'string' || !link.id || ids.has(link.id)) throw new BadRequestException('Identificador de link inválido.');
      ids.add(link.id);
      let url: URL;
      try { url = new URL(link.url); } catch { throw new BadRequestException('Endereço do link inválido.'); }
      if (!['http:', 'https:'].includes(url.protocol) || urls.has(url.href)) throw new BadRequestException('Use links http(s) sem repetições.');
      urls.add(url.href);
      const old = before.find(item => item.id === link.id);
      if (old) {
        if (old.url !== link.url || (old.title || '') !== (link.title || '')) throw new BadRequestException('Remova o link antigo antes de substituí-lo.');
        return old;
      }
      return { id: link.id, url: url.href, title: link.title || '', by: person?.nome || 'Usuário', autorId: actor.id, at: new Date().toISOString() };
    });
  }

  private isLegacyCustomStatus(status: unknown): status is string {
    return typeof status === 'string' && status.length <= 256 && /^col_\d+_[a-z0-9_]*$/i.test(status);
  }

  private async ensureLegacyColumn(tx: Tx, quadroId: string, status: string) {
    if (!this.isLegacyCustomStatus(status)) throw new BadRequestException('Use uma etapa persistida do quadro.');
    const existing = await tx.kanbanColuna.findFirst({ where: { quadroId, statusLegado: status } });
    if (existing) return existing;
    const id = 'sync-legado-' + createHash('md5').update(quadroId + ':' + status).digest('hex');
    const title = status.replace(/^col_\d+_/i, '').replace(/_/g, ' ').trim().toUpperCase();
    const last = await tx.kanbanColuna.aggregate({ where: { quadroId }, _max: { ordem: true } });
    return tx.kanbanColuna.upsert({
      where: { id }, update: {},
      create: { id, quadroId, nome: title.slice(0, 160) || 'Etapa personalizada', papel: 'none', statusLegado: status, ordem: (last._max.ordem ?? -1) + 1 },
    });
  }

  async legacyDestination(id: string, status: string, actor: SyncActor, versao?: number) {
    const existing = await this.prisma.tarefa.findUnique({ where: { id }, include });
    if (!existing) throw new NotFoundException('Tarefa não encontrada.');
    assertPermission(existing, actor, 'visualizar');
    const col = await this.prisma.kanbanColuna.findFirst({ where: { quadroId: existing.quadroId || 'vivox-sync-diario', statusLegado: status } });
    if (col) return col;
    if (!this.isLegacyCustomStatus(status)) throw new BadRequestException('Use uma etapa persistida do quadro.');
    return this.prisma.$transaction(async tx => {
      const task = await this.lockedTask(tx, id);
      this.checkVersion(task, versao);
      assertPermission(task, actor, 'mover');
      if (!task.quadroId) throw new BadRequestException('A tarefa ainda não está vinculada ao Kanban.');
      moveAction(task, { id: 'legacy-custom-destination', papel: 'none' });
      if (task.sessoes.length) assertPermission(task, actor, 'pausar');
      return this.ensureLegacyColumn(tx, task.quadroId, status);
    });
  }

  async createTask(dto: any, actor: SyncActor) {
    if ((dto.horasGastas || 0) > 0 && actor.role !== 'ADMIN') throw new ForbiddenException('Somente administradores podem informar tempo acumulado anterior.');
    const task = await this.prisma.$transaction(async tx => {
      const quadroId = dto.quadroId || 'vivox-sync-diario';
      await tx.$queryRaw`SELECT "id" FROM "KanbanQuadro" WHERE "id"=${quadroId} FOR UPDATE`;
      const board = await tx.kanbanQuadro.findUnique({ where: { id: quadroId } });
      if (!board) throw new BadRequestException('Quadro não encontrado.');
      let col = dto.colunaId
        ? await tx.kanbanColuna.findFirst({ where: { id: dto.colunaId, quadroId } })
        : await tx.kanbanColuna.findFirst({ where: { quadroId, ...(dto.status ? { statusLegado: dto.status } : { papel: 'queue' }) }, orderBy: { ordem: 'asc' } });
      if (!col && !dto.colunaId && this.isLegacyCustomStatus(dto.status)) col = await this.ensureLegacyColumn(tx, quadroId, dto.status);
      if (!col || !['queue', 'none'].includes(col.papel) || (dto.status && (col.statusLegado !== dto.status || ['EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDA', 'CANCELADA'].includes(dto.status)))) throw new BadRequestException('Crie a demanda em uma etapa inicial e use as ações de execução e aprovação.');
      await this.validatePeople(tx, [dto.responsavelId, dto.revisorId]);
      const links = dto.linksReferencia?.length ? await this.referenceLinks(tx, { autorId: actor.id, linksReferencia: [] }, dto.linksReferencia, actor) : [];
      const last = await tx.tarefa.aggregate({ where: { colunaId: col.id }, _max: { ordem: true } });
      return tx.tarefa.create({ data: {
        titulo: this.name(dto.titulo), descricao: dto.descricao, prioridade: dto.prioridade,
        clienteNome: dto.clienteNome, fonte: dto.fonte, subtitulo: dto.subtitulo, linksReferencia: links,
        prazo: dto.prazo ? new Date(dto.prazo) : null, dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : null,
        horasEstimadas: dto.horasEstimadas, horasGastas: Math.max(0, dto.horasGastas || 0), tags: dto.tags || [],
        autorId: actor.id, responsavelId: dto.responsavelId || null, revisorId: dto.revisorId || null,
        clienteId: dto.clienteId || null, projetoId: dto.projetoId || null, servicoId: dto.servicoId || null,
        quadroId, colunaId: col.id, status: col.statusLegado || 'A_FAZER', ordem: (last._max.ordem ?? -1) + 1,
        checklist: { create: (dto.checklist || []).map((titulo: string, ordem: number) => ({ titulo, ordem })) },
      } });
    });
    return this.getTask(task.id, actor);
  }


  private async lockedTask(tx: Tx, id: string) {
    // Serialize cross-board transitions before row locks; a start may pause work
    // on another board, so taking only destination-board locks can deadlock.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(82471101)::text`;
    const first = await tx.tarefa.findUnique({ where: { id }, select: { responsavelId: true, quadroId: true } });
    if (!first) throw new NotFoundException('Tarefa não encontrada.');
    if (first.responsavelId) await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${first.responsavelId} FOR UPDATE`;
    if (first.quadroId) await tx.$queryRaw`SELECT "id" FROM "KanbanQuadro" WHERE "id"=${first.quadroId} FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "Tarefa" WHERE "id"=${id} FOR UPDATE`;
    const task = await tx.tarefa.findUniqueOrThrow({ where: { id }, include });
    if (task.responsavelId !== first.responsavelId) throw new ConflictException('O executor mudou. Atualize a tarefa e tente novamente.');
    return task;
  }

  private checkVersion(task: any, versao?: number) {
    if (versao !== undefined && task.versao !== versao) throw new ConflictException('A tarefa foi alterada em outra sessão. Atualize antes de continuar.');
  }

  private async event(tx: Tx, tarefaId: string, actor: SyncActor, texto: string) {
    await tx.tarefaComentario.create({ data: { tarefaId, autorId: actor.id, texto, sistema: true } });
  }

  private async closeSessions(tx: Tx, tarefaId: string, now: Date) {
    const sessions = await tx.tarefaSessao.findMany({ where: { tarefaId, fim: null } });
    for (const s of sessions) {
      const segundos = Math.max(0, (now.getTime() - s.inicio.getTime()) / 1000);
      await tx.tarefaSessao.update({ where: { id: s.id }, data: { fim: now, segundos } });
      // COALESCE preserves imported tasks whose legacy hours were NULL.
      await tx.$executeRaw`UPDATE "Tarefa" SET "horasGastas"=COALESCE("horasGastas",0)+${segundos / 3600} WHERE "id"=${tarefaId}`;
    }
  }

  private async position(tx: Tx, task: any, colunaId: string, dto: any) {
    const items = await tx.tarefa.findMany({ where: { colunaId, id: { not: task.id } }, orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }], select: { id: true } });
    if (dto.antesDeId && dto.depoisDeId) throw new BadRequestException('Informe apenas um vizinho para posicionar a tarefa.');
    let index = items.length;
    if (dto.antesDeId || dto.depoisDeId) {
      index = items.findIndex(t => t.id === (dto.antesDeId || dto.depoisDeId));
      if (index < 0) throw new ConflictException('O cartão de referência mudou de coluna. Atualize o quadro.');
      if (dto.depoisDeId) index += 1;
    }
    items.splice(index, 0, { id: task.id });
    for (const [ordem, t] of items.entries()) {
      await tx.tarefa.update({ where: { id: t.id }, data: { ordem, ...(t.id === task.id ? { colunaId } : {}) } });
    }
  }

  private async synchronize(tx: Tx, task: any, status: string, now: Date, actor: SyncActor) {
    if (status === task.status) return;
    const statusChamado = status === 'CONCLUIDA' || status === 'CANCELADA' ? 'RESOLVIDO' : ['A_FAZER', 'BACKLOG'].includes(status) ? 'ABERTO' : 'EM_ANDAMENTO';
    await tx.chamado.updateMany({ where: { tarefaId: task.id }, data: { status: statusChamado, resolvidoEm: statusChamado === 'RESOLVIDO' ? now : null } });
    if (status === 'CONCLUIDA' && task.servicoId) {
      await tx.servicoHistorico.create({ data: { servicoId: task.servicoId, usuarioId: actor.id, acao: 'Demanda "' + task.titulo + '" aprovada e concluída no VVOX Sync.' } });
    }
  }

  async command(id: string, requested: SyncAction, dto: any, actor: SyncActor) {
    await this.prisma.$transaction(async tx => {
      const task = await this.lockedTask(tx, id);
      assertPermission(task, actor, 'visualizar');
      this.checkVersion(task, dto.versao);
      if (!task.quadroId) throw new BadRequestException('A tarefa ainda não está vinculada ao Kanban.');
      const columns = await tx.kanbanColuna.findMany({ where: { quadroId: task.quadroId }, orderBy: { ordem: 'asc' } });
      let target = requested === 'mover' ? columns.find(c => c.id === dto.colunaId) : undefined;
      if (requested === 'mover' && !target) throw new BadRequestException('A coluna de destino deve pertencer ao quadro da tarefa.');
      const action = requested === 'mover' ? moveAction(task, target) : requested;
      const now = new Date();
      const data: any = { versao: { increment: 1 } };
      let message = '';
      if (action === 'reordenar' || action === 'organizar') {
        assertPermission(task, actor, 'mover');
        if (action === 'organizar') {
          if (task.sessoes.length) assertPermission(task, actor, 'pausar');
          await this.closeSessions(tx, id, now);
          data.status = target?.statusLegado || (target?.papel === 'queue' ? 'A_FAZER' : task.status);
          message = 'moveu a demanda para ' + target!.nome + '.';
        }
      } else {
        // Repeating a command without a version is safe and never double counts.
        const self = actor.role === 'ADMIN' || task.responsavelId === actor.id;
        if (action === 'iniciar' && task.sessoes.length && self) return;
        if (action === 'pausar' && !task.sessoes.length && self) return;
        if (action === 'entregar' && task.status === 'EM_REVISAO' && self) return;
        if (action === 'aprovar' && task.status === 'CONCLUIDA' && (actor.role === 'ADMIN' || task.revisorId === actor.id || task.autorId === actor.id)) return;
        assertPermission(task, actor, action);
        const role = action === 'iniciar' || action === 'corrigir' ? 'doing' : action === 'entregar' ? 'review' : action === 'aprovar' ? 'done' : null;
        if (role) {
          target = columns.find(c => c.papel === role);
          if (!target) throw new BadRequestException('O quadro precisa de uma coluna com a função ' + role + '.');
        }
        if (action === 'iniciar') {
          const previous = await tx.tarefaSessao.findMany({ where: { usuarioId: task.responsavelId!, fim: null } });
          for (const old of previous) {
            await this.closeSessions(tx, old.tarefaId, now);
            await tx.tarefa.update({ where: { id: old.tarefaId }, data: { versao: { increment: 1 } } });
            await this.event(tx, old.tarefaId, actor, 'pausou automaticamente o cronômetro ao iniciar outra demanda.');
          }
          await tx.tarefaSessao.create({ data: { tarefaId: id, usuarioId: task.responsavelId!, autorId: actor.id, inicio: now } });
          data.status = 'EM_ANDAMENTO'; data.dataInicio = task.dataInicio || now;
          message = 'iniciou o cronômetro.';
        } else {
          await this.closeSessions(tx, id, now);
          if (action === 'pausar') message = 'pausou o cronômetro.';
          if (action === 'entregar') { data.status = 'EM_REVISAO'; data.entregueEm = now; message = 'entregou a demanda para aprovação interna.'; }
          if (action === 'aprovar') { data.status = 'CONCLUIDA'; data.dataConclusao = now; data.aprovadoEm = now; data.aprovadoPorId = actor.id; message = 'aprovou a entrega e concluiu a demanda.'; }
          if (action === 'corrigir') {
            if (!dto.motivo?.trim()) throw new BadRequestException('Informe o motivo da correção.');
            data.status = 'EM_ANDAMENTO';
            message = 'solicitou correção: ' + dto.motivo.trim();
          }
        }
      }
      if (target && (target.id !== task.colunaId || requested === 'mover')) await this.position(tx, task, target.id, dto);
      await tx.tarefa.update({ where: { id }, data });
      if (data.status) await this.synchronize(tx, task, data.status, now, actor);
      if (message) await this.event(tx, id, actor, message);
    }, { timeout: 30000 });
    return this.getTask(id, actor);
  }

  async updateTask(id: string, dto: any, actor: SyncActor) {
    // Legacy status changes use exactly the same transition commands.
    const existing = await this.prisma.tarefa.findUnique({ where: { id }, include });
    if (!existing) throw new NotFoundException('Tarefa não encontrada.');
    assertPermission(existing, actor, 'visualizar');
    if (dto.status && dto.status !== existing.status) {
      const changed = Object.keys(dto).filter(k => k !== 'status' && k !== 'versao' && dto[k] !== undefined && JSON.stringify(dto[k]) !== JSON.stringify((existing as any)[k]));
      if (changed.length) throw new BadRequestException('Salve os campos e altere a etapa em ações separadas.');
      const col = await this.legacyDestination(id, dto.status, actor, dto.versao);
      if (!col) throw new BadRequestException('Use uma etapa persistida do quadro.');
      return this.command(id, 'mover', { colunaId: col.id, versao: dto.versao }, actor);
    }
    await this.prisma.$transaction(async tx => {
      const task = await this.lockedTask(tx, id);
      this.checkVersion(task, dto.versao);
      const changedFields = Object.keys(dto).filter(key => key !== 'versao' && dto[key] !== undefined);
      const linksOnly = changedFields.length === 1 && changedFields[0] === 'linksReferencia';
      assertPermission(task, actor, linksOnly ? 'comentar' : 'editar');
      const prazoAtual = task.prazo?.getTime() ?? null;
      const novoPrazo = dto.prazo ? new Date(dto.prazo).getTime() : null;
      const prazoAlterado = dto.prazo !== undefined && novoPrazo !== prazoAtual;
      if (prazoAlterado && actor.role !== 'ADMIN') throw new ForbiddenException('Apenas administradores podem alterar o prazo da tarefa.');
      if ((dto.quadroId && dto.quadroId !== task.quadroId) || (dto.colunaId && dto.colunaId !== task.colunaId)) throw new BadRequestException('Use a ação de movimentação do Kanban.');
      if (dto.dataConclusao !== undefined && dto.dataConclusao !== task.dataConclusao?.toISOString()) throw new BadRequestException('A data de conclusão é registrada pela aprovação.');
      if (dto.ordem !== undefined && dto.ordem !== task.ordem) throw new BadRequestException('Use a ação de reordenar do Kanban.');
      if (task.sessoes.length && ((dto.responsavelId !== undefined && dto.responsavelId !== task.responsavelId) || (dto.horasGastas !== undefined && dto.horasGastas !== task.horasGastas))) throw new BadRequestException('Pause o cronômetro antes de alterar o executor ou tempo.');
      await this.validatePeople(tx, [dto.responsavelId, dto.revisorId]);
      const data: any = { versao: { increment: 1 } };
      for (const key of ['titulo', 'descricao', 'clienteNome', 'fonte', 'subtitulo', 'linksReferencia', 'prioridade', 'horasEstimadas', 'tags', 'responsavelId', 'revisorId', 'clienteId', 'projetoId', 'servicoId']) if (dto[key] !== undefined) data[key] = dto[key];
      if (data.titulo !== undefined) data.titulo = this.name(data.titulo);
      if (dto.linksReferencia !== undefined) data.linksReferencia = await this.referenceLinks(tx, task, dto.linksReferencia, actor);
      if (dto.horasGastas !== undefined && dto.horasGastas !== task.horasGastas) {
        if (actor.role !== 'ADMIN') throw new ForbiddenException('Somente administradores podem ajustar o tempo acumulado.');
        data.horasGastas = Math.max(0, dto.horasGastas || 0);
        await this.event(tx, id, actor, 'ajustou o tempo acumulado para ' + data.horasGastas + ' horas.');
      }
      for (const key of ['prazo', 'dataInicio']) if (dto[key] !== undefined) data[key] = dto[key] ? new Date(dto[key]) : null;
      if (prazoAlterado) await this.event(tx, id, actor, dto.prazo ? 'alterou o prazo para ' + new Date(dto.prazo).toISOString() + '.' : 'removeu o prazo.');
      if (dto.responsavelId !== undefined && dto.responsavelId !== task.responsavelId) await this.event(tx, id, actor, 'alterou o executor da demanda.');
      if (dto.revisorId !== undefined && dto.revisorId !== task.revisorId) await this.event(tx, id, actor, 'alterou o responsável pela revisão.');
      await tx.tarefa.update({ where: { id }, data });
    });
    return this.getTask(id, actor);
  }

  async removeTask(id: string, actor: SyncActor) {
    return this.prisma.$transaction(async tx => {
      const task = await this.lockedTask(tx, id);
      assertPermission(task, actor, 'excluir');
      return tx.tarefa.delete({ where: { id } });
    });
  }

  async checklist(tarefaId: string | undefined, itemId: string | undefined, dto: any, action: 'add' | 'update' | 'delete', actor: SyncActor) {
    return this.prisma.$transaction(async tx => {
      const item = itemId ? await tx.tarefaChecklist.findUnique({ where: { id: itemId } }) : null;
      if (itemId && !item) throw new NotFoundException('Item de checklist não encontrado.');
      const task = await this.lockedTask(tx, tarefaId || item!.tarefaId);
      if (action !== 'update' || dto.titulo !== undefined || dto.ordem !== undefined) assertPermission(task, actor, 'editarChecklist');
      if (dto.concluido !== undefined) assertPermission(task, actor, 'marcarChecklist');
      await tx.tarefa.update({ where: { id: task.id }, data: { versao: { increment: 1 } } });
      if (action === 'add') return tx.tarefaChecklist.create({ data: { tarefaId: task.id, titulo: this.name(dto.titulo), ordem: dto.ordem ?? task.checklist.length } });
      if (action === 'delete') return tx.tarefaChecklist.delete({ where: { id: itemId } });
      return tx.tarefaChecklist.update({ where: { id: itemId }, data: dto });
    });
  }

  async comment(id: string, texto: string, actor: SyncActor, attachment: { anexoTipo?: string; anexoTamanho?: number; audioDuracao?: number } = {}) {
    const task = await this.prisma.tarefa.findUnique({ where: { id }, include });
    if (!task) throw new NotFoundException('Tarefa não encontrada.');
    assertPermission(task, actor, 'comentar');
    return this.prisma.tarefaComentario.create({ data: { tarefaId: id, autorId: actor.id, texto: this.name(texto), sistema: false, ...attachment }, include: { autor: { select: userSelect } } });
  }

  async removeAttachment(id: string, comentarioId: string, actor: SyncActor) {
    await this.prisma.$transaction(async tx => {
      const task = await this.lockedTask(tx, id);
      assertPermission(task, actor, 'visualizar');
      const attachment = await tx.tarefaComentario.findUnique({ where: { id: comentarioId } });
      if (!attachment || attachment.tarefaId !== id) throw new NotFoundException('Anexo não encontrado nesta tarefa.');
      // Legacy uploads use this exact comment format. Regular discussion and
      // audit messages cannot be removed through this route.
      if (attachment.sistema || !/^📎 Anexo: \[[^\r\n]*\]\(https?:\/\/[^\s]+\)$/.test(attachment.texto)) {
        throw new BadRequestException('O registro informado não é um anexo.');
      }
      const allowed = actor.role === 'ADMIN' || task.autorId === actor.id || task.revisorId === actor.id ||
        task.responsavelId === actor.id || attachment.autorId === actor.id;
      if (!allowed) throw new ForbiddenException('Você não tem permissão para remover este anexo.');
      await tx.tarefaComentario.delete({ where: { id: comentarioId } });
      await tx.tarefa.update({ where: { id }, data: { versao: { increment: 1 } } });
      await this.event(tx, id, actor, 'removeu o vínculo de um anexo da tarefa.');
      // Keep the S3 object because another record may reference it.
    });
    return this.getTask(id, actor);
  }

  async observers(id: string, ids: string[], actor: SyncActor) {
    await this.prisma.$transaction(async tx => {
      const task = await this.lockedTask(tx, id);
      assertPermission(task, actor, 'editar');
      await this.validatePeople(tx, ids);
      await tx.tarefa.update({ where: { id }, data: { observadores: { set: ids.map(id => ({ id })) }, versao: { increment: 1 } } });
    });
    return this.getTask(id, actor);
  }
}
