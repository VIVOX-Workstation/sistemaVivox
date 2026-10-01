import { useNavigate } from 'react-router-dom';
import { Kanban } from 'lucide-react';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import type { DashboardData } from '../../types/dashboard';
import {
  Section,
  Panel,
  EmptyChart,
  CHART_COLORS,
  CHART_HEIGHT,
  PIE_PALETTE,
  STATUS_TAREFA_LABEL,
  PRIORIDADE_LABEL,
  formatDiaMes,
  humanize,
  nf,
} from './DashboardShared';

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="pw-glass-card p-3">
      <p className="text-[11.5px] font-semibold text-[#5E574C]">{label}</p>
      <p className="text-xl font-bold text-[#1E1A16]">{value}</p>
    </div>
  );
}

export function GpSection({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const t = data.tarefas;
  const semanas = t.concluidasPorSemana;
  const temSemanas = semanas.some((s) => s.total > 0);
  const status = t.porStatus.filter((s) => s.total > 0);
  const prioridades = t.porPrioridade;
  const temPrioridade = prioridades.some((p) => p.total > 0);

  return (
    <Section
      title="Vivox GP"
      icon={<Kanban className="w-4 h-4" />}
      actionLabel="Abrir GP"
      onAction={() => navigate('/gp')}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Mini label="Vencendo nos próximos 7 dias" value={nf.format(t.vencendoSemana)} />
        <Mini label="Concluídas nesta semana" value={nf.format(t.concluidasSemana)} />
        <Mini label="Horas gastas" value={`${nf.format(Math.round(t.horasGastas * 10) / 10)} h`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Tarefas concluídas por semana (8 semanas)">
          {temSemanas ? (
            <BarChart
              height={CHART_HEIGHT}
              xAxis={[{ scaleType: 'band', data: semanas.map((s) => formatDiaMes(s.semana)) }]}
              series={[{ data: semanas.map((s) => s.total), color: CHART_COLORS.gold, label: 'Concluídas' }]}
              hideLegend
              margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
            />
          ) : (
            <EmptyChart message="Nenhuma tarefa concluída nas últimas 8 semanas." />
          )}
        </Panel>

        <Panel title="Tarefas por status">
          {status.length > 0 ? (
            <PieChart
              height={CHART_HEIGHT}
              series={[
                {
                  innerRadius: 50,
                  paddingAngle: 2,
                  cornerRadius: 4,
                  data: status.map((s, i) => ({
                    id: s.status,
                    value: s.total,
                    label: STATUS_TAREFA_LABEL[s.status] ?? humanize(s.status),
                    color: PIE_PALETTE[i % PIE_PALETTE.length],
                  })),
                },
              ]}
            />
          ) : (
            <EmptyChart message="Nenhuma tarefa cadastrada." />
          )}
        </Panel>

        <Panel title="Tarefas abertas por prioridade">
          {temPrioridade ? (
            <BarChart
              height={CHART_HEIGHT}
              xAxis={[
                {
                  scaleType: 'band',
                  data: prioridades.map((p) => PRIORIDADE_LABEL[p.prioridade] ?? humanize(p.prioridade)),
                },
              ]}
              series={[{ data: prioridades.map((p) => p.total), color: CHART_COLORS.brown, label: 'Abertas' }]}
              hideLegend
              margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
            />
          ) : (
            <EmptyChart message="Nenhuma tarefa aberta." />
          )}
        </Panel>
      </div>
    </Section>
  );
}
