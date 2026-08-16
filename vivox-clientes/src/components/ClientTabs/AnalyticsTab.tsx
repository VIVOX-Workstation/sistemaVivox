import { useEffect, useState } from 'react';
import type { Cliente } from '../../types';
import { api } from '../../api/client';
import { TrendingUp, Star, MessageSquare, BarChart3, Edit3, Calendar, Trophy, Sparkles } from 'lucide-react';
import { GoogleAnalyticsDashboard } from './GoogleAnalyticsDashboard';
import { ClientPerformanceDashboard } from './ClientPerformanceDashboard';

interface Props {
  cliente: Cliente;
  onClienteUpdated?: (updated: Partial<Cliente>) => void;
}

export function AnalyticsTab({ cliente, onClienteUpdated }: Props) {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [mercado, setMercado] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [cliente.id]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [resResultados, resMercado] = await Promise.all([
        api.get(`/analytics/resultados/${cliente.id}`),
        api.get(`/ia/mercado/${cliente.id}`)
      ]);
      setSnapshot(resResultados.data.snapshot);
      if (resMercado.data && resMercado.data.length > 0) {
        setMercado(resMercado.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleForcarPesquisa = async () => {
    setSearching(true);
    try {
      const res = await api.post(`/ia/pesquisar/${cliente.id}`);
      setMercado(res.data);
    } catch (e) {
      console.error('Erro ao pesquisar:', e);
      alert('Erro ao consultar Tavily. Verifique o servidor.');
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-[#625746]">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#B89455] border-r-transparent mr-2 align-middle"></div>
        Carregando dados de analytics...
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      {/* DASHBOARD COMPLETO DE PERFORMANCE & INSTAGRAM DO CLIENTE */}
      <ClientPerformanceDashboard cliente={cliente} />

      {/* GOOGLE ANALYTICS 4 & SEARCH CONSOLE DASHBOARD */}
      <div className="pt-8 border-t border-[#D8CBB8]/70">
        <GoogleAnalyticsDashboard cliente={cliente} onClienteUpdated={onClienteUpdated} />
      </div>

      {/* RESULTADOS GERAIS (Snapshots de Redes / GMB) */}
      <div className="pt-8 border-t border-[#D8CBB8]/70">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-[#B89455]" />
          <h3 className="text-base font-bold text-[#1E1A16] tracking-tight">Presença em Redes Sociais & GMB</h3>
        </div>

        {snapshot ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs">
              <p className="text-xs font-semibold text-[#847663] mb-1">Alcance Total</p>
              <div className="flex items-end gap-2">
                <h4 className="text-2xl font-bold text-[#1E1A16]">{snapshot.alcanceTotal?.toLocaleString('pt-BR')}</h4>
                <TrendingUp className="w-4 h-4 text-[#247A4A] mb-1" />
              </div>
            </div>
            <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs">
              <p className="text-xs font-semibold text-[#847663] mb-1">Engajamento Total</p>
              <div className="flex items-end gap-2">
                <h4 className="text-2xl font-bold text-[#1E1A16]">{snapshot.engajamentoTotal?.toLocaleString('pt-BR')}</h4>
                <TrendingUp className="w-4 h-4 text-[#247A4A] mb-1" />
              </div>
            </div>
            <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs">
              <p className="text-xs font-semibold text-[#847663] mb-1">Nota Google (GMB)</p>
              <div className="flex items-end gap-2">
                <h4 className="text-2xl font-bold text-[#1E1A16]">{snapshot.notaGmb?.toFixed(1) || '-'}</h4>
                <Star className="w-4 h-4 text-[#B89455] mb-1 fill-current" />
              </div>
            </div>
            <div className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs">
              <p className="text-xs font-semibold text-[#847663] mb-1">Novas Avaliações</p>
              <div className="flex items-end gap-2">
                <h4 className="text-2xl font-bold text-[#1E1A16]">+{snapshot.avaliacoesGmbPeriodo || 0}</h4>
                <MessageSquare className="w-4 h-4 text-[#3b82f6] mb-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#FAF7F2] rounded-[11px] border border-dashed border-[#D8CBB8] p-6 text-center">
            <BarChart3 className="w-8 h-8 text-[#847663] mx-auto mb-2 opacity-70" />
            <p className="text-[#1E1A16] font-medium text-xs">Nenhum snapshot de redes sociais registrado para este cliente ainda.</p>
            <p className="text-[11px] text-[#847663] mt-0.5">Os dados de redes sociais são integrados via relatórios do Instagram e Reportei.</p>
          </div>
        )}
      </div>

      {/* ANÁLISE QUALITATIVA E MELHORES ENGAJAMENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-8 border-t border-[#D8CBB8]/70">
        {/* Análise Qualitativa */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Edit3 className="w-4 h-4 text-[#B89455]" />
            <h3 className="text-sm font-bold text-[#1E1A16] tracking-tight">Análise Qualitativa</h3>
          </div>
          <div className="bg-[#FAF7F2] p-4 rounded-[11px] border border-[#D8CBB8] h-full">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#847663] uppercase tracking-wider mb-1 block">Padrão Visual & Identidade</label>
                <p className="text-xs text-[#1E1A16] bg-[#FFFDF8] p-3 rounded-lg border border-[#D8CBB8] shadow-2xs">
                  O cliente tem mantido uma consistência de paleta, mas as fontes das artes poderiam ter mais peso. A leitura no mobile está levemente prejudicada.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#847663] uppercase tracking-wider mb-1 block">O que deu mais certo?</label>
                <p className="text-xs text-[#1E1A16] bg-[#FFFDF8] p-3 rounded-lg border border-[#D8CBB8] shadow-2xs">
                  Vídeos curtos estilo "Bastidores" e "Dicas Rápidas" superaram as artes estáticas em 300% de alcance orgânico.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Posts / Melhores Engajamentos & Radar do Nicho */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#B89455]" />
              <h3 className="text-sm font-bold text-[#1E1A16] tracking-tight">Melhores Oportunidades & Engajamentos</h3>
            </div>
            <button
              onClick={handleForcarPesquisa}
              disabled={searching}
              className="text-xs font-semibold text-[#8A6828] hover:text-[#1D160B] bg-[#FAF2E4] hover:bg-[#F3E2C4] border border-[#E8D4B4] rounded-lg px-2.5 py-1 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className={`w-3.5 h-3.5 ${searching ? 'animate-spin' : ''}`} />
              {searching ? 'Pesquisando...' : 'Atualizar Radar'}
            </button>
          </div>

          {mercado && mercado.tendencias && mercado.tendencias.length > 0 ? (
            <div className="space-y-3">
              {mercado.tendencias.map((t: any, idx: number) => (
                <div key={idx} className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] transition-all flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4] text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <h4 className="font-bold text-[#1E1A16] text-xs">{t.titulo}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-[#8A6828] bg-[#FAF2E4] px-2 py-0.5 rounded-full border border-[#E8D4B4] shrink-0">
                      {t.formato || 'Reels / Post'}
                    </span>
                  </div>

                  <p className="text-xs text-[#625746] leading-relaxed pl-7">
                    {t.descricao}
                  </p>

                  {t.gancho && (
                    <div className="ml-7 bg-[#FAF6F0] border border-[#E5D9C8] rounded-lg p-2">
                      <span className="text-[9px] font-bold text-[#8A6828] uppercase tracking-wider block mb-0.5">
                        Gancho Recomendado (Hook):
                      </span>
                      <p className="text-xs text-[#1E1A16] italic font-medium">"{t.gancho}"</p>
                    </div>
                  )}

                  <div className="ml-7 flex items-center justify-between text-[11px] pt-1 border-t border-[#EEE7DC]">
                    <span className="text-[#847663]">Impacto: {t.impacto}</span>
                    <span className="font-bold text-[#247A4A] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Alta Demanda
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#FAF7F2] rounded-[11px] border border-dashed border-[#D8CBB8] p-6 text-center">
              <Trophy className="w-7 h-7 text-[#847663] mx-auto mb-2 opacity-60" />
              <p className="text-xs text-[#625746] font-medium mb-3">Nenhuma pesquisa de engajamento recente para este nicho.</p>
              <button
                onClick={handleForcarPesquisa}
                disabled={searching}
                className="px-3 py-1.5 bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] rounded-lg text-xs font-bold shadow-2xs inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {searching ? 'Pesquisando...' : 'Pesquisar com Tavily'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* APRESENTAÇÃO DE RESULTADOS */}
      <div className="pt-8 border-t border-[#D8CBB8]/70">
        <div className="bg-[#FAF6F0] rounded-[11px] border border-[#E5D9C8] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-[#B89455] text-[#1D160B] rounded-xl flex items-center justify-center shrink-0 shadow-xs font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1A16]">Apresentação Estratégica de Resultados</h3>
              <p className="text-xs text-[#625746] mt-0.5">
                Com base nos dados consolidados de Google Analytics, Search Console e Redes Sociais, realize a reunião mensal com o cliente.
              </p>
            </div>
          </div>
          <button className="whitespace-nowrap px-4 py-2 bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] text-xs rounded-lg font-bold shadow-xs transition-colors w-full md:w-auto text-center">
            Agendar Reunião
          </button>
        </div>
      </div>
    </div>
  );
}
