import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { createKanbanSession, parseKanbanMessage } from '../api/session';
import type { KanbanLocation, KanbanUser } from '../types';

export function useKanbanFrame(user: KanbanUser, token: string, target: KanbanLocation) {
  const frame = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const location = useLocation();
  const { workspaceId, boardId, boardSlug, taskId } = target;
  const origin = window.location.origin;

  const sendSession = useCallback(() => {
    frame.current?.contentWindow?.postMessage(
      createKanbanSession(user, token, { workspaceId, boardId, boardSlug, taskId }), origin,
    );
  }, [user, token, workspaceId, boardId, boardSlug, taskId, origin]);

  useEffect(() => {
    function receive(event: MessageEvent<unknown>) {
      if (event.origin !== origin || event.source !== frame.current?.contentWindow) return;
      const message = parseKanbanMessage(event.data);
      if (!message) return;
      if (message.type === 'vvox-sync:ready') { sendSession(); return; }
      if (message.type === 'vvox-sync:unauthorized') { signOut(); navigate('/login', { replace: true }); return; }
      if (message.type === 'vvox-sync:exit') { navigate('/'); return; }
      if (message.type === 'vvox-sync:goto') { navigate(message.path); return; }
      // Endereço do Kanban: /vvoxsync/nome-do-quadro (e /tarefa/ID quando há uma tarefa aberta).
      // Dentro de um workspace antigo continua /gp/workspace/ID com o quadro na query.
      let next: string;
      if (workspaceId) {
        const query = new URLSearchParams(location.search);
        query.set('quadro', message.boardId);
        query.delete('visao');
        next = '/gp/workspace/' + encodeURIComponent(workspaceId) + (message.taskId ? '/tarefa/' + encodeURIComponent(message.taskId) : '') + '?' + query.toString();
      } else {
        const slug = message.slug || 'quadro';
        next = '/vvoxsync/' + encodeURIComponent(slug) + (message.taskId ? '/tarefa/' + encodeURIComponent(message.taskId) : '');
      }
      if (next !== location.pathname + location.search) navigate(next, { replace: true });
    }
    window.addEventListener('message', receive);
    sendSession();
    return () => window.removeEventListener('message', receive);
  }, [origin, sendSession, navigate, signOut, workspaceId, location.pathname, location.search]);

  // The original renderer owns its document. A changed credential must create a fresh session.
  const previousToken = useRef(token);
  useEffect(() => {
    if (previousToken.current !== token && frame.current) {
      previousToken.current = token;
      frame.current.src = frame.current.src;
    }
  }, [token]);

  return { frame, sendSession };
}
