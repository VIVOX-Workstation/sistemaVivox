import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, ListTodo, AlarmClock, LifeBuoy, Server } from 'lucide-react';
import type { DashboardData } from '../../types/dashboard';
import { nf } from './DashboardShared';

interface KpiProps {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  alert?: boolean;
  onClick: () => void;
}

function Kpi({ label, value, hint, icon, alert, onClick }: KpiProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pw-glass-card p-4 text-left flex flex-col gap-1.5 cursor-pointer min-w-0 ${
        alert ? 'ring-1 ring-[#B83B32]/60' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
        <span className={`truncate ${alert ? 'text-[#B83B32]' : 'text-[#5E574C]'}`}>{label}</span>
        <span className={alert ? 'text-[#B83B32]' : 'text-[#7A6440]'}>{icon}</span>
      </div>
      <span className={`text-2xl font-bold ${alert ? 'text-[#B83B32]' : 'text-[#1E1A16]'}`}>{nf.format(value)}</span>
      <span className="text-[11.5px] text-[#5E574C] truncate">{hint}</span>
    </button>
  );
}

export function KpiStrip({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const { clientes, servicos, tarefas, chamados, landingPages } = data;
  const ic = 'w-4 h-4';
  return (
    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <Kpi
        label="Clientes ativos"
        value={clientes.ativos}
        hint={`${clientes.total} na carteira, ${clientes.prospects} prospects`}
        icon={<Users className={ic} />}
        onClick={() => navigate('/clientes')}
      />
      <Kpi
        label="Serviços ativos"
        value={servicos.ativos}
        hint={`${servicos.producoesEmAndamento} produções em andamento`}
        icon={<Briefcase className={ic} />}
        onClick={() => navigate('/clientes')}
      />
      <Kpi
        label="Tarefas abertas"
        value={tarefas.abertas}
        hint={`${tarefas.emAndamento} em andamento`}
        icon={<ListTodo className={ic} />}
        onClick={() => navigate('/gp/minhas-tarefas')}
      />
      <Kpi
        label="Tarefas atrasadas"
        value={tarefas.atrasadas}
        hint={tarefas.atrasadas > 0 ? 'Exigem ação hoje' : 'Nenhuma atrasada'}
        icon={<AlarmClock className={ic} />}
        alert={tarefas.atrasadas > 0}
        onClick={() => navigate('/gp/minhas-tarefas')}
      />
      <Kpi
        label="Chamados abertos"
        value={chamados.abertos}
        hint={chamados.slaVencidos > 0 ? `${chamados.slaVencidos} com SLA vencido` : 'SLA em dia'}
        icon={<LifeBuoy className={ic} />}
        alert={chamados.slaVencidos > 0}
        onClick={() => navigate('/gp')}
      />
      <Kpi
        label="Hospedagens críticas"
        value={landingPages.criticos7Dias}
        hint={`Vencem em até 7 dias, ${landingPages.atencao30Dias} em atenção`}
        icon={<Server className={ic} />}
        alert={landingPages.criticos7Dias > 0}
        onClick={() => navigate('/hospedagens')}
      />
    </div>
  );
}
