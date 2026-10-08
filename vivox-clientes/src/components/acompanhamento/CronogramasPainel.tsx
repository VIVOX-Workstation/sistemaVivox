import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  FileCheck,
  Building2
} from 'lucide-react';
import { 
  cronogramasApi, 
  type Cronograma, 
  formatarTamanhoBytes, 
  formatarMesReferencia 
} from '../../api/cronogramas';
import { PdfViewerModal } from './PdfViewerModal';
import { MESES_NOMES, type Periodo } from './periodo';

interface CronogramasPainelProps {
  clienteId: string | null;
  clienteNome?: string;
  periodoAtual?: Periodo;
}

const MAX_TAMANHO_BYTES = 20 * 1024 * 1024; // 20 MB

const ANOS_OPCOES = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 2 + i);

export function CronogramasPainel({
  clienteId,
  clienteNome,
  periodoAtual,
}: CronogramasPainelProps) {
  const [cronogramas, setCronogramas] = useState<Cronograma[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado do formulário de upload
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [ano, setAno] = useState<string>(() => {
    if (periodoAtual?.modo === 'mes') return String(periodoAtual.ano);
    return '';
  });
  const [mes, setMes] = useState<string>(() => {
    if (periodoAtual?.modo === 'mes') return String(periodoAtual.mes);
    return '';
  });

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado do visualizador de PDF
  const [visualizando, setVisualizando] = useState<Cronograma | null>(null);

  // Carrega lista de cronogramas do cliente selecionado
  const carregarCronogramas = async (cId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await cronogramasApi.listarPorCliente(cId);
      setCronogramas(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar cronogramas:', err);
      setError(err.response?.data?.message || 'Erro ao carregar lista de cronogramas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clienteId) {
      carregarCronogramas(clienteId);
    } else {
      setCronogramas([]);
    }
  }, [clienteId]);

  // Atualiza mês/ano padrão do form se o período da página mudar
  useEffect(() => {
    if (periodoAtual?.modo === 'mes') {
      setAno(String(periodoAtual.ano));
      setMes(String(periodoAtual.mes));
    }
  }, [periodoAtual]);

  const handleValidarEInserirArquivo = (file: File) => {
    setFormError(null);

    // Valida se é PDF
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFormError('O arquivo selecionado deve ser um documento no formato PDF.');
      return;
    }

    // Valida limite de tamanho (20 MB)
    if (file.size > MAX_TAMANHO_BYTES) {
      setFormError(`O arquivo (${formatarTamanhoBytes(file.size)}) ultrapassa o limite máximo de 20 MB.`);
      return;
    }

    setArquivo(file);

    // Preenche título com o nome do arquivo sem .pdf (se ainda não editado pelo usuário)
    const nomeBase = file.name.replace(/\.pdf$/i, '');
    setTitulo(nomeBase.slice(0, 150));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleValidarEInserirArquivo(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidarEInserirArquivo(e.dataTransfer.files[0]);
    }
  };

  const handleLimparArquivo = () => {
    setArquivo(null);
    setTitulo('');
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      setFormError('Selecione um cliente para enviar o cronograma.');
      return;
    }
    if (!arquivo) {
      setFormError('Escolha ou arraste um arquivo PDF para enviar.');
      return;
    }
    if (!titulo.trim()) {
      setFormError('Informe um título para o cronograma.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setFormError(null);

    try {
      await cronogramasApi.enviar(
        clienteId,
        {
          arquivo,
          titulo: titulo.trim(),
          ano: ano ? Number(ano) : undefined,
          mes: mes ? Number(mes) : undefined,
        },
        (progresso) => setUploadProgress(progresso)
      );

      setFeedbackSucesso(`Cronograma "${titulo.trim()}" enviado com sucesso!`);
      setTimeout(() => setFeedbackSucesso(null), 4000);

      // Limpa formulário
      handleLimparArquivo();

      // Recarrega lista
      await carregarCronogramas(clienteId);
    } catch (err: any) {
      console.error('Erro ao enviar cronograma:', err);
      setFormError(err.response?.data?.message || 'Falha ao enviar o cronograma.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleExcluir = async (id: string, tituloExcluir: string) => {
    if (!confirm(`Deseja realmente excluir o cronograma "${tituloExcluir}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await cronogramasApi.excluir(id);
      setCronogramas((prev) => prev.filter((c) => c.id !== id));
      setFeedbackSucesso('Cronograma excluído com sucesso.');
      setTimeout(() => setFeedbackSucesso(null), 3000);
    } catch (err: any) {
      console.error('Erro ao excluir cronograma:', err);
      alert(err.response?.data?.message || 'Não foi possível excluir o cronograma.');
    }
  };

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

  if (!clienteId) {
    return (
      <div className="pw-glass-panel p-10 rounded-3xl text-center space-y-3">
        <Building2 className="w-10 h-10 text-[#C7A15F] mx-auto" />
        <h3 className="font-archivo text-base font-bold text-[#1E1A16]">
          Nenhum cliente selecionado
        </h3>
        <p className="text-xs text-[#5E574C] max-w-sm mx-auto">
          Selecione um cliente no menu superior para visualizar ou enviar cronogramas em PDF.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerta de Feedback Sucesso */}
      {feedbackSucesso && (
        <div className="p-4 rounded-2xl bg-[#E6F4EA] border border-[#CEEAD6] text-[#247A4A] text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#247A4A] shrink-0" />
            <span>{feedbackSucesso}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSucesso(null)}
            className="p-1 hover:bg-[#CEEAD6]/50 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Área de Envio de Novo Cronograma (Upload) */}
      <div className="pw-glass-panel p-5 sm:p-6 rounded-3xl border border-white/60 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <span className="pw-section-label flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-[#C7A15F]" />
              <span>Novo Cronograma</span>
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#1E1A16] font-archivo">
              Enviar cronograma em PDF
            </h2>
            <p className="text-xs text-[#5E574C]">
              Envie arquivos PDF de até 20 MB vinculados a {clienteNome || 'este cliente'}.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitUpload} className="space-y-4">
          {/* Zona de Drop / Seleção de Arquivo */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !arquivo && fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
              isDragging
                ? 'border-[#C7A15F] bg-[#FAF2E4]/60 scale-[1.005]'
                : arquivo
                ? 'border-emerald-300 bg-emerald-50/40 cursor-default'
                : 'border-[#524B40]/20 bg-white/40 hover:bg-white/70 hover:border-[#C7A15F]/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {arquivo ? (
              <div className="flex items-center gap-4 w-full max-w-md p-3 rounded-2xl bg-white border border-emerald-200 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-[#1E1A16] truncate">{arquivo.name}</p>
                  <p className="text-[11px] text-[#5E574C]">{formatarTamanhoBytes(arquivo.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLimparArquivo();
                  }}
                  className="p-1.5 rounded-lg text-[#8F8271] hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Trocar arquivo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center mx-auto shadow-2xs">
                  <UploadCloud className="w-6 h-6 text-[#8A6828]" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-[#1E1A16]">
                  Arraste e solte o PDF aqui ou <span className="text-[#8A6828] underline underline-offset-2">escolha no computador</span>
                </p>
                <p className="text-[11px] text-[#8F8271]">
                  Apenas arquivos no formato PDF (máximo de 20 MB)
                </p>
              </div>
            )}
          </div>

          {/* Campos Complementares: Título e Mês/Ano de Referência */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Título do Cronograma */}
            <div className="sm:col-span-6 space-y-1">
              <label className="block text-[11px] font-bold text-[#7A6440] uppercase tracking-wider">
                Título do Cronograma *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value.slice(0, 150))}
                placeholder="Ex: Cronograma Editorial - Março 2025"
                disabled={uploading}
                maxLength={150}
                className="w-full h-10 px-3 text-xs rounded-xl bg-white/80 border border-[#524B40]/15 focus:outline-none focus:border-[#C7A15F] disabled:opacity-50"
              />
            </div>

            {/* Mês de Referência */}
            <div className="sm:col-span-3 space-y-1">
              <label className="block text-[11px] font-bold text-[#7A6440] uppercase tracking-wider">
                Mês de Referência
              </label>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                disabled={uploading}
                className="w-full h-10 px-3 text-xs rounded-xl bg-white/80 border border-[#524B40]/15 focus:outline-none focus:border-[#C7A15F] disabled:opacity-50 cursor-pointer"
              >
                <option value="">Sem mês</option>
                {MESES_NOMES.map((nomeMes, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {nomeMes}
                  </option>
                ))}
              </select>
            </div>

            {/* Ano de Referência */}
            <div className="sm:col-span-3 space-y-1">
              <label className="block text-[11px] font-bold text-[#7A6440] uppercase tracking-wider">
                Ano de Referência
              </label>
              <select
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                disabled={uploading}
                className="w-full h-10 px-3 text-xs rounded-xl bg-white/80 border border-[#524B40]/15 focus:outline-none focus:border-[#C7A15F] disabled:opacity-50 cursor-pointer"
              >
                <option value="">Sem ano</option>
                {ANOS_OPCOES.map((anoOpcao) => (
                  <option key={anoOpcao} value={anoOpcao}>
                    {anoOpcao}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Erro de Validação ou Envio */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Barra de Progresso de Upload */}
          {uploading && (
            <div className="space-y-1.5 p-3 rounded-xl bg-white/70 border border-[#524B40]/10 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#7A6440]">
                <span>Enviando arquivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#C7A15F] to-[#8A6828] transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Botão de Enviar */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={uploading || !arquivo || !titulo.trim()}
              className="pw-glass-control pw-glass-gold px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-xs transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#1E1B17]" />
                  <span>Enviando ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-[#1E1B17]" />
                  <span>Publicar Cronograma</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Lista de Cronogramas Cadastrados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-archivo text-xs sm:text-sm font-bold uppercase tracking-wider text-[#7A6440]">
            Cronogramas do Cliente ({cronogramas.length})
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="pw-glass-panel h-18 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="pw-glass-panel p-8 rounded-3xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-xs font-bold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => clienteId && carregarCronogramas(clienteId)}
              className="pw-glass-control px-4 py-2 rounded-xl text-xs font-bold text-[#1E1A16] hover:text-[#7A6440] cursor-pointer"
            >
              Tentar carregar novamente
            </button>
          </div>
        ) : cronogramas.length === 0 ? (
          <div className="pw-glass-panel p-10 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center mx-auto shadow-2xs">
              <FileText className="w-6 h-6 text-[#8A6828]" />
            </div>
            <h3 className="font-archivo text-sm sm:text-base font-bold text-[#1E1A16]">
              Nenhum cronograma cadastrado
            </h3>
            <p className="text-xs text-[#5E574C] max-w-sm mx-auto">
              Utilize o formulário acima para enviar o primeiro cronograma em PDF deste cliente.
            </p>
          </div>
        ) : (
          <>
            {/* Visão Tabela Desktop / Tablet (md+) */}
            <div className="hidden md:block pw-glass-panel rounded-3xl border border-white/60 shadow-sm overflow-hidden">
              <table className="w-full text-xs text-[#1E1A16] border-collapse">
                <thead>
                  <tr className="border-b border-[#524B40]/10 bg-white/40 text-[11px] font-bold text-[#7A6440] uppercase tracking-wider text-left select-none">
                    <th className="py-3 px-4 min-w-[220px]">Título / Arquivo</th>
                    <th className="py-3 px-3 w-40">Mês de Referência</th>
                    <th className="py-3 px-3 w-28 text-right">Tamanho</th>
                    <th className="py-3 px-3 w-32">Enviado em</th>
                    <th className="py-3 px-3 w-36">Enviado por</th>
                    <th className="py-3 px-4 w-32 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#524B40]/5">
                  {cronogramas.map((c) => (
                    <tr key={c.id} className="hover:bg-white/60 transition-colors">
                      {/* Título e Nome Arquivo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
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
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="pw-glass-pill px-2.5 py-1 text-[11px] font-bold">
                          {formatarMesReferencia(c.mes, c.ano)}
                        </span>
                      </td>

                      {/* Tamanho */}
                      <td className="py-3 px-3 text-right font-mono text-[#5E574C] whitespace-nowrap">
                        {formatarTamanhoBytes(c.tamanho)}
                      </td>

                      {/* Enviado em */}
                      <td className="py-3 px-3 text-[#5E574C] whitespace-nowrap">
                        {formatarDataCriacao(c.createdAt)}
                      </td>

                      {/* Enviado por */}
                      <td className="py-3 px-3 text-[#5E574C] truncate">
                        {c.enviadoPor?.nome || '-'}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setVisualizando(c)}
                            className="pw-glass-control px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#1E1A16] hover:text-[#7A6440] flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Visualizar documento PDF"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#C7A15F]" />
                            <span>Visualizar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluir(c.id, c.titulo)}
                            className="p-1.5 rounded-xl text-[#8F8271] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Excluir cronograma"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Visão Cards Mobile (abaixo de md) */}
            <div className="md:hidden space-y-3">
              {cronogramas.map((c) => (
                <div 
                  key={c.id} 
                  className="pw-glass-panel p-4 rounded-2xl border border-white/60 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[#8A6828]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-[#1E1A16] truncate">
                          {c.titulo}
                        </p>
                        <p className="text-[10px] text-[#8F8271] font-mono truncate">
                          {c.nomeArquivo} • {formatarTamanhoBytes(c.tamanho)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExcluir(c.id, c.titulo)}
                      className="p-1.5 rounded-xl text-[#8F8271] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Excluir cronograma"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#5E574C] pt-1 border-t border-[#524B40]/10 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C7A15F]" />
                      <span>{formatarMesReferencia(c.mes, c.ano)}</span>
                    </div>
                    {c.enviadoPor?.nome && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#8F8271]" />
                        <span>{c.enviadoPor.nome}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setVisualizando(c)}
                      className="pw-glass-control w-full py-2 rounded-xl text-xs font-bold text-[#1E1A16] hover:text-[#7A6440] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C7A15F]" />
                      <span>Visualizar PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Visualizador Modal de PDF */}
      {visualizando && (
        <PdfViewerModal
          isOpen={Boolean(visualizando)}
          onClose={() => setVisualizando(null)}
          titulo={visualizando.titulo}
          nomeArquivo={visualizando.nomeArquivo}
          fetchBlob={() => cronogramasApi.baixarArquivo(visualizando.id)}
        />
      )}
    </div>
  );
}
