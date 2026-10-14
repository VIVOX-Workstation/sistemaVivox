import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { VivoxGP } from '../../pages/VivoxGP';
import { KanbanPage } from './KanbanPage';

export function VvoxSync() {
  const { workspaceId, tarefaId } = useParams<{ workspaceId?: string; tarefaId?: string }>();
  const [params] = useSearchParams();
  const location = useLocation();
  const view = params.get('visao');
  const serviceView = workspaceId?.toLowerCase() === 'all' || params.has('clienteId') || params.has('servicoId');
  if (serviceView || view === 'lista' || view === 'prazos') return <VivoxGP />;
  // Endereço novo do Kanban: /vvoxsync/nome-do-quadro. Links antigos de /gp chegam aqui e são levados para ele.
  if (!workspaceId && /^\/gp\/?$|^\/gp\/tarefa\//.test(location.pathname)) {
    const query = new URLSearchParams();
    const quadro = params.get('quadro');
    if (quadro) query.set('quadro', quadro === 'diario' ? 'vivox-sync-diario' : quadro);
    if (tarefaId) query.set('tarefa', tarefaId);
    const qs = query.toString();
    return <Navigate to={'/vvoxsync' + (qs ? '?' + qs : '')} replace />;
  }
  return <KanbanPage />;
}
