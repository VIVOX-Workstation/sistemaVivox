import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Globe,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Map as MapIcon,
  Target,
} from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { resolveMediaUrl } from '../utils/mediaUrl';

import { ServicesTab } from '../components/ClientTabs/ServicesTab';
import { AnalyticsTab } from '../components/ClientTabs/AnalyticsTab';
import { InstagramPerformanceDashboard } from '../components/ClientTabs/InstagramPerformanceDashboard';
import { PlanningTab } from '../components/ClientTabs/PlanningTab';
import { ExecutiveReportTab } from '../components/ClientTabs/ExecutiveReportTab';
import './planning-workspace.css';

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

type Tab = 'site_analytics' | 'instagram' | 'executive_report' | 'planning' | 'services';

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'site_analytics', label: 'Site & Landing Pages', icon: <Globe className="w-3.5 h-3.5" /> },
  { id: 'instagram', label: 'Instagram & Redes', icon: <InstagramIcon className="w-3.5 h-3.5" /> },
  { id: 'executive_report', label: 'Relatório Executivo (IA)', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'planning', label: 'Planejamento', icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'services', label: 'Mapa de Serviços', icon: <MapIcon className="w-3.5 h-3.5" /> },
];

const isTab = (v: string | null): v is Tab => TABS.some((t) => t.id === v);

function normalizeUrl(u: string) {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function DashboardSkeleton() {
  return (
    <div className="planning-workspace w-full space-y-6 animate-pulse" aria-busy="true" aria-label="Carregando dashboard de métricas">
      <div className="pw-lg-scene" aria-hidden="true" />
      <div className="pw-glass-panel h-20" />
      <div className="pw-glass-panel h-12" />
      <div className="pw-glass-card h-72" />
    </div>
  );
}

export function AnalyticsDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: Tab = isTab(tabParam) ? tabParam : 'site_analytics';
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleTabChange = (tab: Tab) => {
    setSearchParams({ tab });
  };

  const loadCliente = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get(`/clientes/${id}`);
      setCliente(response.data);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCliente();
  }, [loadCliente]);

  if (loading) return <DashboardSkeleton />;

  if (error || !cliente) {
    return (
      <div className="planning-workspace w-full space-y-6">
        <div className="pw-lg-scene" aria-hidden="true" />
        <div className="pw-glass-panel p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-6 h-6 text-[#B83B32]" />
          <p className="text-sm font-semibold text-[#1E1A16]">Não foi possível carregar este cliente.</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="pw-glass-control px-4 py-2 text-xs font-semibold text-[#1E1A16] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <button
              type="button"
              onClick={loadCliente}
              className="pw-glass-control pw-glass-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tentar de novo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ativo = String(cliente.status).toUpperCase() === 'ATIVO';
  const siteUrl = cliente.gscSiteUrl && !cliente.gscSiteUrl.startsWith('sc-domain:') ? cliente.gscSiteUrl : null;
  const igUser = cliente.instagramUsername?.replace(/^@/, '');

  return (
    <div className="planning-workspace w-full space-y-6 pb-12">
      <div className="pw-lg-scene" aria-hidden="true" />

      {/* CABEÇALHO COMPACTO */}
      <div className="pw-glass-panel px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            aria-label="Voltar para Analytics"
            className="pw-glass-control w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#1E1A16]" />
          </button>

          <div className="w-11 h-11 shrink-0 rounded-2xl bg-white/60 border border-[#E5D9C8] flex items-center justify-center overflow-hidden text-[#8A6828] font-bold text-lg">
            {cliente.logoUrl ? (
              <img src={resolveMediaUrl(cliente.logoUrl)} alt={cliente.nomeFantasia} className="w-full h-full object-cover" />
            ) : (
              cliente.nomeFantasia.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#1E1A16] tracking-tight truncate">{cliente.nomeFantasia}</h1>
              <span
                className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  ativo
                    ? 'text-[#247A4A] bg-[#EEF8F2] border-[#C9E8D5]'
                    : 'text-[#5E574C] bg-white/50 border-[#D8CBB8]'
                }`}
              >
                {ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-xs text-[#5E574C] flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#8F8271]" />
                {cliente.segmento || 'Segmento não informado'}
              </span>
              <span>•</span>
              <span>Responsável: {cliente.responsavel?.nome || 'Equipe Vivox'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {siteUrl && (
            <a
              href={normalizeUrl(siteUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="pw-glass-pill px-3 py-1.5 text-xs font-semibold text-[#1E1A16] inline-flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-[#8A6828]" /> Site
            </a>
          )}
          {igUser && (
            <a
              href={`https://instagram.com/${igUser}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pw-glass-pill px-3 py-1.5 text-xs font-semibold text-[#1E1A16] inline-flex items-center gap-1.5"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-[#8A6828]" /> @{igUser}
            </a>
          )}
          <button
            type="button"
            onClick={() => navigate(`/cliente/${cliente.id}`)}
            className="pw-glass-control px-3 py-2 text-xs font-bold text-[#1E1A16] flex items-center gap-1.5 cursor-pointer"
          >
            Ver cadastro
            <ExternalLink className="w-3.5 h-3.5 text-[#8A6828]" />
          </button>
        </div>
      </div>

      {/* ABAS */}
      <div className="pw-glass-panel p-2 flex items-center gap-2 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => handleTabChange(t.id)}
            className={`pw-glass-pill px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === t.id ? 'pw-glass-primary' : 'text-[#1E1A16]'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTEÚDO */}
      <div className="w-full min-w-0">
        {activeTab === 'site_analytics' && <AnalyticsTab cliente={cliente} />}
        {activeTab === 'instagram' && <InstagramPerformanceDashboard cliente={cliente} />}
        {activeTab === 'executive_report' && <ExecutiveReportTab cliente={cliente} />}
        {activeTab === 'services' && <ServicesTab cliente={cliente} />}
        {activeTab === 'planning' && <PlanningTab cliente={cliente} />}
      </div>
    </div>
  );
}
