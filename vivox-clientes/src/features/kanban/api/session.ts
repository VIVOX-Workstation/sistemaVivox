import { getApiBaseUrl } from '../../../api/client';
import type { KanbanLocation, KanbanMessage, KanbanSession, KanbanUser } from '../types';

const GOTO_ALLOWED = ['/', '/configuracoes'];

export function createKanbanSession(user: KanbanUser, token: string, location: KanbanLocation): KanbanSession {
  return { type: 'vvox-sync:init', apiUrl: getApiBaseUrl(), token, user, ...location };
}

export function parseKanbanMessage(value: unknown): KanbanMessage | null {
  if (!value || typeof value !== 'object' || !('type' in value)) return null;
  if (value.type === 'vvox-sync:ready' || value.type === 'vvox-sync:exit' || value.type === 'vvox-sync:unauthorized') return { type: value.type };
  if (value.type === 'vvox-sync:goto') {
    const path = 'path' in value && typeof value.path === 'string' ? value.path : '';
    // Só rotas internas conhecidas: o iframe nunca escolhe um endereço qualquer.
    return GOTO_ALLOWED.includes(path) ? { type: 'vvox-sync:goto', path } : null;
  }
  if (value.type !== 'vvox-sync:navigate' || !('boardId' in value) || typeof value.boardId !== 'string' || !value.boardId.trim()) return null;
  if ('taskId' in value && value.taskId != null && typeof value.taskId !== 'string') return null;
  return {
    type: 'vvox-sync:navigate',
    boardId: value.boardId,
    slug: 'slug' in value && typeof value.slug === 'string' && /^[a-z0-9-]{1,60}$/.test(value.slug) ? value.slug : undefined,
    taskId: 'taskId' in value && typeof value.taskId === 'string' ? value.taskId : undefined,
  };
}
