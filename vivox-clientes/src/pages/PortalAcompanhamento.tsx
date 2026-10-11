import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { 
  acompanhamentoApi, 
  type AcompanhamentoResponse, 
  type MesComDados,
  type TipoPublicacao,
} from '../api/acompanhamento';
import { ResumoAcompanhamentoCards } from '../components/acompanhamento/ResumoAcompanhamentoCards';
import { FiltrosAcompanhamento } from '../components/acompanhamento/FiltrosAcompanhamento';
import {
  type Periodo,
  filtroApi,
  paramsDaUrl,
  periodoDaUrl,
  textoPeriodo,
  tiposDaUrl,
} from '../components/acompanhamento/periodo';
import { TabelaAcompanhamento } from '../components/acompanhamento/TabelaAcompanhamento';
import { PortalHeader } from '../components/portal/PortalHeader';
import { useLiquidGlass } from '../hooks/useLiquidGlass';
import './planning-workspace.css';

export function PortalAcompanhamento() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [periodo, setPeriodo] = useState<Periodo>(() => periodoDaUrl(searchParams));
  const [tipos, setTipos] = useState<TipoPublicacao[]>(() => tiposDaUrl(searchParams));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dados, setDados] = useState<AcompanhamentoResponse | null>(null);
  const [mesesComDados, setMesesComDados] = useState<MesComDados[]>([]);

  const workspaceRef = useRef<HTMLDivElement>(null);
  useLiquidGlass(workspaceRef, !loading);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resAcomp, resMeses] = await Promise.all([
        acompanhamentoApi.getPortalAcompanhamento(filtroApi(periodo, tipos)),
        acompanhamentoApi.getPortalMeses(),
      ]);
      setDados(resAcomp);
      setMesesComDados(resMeses || []);
    } catch (err: any) {
      console.error('Erro ao carregar acompanhamento do portal:', err);
      setError(err.response?.data?.message || 'Não foi possível carregar os dados de acompanhamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [periodo, tipos]);

  const aplicarFiltros = (novoPeriodo: Periodo, novosTipos: TipoPublicacao[]) => {
    setPeriodo(novoPeriodo);
    setTipos(novosTipos);
    setSearchParams(paramsDaUrl(novoPeriodo, novosTipos), { replace: true });
  };

  return (
    <div 
      ref={workspaceRef} 
      className="planning-workspace w-full select-none flex flex-col text-[#1E1A16]"
      style={{ minHeight: '100dvh' }}
    >
      <div className="pw-lg-scene" aria-hidden="true" />

      {/* Topo do Portal */}
      <PortalHeader cliente={dados?.cliente} />

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 space-y-6">
        {/* Filtros: meses, período personalizado e tipo */}
        <FiltrosAcompanhamento
          periodo={periodo}
          tipos={tipos}
          mesesComDados={mesesComDados}
          onChangePeriodo={(p) => aplicarFiltros(p, tipos)}
          onChangeTipos={(t) => aplicarFiltros(periodo, t)}
        />

        {loading ? (
          // Skeleton Loading
          <div className="space-y-4 animate-pulse" aria-busy="true">
            <div className="h-20 rounded-2xl bg-white/40" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-white/40" />
              ))}
            </div>
            <div className="h-64 rounded-3xl bg-white/40" />
          </div>
        ) : error ? (
          // Estado de Erro
          <div className="pw-glass-panel p-8 rounded-3xl border border-red-200 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1E1A16]">Erro ao carregar dados</h2>
              <p className="text-xs text-[#5E574C] mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => carregarDados()}
              className="pw-glass-control pw-glass-gold px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar novamente</span>
            </button>
          </div>
        ) : dados ? (
          <div className="space-y-6">
            {/* 1. Resumo em frase + Cards de métricas */}
            <ResumoAcompanhamentoCards
              resumo={dados.resumo}
              textoPeriodo={textoPeriodo(periodo)}
              tiposFiltrados={tipos}
            />

            {/* 2. Tabela de Publicações (Somente Leitura) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-archivo text-xs font-bold uppercase tracking-wider text-[#7A6440]">
                  Publicações do período ({dados.publicacoes.length})
                </span>
              </div>
              <TabelaAcompanhamento
                publicacoes={dados.publicacoes}
                readOnly={true}
              />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default PortalAcompanhamento;
