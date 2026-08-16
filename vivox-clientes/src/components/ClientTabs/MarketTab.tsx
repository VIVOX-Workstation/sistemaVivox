import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Brain, Globe, ExternalLink, Calendar, TrendingUp, Sparkles, RefreshCw, Video, Layers, MessageSquare } from 'lucide-react';
import { Button } from '../Button';

interface Tendencia {
  titulo: string;
  descricao: string;
  formato?: string;
  gancho?: string;
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
  const [searching, setSearching] = useState(false);

  const loadData = async () => {
    try {
      const response = await api.get(`/ia/mercado/${clienteId}`);
      setDados(response.data);
    } catch (err) {
      console.error('Erro ao buscar dados de mercado:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clienteId]);

  const handleForcarPesquisa = async () => {
    setSearching(true);
    try {
      await api.post(`/ia/pesquisar/${clienteId}`);
      await loadData();
    } catch (err) {
      console.error('Erro ao forçar pesquisa:', err);
      alert('Erro ao buscar tendências com o Tavily. Verifique se o backend está ativo.');
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
        <div className="animate-spin text-indigo-600">
          <Brain className="w-8 h-8" />
        </div>
        <span className="text-sm font-medium">Consultando radar de tendências e mercado...</span>
      </div>
    );
  }

  if (dados.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center mt-6 shadow-sm">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-4">
          <Globe className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Radar de Tendências Pronto para Pesquisar</h3>
        <p className="text-slate-600 max-w-md mx-auto mb-6 text-sm">
          A IA conectada ao <strong>Tavily</strong> pode varrer a web em tempo real agora mesmo para encontrar o que está viralizando no nicho deste cliente.
        </p>
        <Button
          onClick={handleForcarPesquisa}
          disabled={searching}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/20"
        >
          {searching ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Pesquisando na Web com Tavily + Llama 3...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Iniciar Pesquisa de Mercado Agora
            </>
          )}
        </Button>
      </div>
    );
  }

  const ultimaPesquisa = dados[0];

  return (
    <div className="space-y-8 mt-6">
      <div className="bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40 border border-indigo-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Brain className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-600/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Radar de Mercado & Melhores Engajamentos</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Atualizado em {new Date(ultimaPesquisa.data).toLocaleDateString('pt-BR')} às {new Date(ultimaPesquisa.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <Button
              onClick={handleForcarPesquisa}
              disabled={searching}
              variant="outline"
              className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 shrink-0 self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
              {searching ? 'Varrendo a Web...' : 'Atualizar Tendências'}
            </Button>
          </div>

          <div className="bg-white/80 p-5 rounded-xl backdrop-blur-sm border border-slate-200/80 mb-8 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">Resumo Executivo do Nicho</span>
            <p className="text-slate-700 leading-relaxed text-sm">
              {ultimaPesquisa.resumo}
            </p>
          </div>

          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Ideias & Formatos com Alto Potencial de Engajamento
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {ultimaPesquisa.tendencias.map((t, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {t.formato ? (
                        <>
                          <Video className="w-3 h-3 text-indigo-500" />
                          {t.formato}
                        </>
                      ) : (
                        'Reels / Post'
                      )}
                    </span>
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      🔥 Alta Relevância
                    </span>
                  </div>

                  <h5 className="font-bold text-slate-900 text-base mb-2 leading-snug">{t.titulo}</h5>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{t.descricao}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {t.gancho && (
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-2.5">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-0.5">
                        Gancho Sugerido (Hook)
                      </span>
                      <p className="text-xs text-amber-950 italic font-medium">"{t.gancho}"</p>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Impacto Estratégico</span>
                    <span className="text-xs text-slate-700">{t.impacto}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200/80 pt-6">
            <h4 className="font-semibold text-slate-700 mb-3 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Fontes & Notícias Analisadas pelo Tavily
            </h4>
            <div className="flex flex-wrap gap-2">
              {ultimaPesquisa.fontes.map((f, idx) => (
                <a 
                  key={idx} 
                  href={f.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg px-3 py-1.5 transition-colors shadow-2xs"
                >
                  <span className="truncate max-w-[200px]">{f.title || f.url}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
