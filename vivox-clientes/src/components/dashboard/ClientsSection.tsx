import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import type { DashboardData } from '../../types/dashboard';
import { Badge } from '../Badge';
import { Section, Panel, EmptyChart, EmptyList, CHART_COLORS, CHART_HEIGHT, formatMes, humanize } from './DashboardShared';

export function ClientsSection({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const { clientes, servicos, ultimosClientes } = data;
  const meses = clientes.novosPorMes;
  const temMeses = meses.some((m) => m.total > 0);
  const statusData = [
    { id: 'ativos', label: 'Ativos', value: clientes.ativos, color: CHART_COLORS.gold },
    { id: 'prospects', label: 'Prospects', value: clientes.prospects, color: CHART_COLORS.goldLight },
    { id: 'pausados', label: 'Pausados', value: clientes.pausados, color: CHART_COLORS.taupe },
  ].filter((d) => d.value > 0);
  const tipos = servicos.porTipo;

  return (
    <Section
      title="Vivox Clientes"
      icon={<Users className="w-4 h-4" />}
      actionLabel="Ver todos os clientes"
      onAction={() => navigate('/clientes')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Novos clientes por mês">
          {temMeses ? (
            <BarChart
              height={CHART_HEIGHT}
              xAxis={[{ scaleType: 'band', data: meses.map((m) => formatMes(m.mes)) }]}
              series={[{ data: meses.map((m) => m.total), color: CHART_COLORS.gold, label: 'Novos clientes' }]}
              hideLegend
              margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
            />
          ) : (
            <EmptyChart message="Nenhum cliente novo nos últimos 6 meses." />
          )}
        </Panel>

        <Panel title="Clientes por status">
          {statusData.length > 0 ? (
            <PieChart
              height={CHART_HEIGHT}
              series={[{ innerRadius: 50, paddingAngle: 2, cornerRadius: 4, data: statusData }]}
            />
          ) : (
            <EmptyChart message="Nenhum cliente cadastrado." />
          )}
        </Panel>

        <Panel title="Serviços ativos por tipo">
          {tipos.length > 0 ? (
            <BarChart
              layout="horizontal"
              height={CHART_HEIGHT}
              yAxis={[{ scaleType: 'band', data: tipos.map((t) => humanize(t.tipo)), width: 120 }]}
              series={[{ data: tipos.map((t) => t.total), color: CHART_COLORS.brown, label: 'Serviços' }]}
              hideLegend
              margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
            />
          ) : (
            <EmptyChart message="Nenhum serviço ativo." />
          )}
        </Panel>
      </div>

      <Panel title="Últimos clientes cadastrados">
        {ultimosClientes.length === 0 ? (
          <EmptyList message="Nenhum cliente cadastrado ainda." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {ultimosClientes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(`/cliente/${c.id}`)}
                className="pw-glass-card p-3.5 text-left flex flex-col gap-2 cursor-pointer min-w-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center text-[#8A6828] font-bold text-sm shrink-0">
                      {c.nomeFantasia.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#1E1A16] text-xs truncate">{c.nomeFantasia}</h4>
                      <p className="text-[11.5px] text-[#5E574C] truncate">{c.segmento}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      c.status?.toUpperCase() === 'ATIVO'
                        ? 'success'
                        : c.status?.toUpperCase() === 'PROSPECT'
                        ? 'warning'
                        : 'default'
                    }
                    className="text-[11px] px-2 py-0.5"
                  >
                    {c.status}
                  </Badge>
                </div>
                <div className="text-[11.5px] text-[#5E574C]">
                  {c._count.ativosHospedagem} LPs · {c._count.servicosContratados} serviços
                  {c.openpanelProjectId ? ' · OpenPanel' : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>
    </Section>
  );
}
