import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import { getStoredColunas } from './KanbanBoard';

interface ImportBitrixModalProps {
  workspaceId: string;
  isImporting: boolean;
  onClose: () => void;
  onImport: (file: File, etapa?: string) => void;
}

const AUTO_DETECT_VALUE = '__auto__';

export const ImportBitrixModal: React.FC<ImportBitrixModalProps> = ({
  workspaceId,
  isImporting,
  onClose,
  onImport,
}) => {
  const colunas = getStoredColunas(workspaceId);
  const [etapa, setEtapa] = useState<string>(AUTO_DETECT_VALUE);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    onImport(file, etapa === AUTO_DETECT_VALUE ? undefined : etapa);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0D0B]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 select-none">
        <div className="px-6 py-4 bg-[#F6F0E7] border-b border-[#E5D9C8] flex items-center justify-between">
          <h3 className="text-sm font-black text-[#1E1A16] uppercase tracking-wider">
            Importar Tarefas do Bitrix
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#EEE7DC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[12.5px] font-bold text-[#8F8271] uppercase tracking-wider block mb-1.5">
              Importar para qual etapa?
            </label>
            <select
              value={etapa}
              onChange={(e) => setEtapa(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F] focus:bg-white text-[#1E1A16] cursor-pointer"
            >
              <option value={AUTO_DETECT_VALUE}>
                Detectar automaticamente pelo Status do Bitrix
              </option>
              {colunas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#8F8271] mt-1.5 leading-snug">
              A etapa no Bitrix (grupo/coluna do quadro) é diferente do campo "Status" da
              planilha. Se este arquivo já vem filtrado de uma etapa específica do Bitrix,
              escolha aqui a etapa correspondente no nosso Kanban — todas as linhas
              importadas cairão nela, ignorando o Status da planilha.
            </p>
          </div>

          <div>
            <label className="text-[12.5px] font-bold text-[#8F8271] uppercase tracking-wider block mb-1.5">
              Arquivo (.xls / .html) *
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-2.5 px-3.5 py-3 bg-[#FAF7F2] border border-dashed border-[#D8CBB8] rounded-xl hover:border-[#1E1A16] transition-colors cursor-pointer text-left"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#8F8271] shrink-0" />
              <span className="text-xs font-semibold text-[#1E1A16] truncate">
                {file ? file.name : 'Selecionar arquivo exportado do Bitrix'}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.html"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#625746] hover:bg-[#EEE7DC] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || isImporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#181512] hover:bg-[#2B261F] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all cursor-pointer"
            >
              {isImporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Importar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
