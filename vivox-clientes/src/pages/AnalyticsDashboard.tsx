import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, ExternalLink, Globe } from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

import { ServicesTab } from '../components/ClientTabs/ServicesTab';
import { AnalyticsTab } from '../components/ClientTabs/AnalyticsTab';
import { InstagramPerformanceDashboard } from '../components/ClientTabs/InstagramPerformanceDashboard';
import { PlanningTab } from '../components/ClientTabs/PlanningTab';
import { ExecutiveReportTab } from '../components/ClientTabs/ExecutiveReportTab';
import { Sparkles } from 'lucide-react';

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

type Tab = 'site_analytics' | 'instagram' | 'executive_report' | 'planning' | 'services';

export function AnalyticsDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('site_analytics');

  useEffect(() => {
    loadCliente();
  }, [id]);

  const loadCliente = async () => {
    try {
      const response = await api.get(`/clientes/${id}`);
      setCliente(response.data);
    } catch (e) {
      console.error(e);
      navigate('/analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-[#625746]">Carregando dashboard de métricas...</div>;
  if (!cliente) return null;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* CABEÇALHO AMPLO E ELEGANTE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFDF8] p-6 rounded-[11px] border border-[#D8CBB8] shadow-xs">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/analytics')}
            className="px-2.5 h-10 border border-[#D8CBB8] hover:bg-[#EEE7DC] rounded-lg shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#1E1A16]" />
          </Button>

          <div className="w-14 h-14 bg-[#FAF2E4] border border-[#E8D4B4] rounded-[11px] flex items-center justify-center text-[#8A6828] font-bold text-2xl shrink-0 shadow-2xs">
            {cliente.nomeFantasia.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight">{cliente.nomeFantasia}</h1>
              <Badge variant="success" className="text-xs px-2.5 py-0.5">
                Dashboard de Métricas Ativo
              </Badge>
            </div>
            <p className="text-xs text-[#625746] flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#847663]" />
                {cliente.segmento}
              </span>
              <span>•</span>
              <span>Responsável: {cliente.responsavel?.nome || 'Equipe Vivox'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('executive_report')}
            className="px-3.5 py-2 rounded-lg bg-[#24201A] hover:bg-[#2F2922] border border-[#4A4032] text-[#C7A15F] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-4 h-4" />
            Relatório Executivo (IA)
          </button>
          <button
            onClick={() => navigate(`/cliente/${cliente.id}`)}
            className="px-3.5 py-2 rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] hover:bg-[#EEE7DC] text-[#1E1A16] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            Ver Cadastro do Cliente
            <ExternalLink className="w-3.5 h-3.5 text-[#8A6828]" />
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS ABERTA E ESPECIALIZADA */}
      <div className="flex border-b border-[#D8CBB8] gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('site_analytics')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'site_analytics'
              ? 'text-[#8A6828] border-b-2 border-[#B89455] bg-transparent'
              : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#EEE7DC]/50 rounded-t-lg'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Acessos ao Site & Landing Pages
        </button>

        <button
          onClick={() => setActiveTab('instagram')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'instagram'
              ? 'text-[#8A6828] border-b-2 border-[#B89455] bg-transparent'
              : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#EEE7DC]/50 rounded-t-lg'
          }`}
        >
          <InstagramIcon className="w-3.5 h-3.5" />
          Instagram & Redes Sociais
        </button>

        <button
          onClick={() => setActiveTab('executive_report')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'executive_report'
              ? 'text-[#8A6828] border-b-2 border-[#B89455] bg-transparent'
              : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#EEE7DC]/50 rounded-t-lg'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C7A15F]" />
          ✨ Relatório Executivo (IA)
        </button>

        <button
          onClick={() => setActiveTab('planning')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
            activeTab === 'planning'
              ? 'text-[#8A6828] border-b-2 border-[#B89455] bg-transparent'
              : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#EEE7DC]/50 rounded-t-lg'
          }`}
        >
          Planejamento Estratégico
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
            activeTab === 'services'
              ? 'text-[#8A6828] border-b-2 border-[#B89455] bg-transparent'
              : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#EEE7DC]/50 rounded-t-lg'
          }`}
        >
          Mapa de Serviços
        </button>
      </div>

      {/* CONTEÚDO EM LARGURA TOTAL COM SCROLL NATURAL */}
      <div className="w-full pt-2">
        {activeTab === 'site_analytics' && <AnalyticsTab cliente={cliente} />}
        {activeTab === 'instagram' && <InstagramPerformanceDashboard cliente={cliente} />}
        {activeTab === 'executive_report' && <ExecutiveReportTab cliente={cliente} />}
        {activeTab === 'services' && <ServicesTab cliente={cliente} />}
        {activeTab === 'planning' && <PlanningTab cliente={cliente} />}
      </div>
    </div>
  );
}
