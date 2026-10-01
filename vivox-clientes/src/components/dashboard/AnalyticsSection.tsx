import { useNavigate } from 'react-router-dom';
import { BarChart2 } from 'lucide-react';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import type { DashboardData } from '../../types/dashboard';
import { Section, Panel, EmptyChart, CHART_COLORS, CHART_HEIGHT, formatDiaMes, nf } from './DashboardShared';

function Cobertura({ label, valor, total }: { label: string; valor: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((valor / total) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#1E1A16]">{label}</span>
        <span className="text-[#5E574C]">
          {valor} de {total} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#EDE7DD] overflow-hidden">
        <div className="h-full rounded-full bg-[#C7A15F]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AnalyticsSection({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const a = data.analytics;
  const serie = a.serieAlcance;
  const top = a.topClientesAlcance;
  const ativos = data.clientes.ativos;

  return (
    <Section
      title="Vivox Analytics"
      icon={<BarChart2 className="w-4 h-4" />}
      actionLabel="Abrir Analytics"
      onAction={() => navigate('/analytics')}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="pw-glass-card p-3">
          <p className="text-[11.5px] font-semibold text-[#5E574C]">Alcance (30 dias)</p>
          <p className="text-xl font-bold text-[#1E1A16]">{nf.format(a.alcance30d)}</p>
        </div>
        <div className="pw-glass-card p-3">
          <p className="text-[11.5px] font-semibold text-[#5E574C]">Engajamento (30 dias)</p>
          <p className="text-xl font-bold text-[#1E1A16]">{nf.format(a.engajamento30d)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Alcance e engajamento (30 dias)" className="lg:col-span-2">
          {serie.length > 0 ? (
            <LineChart
              height={CHART_HEIGHT}
              xAxis={[{ scaleType: 'point', data: serie.map((s) => formatDiaMes(s.data)) }]}
              series={[
                { data: serie.map((s) => s.alcance), label: 'Alcance', color: CHART_COLORS.gold, showMark: false },
                {
                  data: serie.map((s) => s.engajamento),
                  label: 'Engajamento',
                  color: CHART_COLORS.brown,
                  showMark: false,
                },
              ]}
              margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
            />
          ) : (
            <EmptyChart message="Ainda não há snapshots de analytics nos últimos 30 dias." />
          )}
        </Panel>

        <Panel title="Cobertura de integrações">
          {ativos > 0 ? (
            <div className="space-y-4 pt-2">
              <Cobertura label="Google Analytics 4" valor={a.clientesComGa4} total={ativos} />
              <Cobertura label="Instagram" valor={a.clientesComInstagram} total={ativos} />
              <Cobertura label="OpenPanel" valor={a.clientesComOpenpanel} total={ativos} />
              <p className="text-[11.5px] text-[#8F8271]">Considera apenas clientes ativos.</p>
            </div>
          ) : (
            <EmptyChart message="Nenhum cliente ativo." />
          )}
        </Panel>
      </div>

      <Panel title="Top 5 clientes por alcance (30 dias)">
        {top.length > 0 ? (
          <div>
            <BarChart
              layout="horizontal"
              height={Math.max(160, top.length * 44 + 30)}
              yAxis={[{ scaleType: 'band', data: top.map((c) => c.nomeFantasia), width: 130 }]}
              series={[{ data: top.map((c) => c.alcance), color: CHART_COLORS.gold, label: 'Alcance' }]}
              hideLegend
              margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
            />
            <div className="flex flex-wrap gap-2 pt-2">
              {top.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/analytics/${c.id}`)}
                  className="pw-glass-pill px-2.5 py-1 text-[11.5px] font-semibold text-[#1E1A16] cursor-pointer"
                >
                  {c.nomeFantasia}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <EmptyChart message="Sem dados de alcance por cliente nos últimos 30 dias." />
        )}
      </Panel>
    </Section>
  );
}
