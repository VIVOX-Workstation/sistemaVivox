import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useKanbanFrame } from './hooks/useKanbanFrame';
import type { KanbanLocation, KanbanUser } from './types';

function KanbanFrame({ user, token, ...target }: KanbanLocation & { user: KanbanUser; token: string }) {
  const { frame, sendSession } = useKanbanFrame(user, token, target);
  return (
    <iframe
      ref={frame}
      src="/kanban/index.html"
      title="VVOX Sync — Quadro de demandas"
      allow="clipboard-write; microphone"
      onLoad={sendSession}
      className="block min-h-0 w-full flex-1 border-0"
    />
  );
}

export function KanbanPage() {
  const { user } = useAuth();
  const { workspaceId, tarefaId } = useParams<{ workspaceId?: string; tarefaId?: string }>();
  const [params] = useSearchParams();
  const boardId = params.get('quadro') || undefined;
  const token = localStorage.getItem('@Vivox:token');
  if (!user || !token) return null;

  return <KanbanFrame
    key={user.id + ':' + (workspaceId || '')}
    user={user}
    token={token}
    workspaceId={workspaceId}
    boardId={boardId === 'diario' ? 'vivox-sync-diario' : boardId}
    taskId={tarefaId}
  />;
}
