import { useParams, useSearchParams } from 'react-router-dom';
import { VivoxGP } from '../../pages/VivoxGP';
import { KanbanPage } from './KanbanPage';

export function VvoxSync() {
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const [params] = useSearchParams();
  const view = params.get('visao');
  const serviceView = workspaceId?.toLowerCase() === 'all' || params.has('clienteId') || params.has('servicoId');
  if (serviceView || view === 'lista' || view === 'prazos') return <VivoxGP />;
  return <KanbanPage />;
}
