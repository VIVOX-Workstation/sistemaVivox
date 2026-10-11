import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Eye, 
  Calendar, 
  AlertCircle, 
  Download,
  Building2,
  RefreshCw 
} from 'lucide-react';
import { 
  cronogramasApi, 
  type Cronograma, 
  formatarTamanhoBytes, 
  formatarMesReferencia 
} from '../api/cronogramas';
import { portalApi } from '../api/portal';
import { PortalHeader } from '../components/portal/PortalHeader';
import { PdfViewerModal } from '../components/acompanhamento/PdfViewerModal';
import { useLiquidGlass } from '../hooks/useLiquidGlass';
import './planning-workspace.css';

export function PortalCronogramas() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cronogramas, setCronogramas] = useState<Cronograma[]>([]);
  const [cliente, setCliente] = useState<{ nomeFantasia: string; logoUrl?: string | null } | null>(null);

  // Estado de visualização de PDF
  const [visualizando, setVisualizando] = useState<Cronograma | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  useLiquidGlass(workspaceRef, !loading);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cronosRes, mapaRes] = await Promise.allSettled([
        cronogramasApi.portalListar(),
        portalApi.getMapaServicos(),
      ]);

      if (cronosRes.status === 'fulfilled') {
        setCronogramas(cronosRes.value || []);
      } else {
        console.error('Erro ao listar cronogramas do portal:', cronosRes.reason);
        setError(cronosRes.reason?.response?.data?.message || 'Não foi possível carregar os cronogramas.');
      }

      if (mapaRes.status === 'fulfilled') {
        setCliente(mapaRes.value.cliente);
      }
    } catch (err: any) {
      console.error('Erro geral ao carregar portal de cronogramas:', err);
      setError('Erro ao carregar dados do portal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const formatarDataCriacao = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div 
      ref={workspaceRef} 
      className="planning-workspace w-full select-none flex flex-col text-[#1E1A16]"
      style={{ minHeight: '100dvh' }}
    >
      <div className="pw-lg-scene" aria-hidden="true" />

      {/* Topo do Portal com navegação Acompanhamento e Cronogramas */}
      <PortalHeader cliente={cliente} />

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 space-y-6">
        <div className="pw-glass-panel p-5 sm:p-6 rounded-3xl border border-white/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="pw-section-label flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#C7A15F]" />
              <span>Documentos e Planejamento</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1A16] font-archivo">
              Cronogramas em PDF
            </h2>
            <p className="text-xs text-[#5E574C]">
              Visualize e baixe os cronogramas de publicações preparados para a sua marca.
            </p>
          </div>
        </div>

        {/* Listagem */}
        {loading ? (
          <div className="space-y-3 animate-pulse" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="pw-glass-panel h-20 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="pw-glass-panel p-8 rounded-3xl border border-rose-200 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-archivo text-sm font-bold text-[#1E1A16]">Erro ao carregar cronogramas</h3>
              <p className="text-xs text-[#5E574C] mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={carregarDados}
              className="pw-glass-control px-4 py-2 rounded-xl text-xs font-bold text-[#1E1A16] hover:text-[#7A6440] inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar novamente</span>
            </button>
          </div>
        ) : cronogramas.length === 0 ? (
          <div className="pw-glass-panel p-12 rounded-3xl text-center space-y-3 border border-white/60">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center mx-auto shadow-2xs">
              <FileText className="w-7 h-7 text-[#8A6828]" />
            </div>
            <h3 className="font-archivo text-base font-bold text-[#1E1A16]">
              Nenhum cronograma disponível ainda
            </h3>
            <p className="text-xs text-[#5E574C] max-w-md mx-auto">
              Assim que a equipe disponibilizar os novos cronogramas em PDF para sua aprovação e consulta, eles aparecerão listados aqui.
            </p>
          </div>
        ) : (
          <>
            {/* Tabela Desktop / Tablet (md+) */}
            <div className="hidden md:block pw-glass-panel rounded-3xl border border-white/60 shadow-sm overflow-hidden">
              <table className="w-full text-xs text-[#1E1A16] border-collapse">
                <thead>
                  <tr className="border-b border-[#524B40]/10 bg-white/40 text-[11px] font-bold text-[#7A6440] uppercase tracking-wider text-left select-none">
                    <th className="py-3.5 px-4 min-w-[240px]">Documento</th>
                    <th className="py-3.5 px-3 w-44">Mês de Referência</th>
                    <th className="py-3.5 px-3 w-28 text-right">Tamanho</th>
                    <th className="py-3.5 px-3 w-32">Data</th>
                    <th className="py-3.5 px-4 w-36 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#524B40]/5">
                  {cronogramas.map((c) => (
                    <tr key={c.id} className="hover:bg-white/60 transition-colors">
                      {/* Documento */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-[#8A6828]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-xs text-[#1E1A16] truncate">
                              {c.titulo}
                            </p>
                            <p className="text-[11px] text-[#8F8271] font-mono truncate">
                              {c.nomeArquivo}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Mês de Referência */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="pw-glass-pill px-2.5 py-1 text-[11px] font-bold">
                          {formatarMesReferencia(c.mes, c.ano)}
                        </span>
                      </td>

                      {/* Tamanho */}
                      <td className="py-3.5 px-3 text-right font-mono text-[#5E574C] whitespace-nowrap">
                        {formatarTamanhoBytes(c.tamanho)}
                      </td>

                      {/* Data */}
                      <td className="py-3.5 px-3 text-[#5E574C] whitespace-nowrap">
                        {formatarDataCriacao(c.createdAt)}
                      </td>

                      {/* Ação */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setVisualizando(c)}
                          className="pw-glass-control pw-glass-gold px-3 py-1.5 rounded-xl text-xs font-bold text-[#1E1B17] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.02] transition-transform mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visualizar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards Mobile (abaixo de md) */}
            <div className="md:hidden space-y-3">
              {cronogramas.map((c) => (
                <div 
                  key={c.id} 
                  className="pw-glass-panel p-4 rounded-2xl border border-white/60 shadow-xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-[#8A6828]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-xs text-[#1E1A16] truncate">
                        {c.titulo}
                      </p>
                      <p className="text-[10px] text-[#8F8271] font-mono truncate">
                        {c.nomeArquivo} • {formatarTamanhoBytes(c.tamanho)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#5E574C] pt-2 border-t border-[#524B40]/10">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C7A15F]" />
                      <span>{formatarMesReferencia(c.mes, c.ano)}</span>
                    </div>
                    <span>{formatarDataCriacao(c.createdAt)}</span>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setVisualizando(c)}
                      className="pw-glass-control pw-glass-gold w-full py-2 rounded-xl text-xs font-bold text-[#1E1B17] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Visualizador Modal de PDF */}
      {visualizando && (
        <PdfViewerModal
          isOpen={Boolean(visualizando)}
          onClose={() => setVisualizando(null)}
          titulo={visualizando.titulo}
          nomeArquivo={visualizando.nomeArquivo}
          fetchBlob={() => cronogramasApi.portalBaixarArquivo(visualizando.id)}
        />
      )}
    </div>
  );
}

export default PortalCronogramas;
