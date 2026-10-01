import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Kanban, BarChart2, Globe } from 'lucide-react';

interface Props {
  nome?: string;
  loading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ nome, loading, onRefresh }: Props) {
  const navigate = useNavigate();
  const primeiro = nome ? nome.split(' ')[0] : 'Equipe';
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const atalho = 'pw-glass-pill px-3 py-1.5 text-xs font-semibold text-[#1E1A16] flex items-center gap-1.5 cursor-pointer';

  return (
    <div className="pw-glass-panel p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <span className="pw-section-label">Dashboard geral da agência</span>
        <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight">
          {saudacao}, {primeiro}
        </h1>
        <p className="text-xs text-[#5E574C] capitalize">{dataHoje}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={() => navigate('/gp')} className={atalho}>
          <Kanban className="w-3.5 h-3.5 text-[#7A6440]" /> GP
        </button>
        <button type="button" onClick={() => navigate('/analytics')} className={atalho}>
          <BarChart2 className="w-3.5 h-3.5 text-[#7A6440]" /> Analytics
        </button>
        <button type="button" onClick={() => navigate('/hospedagens')} className={atalho}>
          <Globe className="w-3.5 h-3.5 text-[#7A6440]" /> Hospedagens
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="pw-glass-control px-3 py-2 text-xs font-semibold text-[#1E1A16] flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#7A6440] ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/cliente/novo')}
          className="pw-glass-control pw-glass-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>
    </div>
  );
}
