export interface KanbanUser {
  id: string;
  nome: string;
  email: string;
  role: string;
  modulos?: string[];
}

export interface KanbanLocation {
  workspaceId?: string;
  boardId?: string;
  /** Nome do quadro na URL, sem acento nem espaço (ex.: operacaodiaria). */
  boardSlug?: string;
  taskId?: string;
}

export interface KanbanSession extends KanbanLocation {
  type: 'vvox-sync:init';
  apiUrl: string;
  token: string;
  user: KanbanUser;
}

export type KanbanMessage =
  | { type: 'vvox-sync:ready' }
  | { type: 'vvox-sync:exit' }
  | { type: 'vvox-sync:unauthorized' }
  | { type: 'vvox-sync:navigate'; boardId: string; slug?: string; taskId?: string }
  | { type: 'vvox-sync:goto'; path: string };
