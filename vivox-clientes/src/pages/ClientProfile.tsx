import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

import { OverviewTab } from '../components/ClientTabs/OverviewTab';
import { NotesTab } from '../components/ClientTabs/NotesTab';
import { MarketTab } from '../components/ClientTabs/MarketTab';
import { FloatingAssistant } from '../components/FloatingAssistant';

type Tab = 'overview' | 'productions' | 'media' | 'notes' | 'market';

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
    return <div className="p-8 text-center text-slate-500">Carregando cliente...</div>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'market', label: 'Mercado (IA)' },
    { id: 'productions', label: 'Produções' },
    { id: 'media', label: 'Mídias' },
    { id: 'notes', label: 'Anotações' },
  ];

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="px-2 shrink-0 mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 flex gap-6">
          <div className="w-20 h-20 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            {cliente.logoUrl ? (
              <img src={cliente.logoUrl} alt={cliente.nomeFantasia} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Building2 className="w-10 h-10" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                  {cliente.nomeFantasia}
                </h1>
                <p className="text-slate-500">{cliente.segmento} • Responsável: {cliente.responsavel?.nome || 'Nenhum'}</p>
              </div>
              <Badge variant={cliente.status === 'ATIVO' ? 'success' : cliente.status === 'PAUSADO' ? 'warning' : cliente.status === 'PROSPECT' ? 'info' : 'danger'} className="capitalize text-sm px-3 py-1">
                {cliente.status.toLowerCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab cliente={cliente} onChange={loadCliente} />}
          {activeTab === 'market' && <MarketTab clienteId={cliente.id} />}
          {activeTab === 'notes' && <NotesTab cliente={cliente} onChange={loadCliente} />}
          {activeTab === 'productions' && <div className="py-8 text-center text-slate-500">Módulo de produções em desenvolvimento.</div>}
          {activeTab === 'media' && <div className="py-8 text-center text-slate-500">Módulo de mídias em desenvolvimento.</div>}
        </div>
      </div>

      <FloatingAssistant clienteId={cliente.id} />
    </div>
  );
}
