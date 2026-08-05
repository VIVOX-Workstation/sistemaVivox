import React, { useEffect, useState } from 'react';
import type { Cliente } from '../../types';
import { api } from '../../api/client';
import { TrendingUp, Star, MessageSquare, BarChart3, Edit3, Calendar, Trophy } from 'lucide-react';
import { Badge } from '../Badge';

interface Props {
  cliente: Cliente;
}

export function AnalyticsTab({ cliente }: Props) {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [oportunidades, setOportunidades] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [cliente.id]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/analytics/resultados/${cliente.id}`);
      setSnapshot(response.data.snapshot);
      setOportunidades(response.data.oportunidades);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Carregando dados de analytics...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* RESULTADOS (Snapshot) */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Resultados do Período</h3>
        </div>

        {snapshot ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Alcance Total</p>
              <div className="flex items-end gap-2">
                <h4 className="text-2xl font-bold text-slate-900">{snapshot.alcanceTotal?.toLocaleString('pt-BR')}</h4>
                <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Engajamento Total</p>
              <div className="flex items-end gap-2">
                <h4 className="text-2xl font-bold text-slate-900">{snapshot.engajamentoTotal?.toLocaleString('pt-BR')}</h4>
                <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Nota Google (GMB)</p>
              <div className="flex items-end gap-2">
                <h4 className="text-2xl font-bold text-slate-900">{snapshot.notaGmb?.toFixed(1) || '-'}</h4>
                <Star className="w-5 h-5 text-amber-400 mb-1 fill-current" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Novas Avaliações</p>
              <div className="flex items-end gap-2">
                <h4 className="text-2xl font-bold text-slate-900">+{snapshot.avaliacoesGmbPeriodo || 0}</h4>
                <MessageSquare className="w-4 h-4 text-blue-500 mb-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <BarChart3 className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Nenhum snapshot de analytics registrado para este cliente ainda.</p>
            <p className="text-sm text-slate-500 mt-1">Os dados serão preenchidos automaticamente quando houver sincronização com Reportei/Google.</p>
          </div>
        )}
      </div>

      {/* ANÁLISE QUALITATIVA E MELHORES ENGAJAMENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-8 border-t border-slate-100">
        
        {/* Análise Qualitativa */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Edit3 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Análise Qualitativa</h3>
          </div>
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 h-full">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Padrão Visual & Identidade</label>
                <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  O cliente tem mantido uma consistência de paleta, mas as fontes das artes poderiam ter mais peso. A leitura no mobile está levemente prejudicada.
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">O que deu mais certo?</label>
                <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  Vídeos curtos estilo "Bastidores" e "Dicas Rápidas" superaram as artes estáticas em 300% de alcance orgânico.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Posts */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Melhores Engajamentos</h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 text-sm">Post Destacado #{item}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Formato: Reels • Tema: Dicas de mercado</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600 flex items-center gap-1 justify-end">
                    <TrendingUp className="w-3 h-3" />
                    +45%
                  </div>
                  <div className="text-xs text-slate-400">Interações</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* AGENDAMENTO DE REUNIÃO */}
      <div className="pt-8 border-t border-slate-100">
        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-950">Apresentação de Resultados</h3>
              <p className="text-sm text-indigo-800/70 mt-1">
                Com base nos dados analisados, agende uma reunião estratégica para apresentar o relatório e fechar novos serviços.
              </p>
            </div>
          </div>
          <button className="whitespace-nowrap px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors w-full md:w-auto text-center">
            Agendar Reunião
          </button>
        </div>
      </div>
    </div>
  );
}
