import React, { useState } from 'react';
import {
  FileBarChart,
  Sparkles,
  Copy,
  Check,
  Printer,
  RefreshCw,
  TrendingUp,
  Target,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../api/client';
import type { Cliente } from '../../types';

interface ExecutiveReportTabProps {
  cliente?: Cliente;
}

export const ExecutiveReportTab: React.FC<ExecutiveReportTabProps> = ({ cliente }) => {
  const [periodo, setPeriodo] = useState('Últimos 30 dias');
  const [foco, setFoco] = useState<'DESEMPENHO_GERAL' | 'OPORTUNIDADES_UPSELL' | 'AUDITORIA_PRODUCOES'>(
    'DESEMPENHO_GERAL',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/ia/reports/executive', {
        clienteId: cliente?.id || undefined,
        periodo,
        foco,
      });

      setReportMarkdown(res.data.relatorioMarkdown);
    } catch (err: any) {
      console.error('Erro ao gerar relatório executivo:', err);
      setErrorMsg(err.response?.data?.message || 'Falha ao processar relatório executivo com a IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!reportMarkdown) return;
    navigator.clipboard.writeText(reportMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#14120E] border border-[#2B261F] p-6 rounded-[11px] text-[#F6F0E7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#24201A] border border-[#4A4032] flex items-center justify-center text-[#C7A15F] shadow-xs shrink-0">
            <FileBarChart className="w-6 h-6 text-[#C7A15F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#F6F0E7] tracking-tight">
                Relatório Executivo Analítico (IA)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#24201A] text-[#C7A15F] border border-[#3E3529]">
                {cliente ? `Cliente: ${cliente.nomeFantasia}` : 'Visão Global da Agência'}
              </span>
            </div>
            <p className="text-xs text-[#8F8271] mt-0.5">
              Consolidação estratégica de métricas, entregas, pontos de atenção e oportunidades de crescimento.
            </p>
          </div>
        </div>

        {/* Parâmetros Rápidos & Botão de Geração */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="bg-[#1E1B15] border border-[#3A3327] text-[#D8CFBF] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#C7A15F]"
          >
            <option value="Últimos 30 dias">Últimos 30 dias</option>
            <option value="Mês Atual">Mês Atual</option>
            <option value="Trimestral">Trimestral</option>
            <option value="Panorama Geral">Panorama Geral</option>
          </select>

          <select
            value={foco}
            onChange={(e) => setFoco(e.target.value as any)}
            className="bg-[#1E1B15] border border-[#3A3327] text-[#D8CFBF] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#C7A15F]"
          >
            <option value="DESEMPENHO_GERAL">Desempenho Geral</option>
            <option value="OPORTUNIDADES_UPSELL">Oportunidades & Upsell</option>
            <option value="AUDITORIA_PRODUCOES">Auditoria Operacional</option>
          </select>

          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="px-4 py-2 bg-[#C7A15F] hover:bg-[#D4B070] disabled:opacity-50 text-[#14120E] text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sintetizando Dados...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar Relatório Executivo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Relatório Renderizado */}
      {reportMarkdown ? (
        <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-[11px] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#D8CBB8] bg-[#FAF7F2] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#8A6828]" />
              <span className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
                Relatório Gerado com Sucesso
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#FFFDF8] hover:bg-[#EEE7DC] border border-[#D8CBB8] text-xs font-medium text-[#1E1A16] transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#847663]" />
                    <span>Copiar Markdown</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          <div className="p-8 prose prose-stone max-w-none text-xs leading-relaxed text-[#1E1A16] whitespace-pre-wrap font-sans">
            {reportMarkdown}
          </div>
        </div>
      ) : (
        <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-[11px] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8D4B4] flex items-center justify-center text-[#8A6828] mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1E1A16]">Nenhum relatório gerado no momento</h3>
          <p className="text-xs text-[#847663] max-w-md mx-auto">
            Escolha o período e o foco acima e clique no botão dourado para que o Agente Executivo da Vivox compile as métricas e insights da conta.
          </p>
        </div>
      )}
    </div>
  );
};
