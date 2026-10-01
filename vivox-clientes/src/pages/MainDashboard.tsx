import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { normalizeDashboard, type DashboardData } from '../types/dashboard';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { KpiStrip } from '../components/dashboard/KpiStrip';
import { AttentionSection } from '../components/dashboard/AttentionSection';
import { GpSection } from '../components/dashboard/GpSection';
import { AnalyticsSection } from '../components/dashboard/AnalyticsSection';
import { ClientsSection } from '../components/dashboard/ClientsSection';
import './planning-workspace.css';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Carregando dashboard">
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="pw-glass-card h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="pw-glass-panel h-64" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="pw-glass-panel h-72" />
        ))}
      </div>
    </div>
  );
}

export function MainDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useAuth();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/analytics/dashboard-executivo');
      setData(normalizeDashboard(res.data));
    } catch (err) {
      console.error('Erro ao carregar Dashboard Executivo:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="planning-workspace w-full space-y-6">
      <div className="pw-lg-scene" aria-hidden="true" />
      <DashboardHeader nome={user?.nome} loading={loading} onRefresh={loadDashboard} />

      {loading && !data ? (
        <DashboardSkeleton />
      ) : error && !data ? (
        <div className="pw-glass-panel p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-6 h-6 text-[#B83B32]" />
          <p className="text-sm font-semibold text-[#1E1A16]">Não foi possível carregar o dashboard.</p>
          <button
            type="button"
            onClick={loadDashboard}
            className="pw-glass-control pw-glass-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tentar de novo
          </button>
        </div>
      ) : data ? (
        <>
          {error && (
            <p className="text-xs text-[#B83B32] px-1">Falha ao atualizar; exibindo os últimos dados carregados.</p>
          )}
          <KpiStrip data={data} />
          <AttentionSection data={data} />
          <GpSection data={data} />
          <AnalyticsSection data={data} />
          <ClientsSection data={data} />
        </>
      ) : null}
    </div>
  );
}
