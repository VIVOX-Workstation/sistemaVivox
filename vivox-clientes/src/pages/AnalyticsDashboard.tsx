import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

import { ServicesTab } from '../components/ClientTabs/ServicesTab';
import { AnalyticsTab } from '../components/ClientTabs/AnalyticsTab';
import { PlanningTab } from '../components/ClientTabs/PlanningTab';

type Tab = 'services' | 'analytics' | 'planning';

export function AnalyticsDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('analytics');

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

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando dashboard...</div>;
  if (!cliente) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/analytics')} className="px-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold text-xl">
          {cliente.nomeFantasia.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{cliente.nomeFantasia}</h1>
            <Badge variant="success">Dashboard Ativo</Badge>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
            <Building2 className="w-4 h-4" />
            {cliente.segmento}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-14rem)] overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'analytics' ? 'text-indigo-600 bg-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Relatório de Resultados
            {activeTab === 'analytics' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('planning')}
            className={`px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'planning' ? 'text-indigo-600 bg-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Planejamento Estratégico
            {activeTab === 'planning' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'services' ? 'text-indigo-600 bg-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Mapa de Serviços
            {activeTab === 'services' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
            )}
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'analytics' && <AnalyticsTab cliente={cliente} />}
          {activeTab === 'services' && <ServicesTab cliente={cliente} />}
          {activeTab === 'planning' && <PlanningTab cliente={cliente} />}
        </div>
      </div>
    </div>
  );
}
