import { getApiBaseUrl } from '../../../api/client';
import type { KanbanLocation, KanbanMessage, KanbanSession, KanbanUser } from '../types';

export function createKanbanSession(user: KanbanUser, token: string, location: KanbanLocation): KanbanSession {
  return { type: 'vvox-sync:init', apiUrl: getApiBaseUrl(), token, user, ...location };
}

export function parseKanbanMessage(value: unknown): KanbanMessage | null {
  if (!value || typeof value !== 'object' || !('type' in value)) return null;
  if (value.type === 'vvox-sync:ready' || value.type === 'vvox-sync:exit' || value.type === 'vvox-sync:unauthorized') return { type: value.type };
  if (value.type !== 'vvox-sync:navigate' || !('boardId' in value) || typeof value.boardId !== 'string' || !value.boardId.trim()) return null;
  if ('taskId' in value && value.taskId != null && typeof value.taskId !== 'string') return null;
  return {
    type: 'vvox-sync:navigate',
    boardId: value.boardId,
    taskId: 'taskId' in value && typeof value.taskId === 'string' ? value.taskId : undefined,
  };
}
