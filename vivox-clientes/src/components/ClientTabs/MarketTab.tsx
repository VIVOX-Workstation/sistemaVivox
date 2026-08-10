import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Brain, Globe, ExternalLink, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '../Button';

interface Tendencia {
  titulo: string;
  descricao: string;
  impacto: string;
}

interface Fonte {
  title: string;
  url: string;
}

interface InteligenciaMercado {
  id: string;
  resumo: string;
  tendencias: Tendencia[];
  fontes: Fonte[];
  data: string;
}

export function MarketTab({ clienteId }: { clienteId: string }) {
  const [dados, setDados] = useState<InteligenciaMercado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await api.get(`/ia/mercado/${clienteId}`);
        setDados(response.data);
      } catch (err) {
        console.error('Erro ao buscar dados de mercado:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [clienteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin mr-3">
          <Brain className="w-6 h-6 text-indigo-500" />
        </div>
        Buscando inteligência de mercado...
      </div>
    );
  }

  if (dados.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center mt-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
          <Globe className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma pesquisa recente</h3>
        <p className="text-slate-500 max-w-sm mx-auto mb-6">
          O Agente de IA ainda não processou as tendências semanais para o nicho deste cliente.
        </p>
        <Button variant="outline" className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
          <Brain className="w-4 h-4" />
          Forçar Pesquisa Agora
        </Button>
      </div>
    );
  }

  const ultimaPesquisa = dados[0];

  return (
    <div className="space-y-8 mt-6">
      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Brain className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Inteligência de Mercado</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Atualizado em {new Date(ultimaPesquisa.data).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <p className="text-slate-700 leading-relaxed text-lg bg-white/60 p-4 rounded-lg backdrop-blur-sm border border-white/40 mb-6">
            {ultimaPesquisa.resumo}
          </p>

          <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            Principais Tendências
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {ultimaPesquisa.tendencias.map((t, idx) => (
              <div key={idx} className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <h5 className="font-bold text-slate-900 mb-2">{t.titulo}</h5>
                <p className="text-sm text-slate-600 mb-4">{t.descricao}</p>
                <div className="bg-indigo-50 rounded-md p-3">
                  <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider block mb-1">Impacto na Estratégia</span>
                  <span className="text-sm text-indigo-800">{t.impacto}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="font-medium text-slate-700 mb-3 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              Fontes Analisadas pela IA
            </h4>
            <div className="flex flex-wrap gap-2">
              {ultimaPesquisa.fontes.map((f, idx) => (
                <a 
                  key={idx} 
                  href={f.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:text-indigo-600 rounded-full px-3 py-1.5 transition-colors"
                >
                  {f.title.substring(0, 40)}{f.title.length > 40 ? '...' : ''}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
