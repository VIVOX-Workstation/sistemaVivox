import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { SyncActor } from './kanban.policy';
import {
  FUNCOES, Funcao, PERM_KEYS, PermKey, Permissoes, exigir, funcaoDe, limparCargos, limparDiasClientes, limparPermissoes, pode,
} from './kanban-equipe.policy';

const ID = 'global';
const pessoaSelect = { id: true, nome: true, email: true, role: true, cargo: true, funcaoKanban: true, fotoUrl: true };
const IMAGEM = /^image\/(jpeg|png|webp)$/;

/* Equipe do VVOX Sync: cargo, função e foto ficam na conta (User); a matriz de permissões,
   os cargos extras e os dias de postagem por cliente ficam em KanbanConfig. */
@Injectable()
export class KanbanEquipeService {
  constructor(private readonly prisma: PrismaService, @Optional() private readonly moduleRef?: ModuleRef) {}

  /* Carregado só no envio de imagem: evita puxar o cliente S3 em quem só consulta a equipe. */
  private async enviar(file: Express.Multer.File, pasta: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { StorageService } = require('../storage/storage.service');
    const storage = this.moduleRef?.get(StorageService, { strict: false });
    if (!storage) throw new BadRequestException('Armazenamento indisponível.');
    return storage.uploadFile(file, pasta);
  }

  async config() {
    const c = await (this.prisma as any).kanbanConfig?.findUnique({ where: { id: ID } });
    return {
      permissoes: limparPermissoes(c?.permissoes),
      cargos: limparCargos(c?.cargos),
      diasClientes: limparDiasClientes(c?.diasClientes),
    };
  }

  private salvar(data: { permissoes?: Permissoes; cargos?: string[]; diasClientes?: Record<string, number[]> }) {
    return (this.prisma as any).kanbanConfig.upsert({ where: { id: ID }, create: { id: ID, ...data }, update: data });
  }

  private async usuario(id: string) {
    if (!id) return null;
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true, funcaoKanban: true } });
  }

  /** O administrador sempre pode; para as demais contas vale a função no VVOX Sync e a matriz salva. */
  async pode(actor: SyncActor, key: PermKey) {
    if (actor.role === 'ADMIN') return true;
    const [user, cfg] = await Promise.all([this.usuario(actor.id), this.config()]);
    return pode(user, cfg.permissoes, key);
  }

  async exigir(actor: SyncActor, key: PermKey) {
    if (actor.role === 'ADMIN') return;
    const [user, cfg] = await Promise.all([this.usuario(actor.id), this.config()]);
    exigir(user, cfg.permissoes, key);
  }

  private admin(actor: SyncActor) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException('Só administradores podem mudar cargos, funções e permissões da equipe.');
  }

  async equipe(actor: SyncActor) {
    const [pessoas, cfg, clientes, eu] = await Promise.all([
      this.prisma.user.findMany({ where: { role: { not: 'CLIENTE' } }, select: pessoaSelect, orderBy: { nome: 'asc' } }),
      this.config(),
      this.prisma.cliente.findMany({ select: { id: true, nomeFantasia: true, logoUrl: true }, orderBy: { nomeFantasia: 'asc' } }),
      this.usuario(actor.id),
    ]);
    const acesso: Record<string, boolean> = {};
    for (const key of PERM_KEYS) acesso[key] = actor.role === 'ADMIN' || pode(eu, cfg.permissoes, key);
    return {
      pessoas: pessoas.map(p => ({ id: p.id, nome: p.nome, email: p.email, role: p.role, cargo: p.cargo || '', funcao: funcaoDe(p), fotoUrl: p.fotoUrl || '' })),
      permissoes: cfg.permissoes,
      cargos: cfg.cargos,
      diasClientes: cfg.diasClientes,
      clientes: clientes.map(c => ({ id: c.id, nome: c.nomeFantasia, logoUrl: c.logoUrl || '' })),
      acesso,
    };
  }

  async atualizarPessoa(id: string, dto: { cargo?: string | null; funcao?: string }, actor: SyncActor) {
    this.admin(actor);
    const alvo = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!alvo || alvo.role === 'CLIENTE') throw new NotFoundException('Pessoa não encontrada na equipe.');
    const data: { cargo?: string | null; funcaoKanban?: Funcao } = {};
    if (dto.cargo !== undefined) {
      const cargo = typeof dto.cargo === 'string' ? dto.cargo.trim() : '';
      if (cargo.length > 28) throw new BadRequestException('O cargo pode ter até 28 caracteres.');
      data.cargo = cargo || null;
    }
    if (dto.funcao !== undefined) {
      if (!(FUNCOES as readonly string[]).includes(dto.funcao)) throw new BadRequestException('Função inválida.');
      data.funcaoKanban = dto.funcao as Funcao;
    }
    const p = await this.prisma.user.update({ where: { id }, data, select: pessoaSelect });
    if (data.cargo) {
      const cfg = await this.config();
      if (!cfg.cargos.includes(data.cargo)) await this.salvar({ cargos: limparCargos([...cfg.cargos, data.cargo]) });
    }
    return { id: p.id, nome: p.nome, email: p.email, role: p.role, cargo: p.cargo || '', funcao: funcaoDe(p), fotoUrl: p.fotoUrl || '' };
  }

  async salvarPermissoes(raw: unknown, actor: SyncActor) {
    this.admin(actor);
    const permissoes = limparPermissoes(raw);
    await this.salvar({ permissoes });
    return { permissoes };
  }

  async salvarCargos(raw: unknown, actor: SyncActor) {
    this.admin(actor);
    const cargos = limparCargos(raw);
    await this.salvar({ cargos });
    return { cargos };
  }

  async salvarDiasCliente(cliente: string, dias: number[] | null, actor: SyncActor) {
    await this.exigir(actor, 'calendar_days');
    const nome = typeof cliente === 'string' ? cliente.trim() : '';
    if (!nome || nome.length > 120) throw new BadRequestException('Informe o cliente.');
    const cfg = await this.config();
    const next = { ...cfg.diasClientes };
    if (dias === null) delete next[nome];
    else next[nome] = limparDiasClientes({ [nome]: dias })[nome] || [];
    const diasClientes = limparDiasClientes(next);
    await this.salvar({ diasClientes });
    return { diasClientes };
  }

  async salvarFoto(file: Express.Multer.File | undefined, actor: SyncActor) {
    if (!file) throw new BadRequestException('Nenhuma imagem enviada.');
    if (!IMAGEM.test(file.mimetype) || file.size > 2 * 1048576) throw new BadRequestException('Envie uma imagem JPG, PNG ou WebP de até 2 MB.');
    const fotoUrl = await this.enviar(file, 'usuarios/fotos');
    await this.prisma.user.update({ where: { id: actor.id }, data: { fotoUrl } });
    return { fotoUrl };
  }

  async removerFoto(actor: SyncActor) {
    await this.prisma.user.update({ where: { id: actor.id }, data: { fotoUrl: null } });
    return { fotoUrl: '' };
  }

  async salvarLogoCliente(clienteId: string, file: Express.Multer.File | undefined, actor: SyncActor) {
    await this.exigir(actor, 'task_edit');
    if (!file) throw new BadRequestException('Nenhuma imagem enviada.');
    if (!IMAGEM.test(file.mimetype) || file.size > 2 * 1048576) throw new BadRequestException('Envie uma imagem JPG, PNG ou WebP de até 2 MB.');
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado no sistema.');
    const logoUrl = await this.enviar(file, 'clientes/logos');
    await this.prisma.cliente.update({ where: { id: clienteId }, data: { logoUrl } });
    return { id: clienteId, logoUrl };
  }
}
