import type { Cliente } from '../../types';
import { ClientPerformanceDashboard } from './ClientPerformanceDashboard';

interface Props {
  cliente: Cliente;
  onClienteUpdated?: (updated: Partial<Cliente>) => void;
}

export function AnalyticsTab({ cliente, onClienteUpdated }: Props) {
  return (
    <div className="w-full">
      {/* DASHBOARD DE ACESSOS AO SITE, LANDING PAGES, GA4 & TEMPO REAL */}
      <ClientPerformanceDashboard cliente={cliente} onClienteUpdated={onClienteUpdated} />
    </div>
  );
}

