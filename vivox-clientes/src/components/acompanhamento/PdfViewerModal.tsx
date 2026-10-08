import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Download, FileText, Loader2, AlertCircle } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  nomeArquivo?: string;
  fetchBlob: () => Promise<Blob>;
}

export function PdfViewerModal({
  isOpen,
  onClose,
  titulo,
  nomeArquivo,
  fetchBlob,
}: PdfViewerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  // Limpa object URL anterior
  const cleanupUrl = () => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
    setBlobUrl(null);
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupUrl();
      setError(null);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetchBlob()
      .then((blob) => {
        if (isCancelled) return;
        const url = URL.createObjectURL(blob);
        activeUrlRef.current = url;
        setBlobUrl(url);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Erro ao carregar PDF:', err);
        setError(err.response?.data?.message || 'Não foi possível carregar o documento PDF.');
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      cleanupUrl();
    };
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOpenNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = nomeArquivo || `${titulo}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="pw-glass-panel relative w-full max-w-5xl h-[88vh] flex flex-col rounded-3xl border border-white/70 shadow-2xl bg-[#FFFDF8]/95 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Visualizador */}
        <div className="px-5 py-4 border-b border-[#524B40]/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#8A6828]" />
            </div>
            <div className="truncate">
              <h3 className="font-archivo text-sm sm:text-base font-extrabold text-[#1E1A16] truncate">
                {titulo}
              </h3>
              {nomeArquivo && (
                <p className="text-[11px] text-[#7A6440] font-mono truncate">
                  {nomeArquivo}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {blobUrl && (
              <>
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="pw-glass-control px-3 py-1.5 rounded-xl text-xs font-bold text-[#1E1A16] hover:text-[#7A6440] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Abrir PDF em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#C7A15F]" />
                  <span className="hidden sm:inline">Nova aba</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="pw-glass-control px-3 py-1.5 rounded-xl text-xs font-bold text-[#1E1A16] hover:text-[#7A6440] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Baixar arquivo PDF"
                >
                  <Download className="w-3.5 h-3.5 text-[#C7A15F]" />
                  <span className="hidden sm:inline">Baixar</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8F8271] hover:text-[#1E1A16] hover:bg-black/5 cursor-pointer transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo do Visualizador */}
        <div className="flex-1 w-full h-full relative bg-stone-100/60 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 text-center p-8">
              <Loader2 className="w-8 h-8 text-[#C7A15F] animate-spin" />
              <p className="text-xs font-bold text-[#5E574C]">Carregando documento PDF...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center gap-3 text-center p-8 max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <p className="text-xs font-bold text-rose-700">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetchBlob()
                    .then((blob) => {
                      const url = URL.createObjectURL(blob);
                      activeUrlRef.current = url;
                      setBlobUrl(url);
                    })
                    .catch((err) => {
                      setError(err.response?.data?.message || 'Erro ao carregar PDF.');
                    })
                    .finally(() => setLoading(false));
                }}
                className="pw-glass-control px-4 py-2 rounded-xl text-xs font-bold text-[#1E1A16] hover:text-[#7A6440] cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {blobUrl && !loading && (
            <iframe
              src={blobUrl}
              title={titulo}
              className="w-full h-full rounded-2xl border border-[#524B40]/10 bg-white shadow-inner"
            />
          )}
        </div>
      </div>
    </div>
  );
}
