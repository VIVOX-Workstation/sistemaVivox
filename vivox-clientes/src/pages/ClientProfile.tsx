import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, BarChart2 } from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

import { OverviewTab } from '../components/ClientTabs/OverviewTab';
import { HostingTab } from '../components/ClientTabs/HostingTab';
import { NotesTab } from '../components/ClientTabs/NotesTab';
import { MarketTab } from '../components/ClientTabs/MarketTab';
import { ServicesTab } from '../components/ClientTabs/ServicesTab';
import { AiContentStudioTab } from '../components/ClientTabs/AiContentStudioTab';

type Tab = 'overview' | 'ai-studio' | 'hosting' | 'market' | 'productions' | 'media' | 'notes' | 'services';

export function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (id) {
      loadCliente(id);
    }
  }, [id]);

  const loadCliente = async (clienteId: string) => {
    try {
      const response = await api.get(`/clientes/${clienteId}`);
      setCliente(response.data);
    } catch (error) {
      console.error("Erro ao carregar cliente", error);
    }
  };

  if (!cliente) {
    return <div className="py-20 text-center text-[#625746]">Carregando cadastro do cliente...</div>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'ai-studio', label: '✨ Estúdio de Criação (IA)' },
    { id: 'hosting', label: 'Landing Pages & Domínio' },
    { id: 'market', label: 'Mercado (IA)' },
    { id: 'services', label: 'Mapa de Serviços' },
    { id: 'productions', label: 'Produções' },
    { id: 'media', label: 'Mídias' },
    { id: 'notes', label: 'Anotações' },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* CABEÇALHO AMPLO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFDF8] p-6 rounded-[11px] border border-[#D8CBB8] shadow-xs">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/clientes')}
            className="px-2.5 h-10 border border-[#D8CBB8] hover:bg-[#EEE7DC] rounded-lg shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#1E1A16]" />
          </Button>

          <div className="w-14 h-14 bg-[#FAF2E4] border border-[#E8D4B4] rounded-[11px] flex items-center justify-center text-[#8A6828] font-bold text-2xl shrink-0 shadow-2xs">
            {cliente.logoUrl ? (
              <img src={cliente.logoUrl} alt={cliente.nomeFantasia} className="w-full h-full object-cover rounded-[11px]" />
            ) : (
              cliente.nomeFantasia.charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight mb-0.5">
                {cliente.nomeFantasia}
              </h1>
              <Badge
                variant={
                  cliente.status === 'ATIVO'
                    ? 'success'
                    : cliente.status === 'PAUSADO'
                    ? 'warning'
                    : cliente.status === 'PROSPECT'
                    ? 'info'
                    : 'danger'
                }
                className="capitalize text-xs px-2.5 py-0.5"
              >
                {cliente.status.toLowerCase()}
              </Badge>
            </div>
            <p className="text-xs text-[#625746] flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#847663]" />
                {cliente.segmento}
              </span>
              <span>•</span>
              <span>Responsável: {cliente.responsavel?.nome || 'Nenhum'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('ai-studio')}
            className="px-3.5 py-2 rounded-lg bg-[#24201A] hover:bg-[#2F2922] border border-[#4A4032] text-[#C7A15F] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>✨ Criar Conteúdo (IA)</span>
          </button>
          <button
            onClick={() => navigate(`/analytics/${cliente.id}`)}
            className="px-3.5 py-2 rounded-lg bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <BarChart2 className="w-4 h-4" />
            Ver Métricas
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS ABERTA E ELEGANTE */}
      <div className="flex border-b border-[#D8CBB8] gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all relative ${
              activeTab === tab.id
                ? 'text-[#8A6828] border-b-2 border-[#B89455] bg-transparent'
                : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#EEE7DC]/50 rounded-t-lg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTEÚDO EM LARGURA TOTAL COM SCROLL NATURAL */}
      <div className="w-full pt-2">
        {activeTab === 'overview' && <OverviewTab cliente={cliente} onChange={loadCliente} />}
        {activeTab === 'ai-studio' && <AiContentStudioTab cliente={cliente} />}
        {activeTab === 'hosting' && <HostingTab cliente={cliente} />}
        {activeTab === 'market' && <MarketTab clienteId={cliente.id} />}
        {activeTab === 'services' && <ServicesTab cliente={cliente} />}
        {activeTab === 'notes' && <NotesTab cliente={cliente} onChange={loadCliente} />}
        {activeTab === 'productions' && <div className="py-12 text-center text-[#847663] text-xs bg-[#FFFDF8] rounded-[11px] border border-[#D8CBB8]">Módulo de produções em desenvolvimento.</div>}
        {activeTab === 'media' && <div className="py-12 text-center text-[#847663] text-xs bg-[#FFFDF8] rounded-[11px] border border-[#D8CBB8]">Módulo de mídias em desenvolvimento.</div>}
      </div>
    </div>
  );
}
