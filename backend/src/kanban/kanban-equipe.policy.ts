import { ForbiddenException } from '@nestjs/common';

/* Matriz de permissões do VVOX Sync, igual à do Quadro de Demandas.
   Administrador faz tudo; Proprietário(a) também. As demais funções seguem a matriz,
   que o administrador ajusta e fica em KanbanConfig.permissoes. */
export const FUNCOES = ['owner', 'lead', 'maker', 'viewer'] as const;
export type Funcao = (typeof FUNCOES)[number];

export const PERM_KEYS = [
  'comment', 'task_create', 'task_edit', 'task_move', 'task_delete',
  'approve', 'board_manage', 'calendar_days', 'export',
] as const;
export type PermKey = (typeof PERM_KEYS)[number];

export const PERM_DEFAULT: Record<Funcao, Partial<Record<PermKey, boolean>>> = {
  owner: { comment: true, task_create: true, task_edit: true, task_move: true, task_delete: true, approve: true, board_manage: true, calendar_days: true, export: true },
  lead: { comment: true, task_create: true, task_edit: true, task_move: true, approve: true },
  maker: { comment: true, task_create: true, task_edit: true, task_move: true },
  viewer: { comment: true },
};

export const PERM_TEXT: Record<PermKey, string> = {
  comment: 'comentar nas tarefas', task_create: 'criar tarefas', task_edit: 'editar tarefas',
  task_move: 'mover cartões', task_delete: 'excluir tarefas', approve: 'aprovar entregas',
  board_manage: 'gerenciar quadros e colunas', calendar_days: 'mudar os dias de postagem',
  export: 'exportar planilhas',
};

export type Permissoes = Partial<Record<Funcao, Partial<Record<PermKey, boolean>>>>;

export function funcaoDe(user: { role?: string; funcaoKanban?: string | null } | null | undefined): Funcao {
  const f = user?.funcaoKanban as Funcao | undefined;
  if (f && (FUNCOES as readonly string[]).includes(f)) return f;
  return user?.role === 'ADMIN' ? 'owner' : 'maker';
}

/** Mantém só funções e chaves conhecidas com valor booleano; o Proprietário(a) não é configurável. */
export function limparPermissoes(raw: unknown): Permissoes {
  const out: Permissoes = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const funcao of FUNCOES) {
    if (funcao === 'owner') continue;
    const o = (raw as any)[funcao];
    if (!o || typeof o !== 'object') continue;
    for (const key of PERM_KEYS) {
      if (typeof o[key] === 'boolean') (out[funcao] ??= {})[key] = o[key];
    }
  }
  return out;
}

export function permOn(permissoes: Permissoes, funcao: Funcao, key: PermKey): boolean {
  if (funcao === 'owner') return true;
  const o = permissoes?.[funcao];
  if (o && typeof o[key] === 'boolean') return o[key] as boolean;
  return !!PERM_DEFAULT[funcao]?.[key];
}

export function pode(user: { role?: string; funcaoKanban?: string | null } | null | undefined, permissoes: Permissoes, key: PermKey): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return permOn(permissoes, funcaoDe(user), key);
}

export function exigir(user: { role?: string; funcaoKanban?: string | null } | null | undefined, permissoes: Permissoes, key: PermKey) {
  if (!pode(user, permissoes, key)) {
    throw new ForbiddenException('Sua função no VVOX Sync não permite ' + PERM_TEXT[key] + '. Peça a um administrador.');
  }
}

const DIAS_VALIDOS = new Set([0, 1, 2, 3, 4, 5, 6]);
/** { "Nome do cliente": [2, 4] } com no máximo 300 clientes; dias 0 (domingo) a 6 (sábado). */
export function limparDiasClientes(raw: unknown): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [nome, dias] of Object.entries(raw as Record<string, unknown>).slice(0, 300)) {
    if (typeof nome !== 'string' || !nome.trim() || nome.length > 120 || !Array.isArray(dias)) continue;
    const lista = Array.from(new Set(dias.filter((d): d is number => typeof d === 'number' && DIAS_VALIDOS.has(d)))).sort();
    out[nome.trim()] = lista;
  }
  return out;
}

export function limparCargos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const c of raw) {
    if (typeof c !== 'string') continue;
    const v = c.trim();
    if (v && v.length <= 28 && !out.includes(v)) out.push(v);
    if (out.length >= 24) break;
  }
  return out;
}
