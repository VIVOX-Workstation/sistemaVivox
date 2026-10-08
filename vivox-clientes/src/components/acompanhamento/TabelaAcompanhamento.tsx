import React, { useState, useRef, useEffect } from 'react';
import { 
  ExternalLink, 
  Trash2, 
  Check, 
  Loader2, 
  AlertCircle,
  Plus,
  Link as LinkIcon
} from 'lucide-react';
import type { Publicacao, TipoPublicacao } from '../../api/acompanhamento';

const TIPOS_PUBLICACAO: TipoPublicacao[] = ['POST', 'REELS', 'CARROSSEL', 'STORY', 'VIDEO'];

const EDITABLE_FIELDS = [
  'dataPublicacao',
  'tipo',
  'assunto',
  'link',
  'curtidas',
  'comentarios',
  'reposts',
  'compartilhamentos',
  'salvamentos',
  'visualizacoes'
];

interface TabelaAcompanhamentoProps {
  publicacoes: Publicacao[];
  readOnly?: boolean;
  onUpdatePublicacao?: (id: string, campo: keyof Publicacao, valor: any) => Promise<void>;
  onDeletePublicacao?: (id: string) => Promise<void>;
  rowStatus?: Record<string, 'saving' | 'saved' | 'error'>;
}

export function TabelaAcompanhamento({
  publicacoes,
  readOnly = false,
  onUpdatePublicacao,
  onDeletePublicacao,
  rowStatus = {},
}: TabelaAcompanhamentoProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [cellValue, setCellValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  // Foca o input assim que a célula entra em edição
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current && typeof inputRef.current.select === 'function') {
        inputRef.current.select();
      }
    }
  }, [editingCell]);

  const formatarDataExibicao = (dataIso?: string | null) => {
    if (!dataIso) return '-';
    try {
      const d = new Date(dataIso);
      if (isNaN(d.getTime())) return dataIso;
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return dataIso;
    }
  };

  const getIsoDateString = (dataIso?: string | null) => {
    if (!dataIso) return '';
    try {
      const d = new Date(dataIso);
      if (isNaN(d.getTime())) return '';
      // Data local (não UTC): depois das 21h em Brasília o UTC já é o dia seguinte
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    } catch {
      return '';
    }
  };

  const getTipoBadgeStyle = (tipo: TipoPublicacao) => {
    switch (tipo) {
      case 'REELS':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'POST':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CARROSSEL':
        return 'bg-[#FAF2E4] text-[#8A6828] border-[#E8D4B4]';
      case 'STORY':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'VIDEO':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const handleStartEdit = (pub: Publicacao, field: string) => {
    if (readOnly) return;

    // Visualizações só é editável para REELS, VIDEO e STORY
    if (field === 'visualizacoes' && (pub.tipo === 'POST' || pub.tipo === 'CARROSSEL')) {
      return;
    }

    // O clique dentro do campo em edição (ex.: escolher uma opção do select) sobe até a <td>;
    // sem isso o valor voltava ao original antes de salvar
    if (editingCell?.rowId === pub.id && editingCell?.field === field) return;

    setEditingCell({ rowId: pub.id, field });

    let val = '';
    if (field === 'dataPublicacao') {
      val = getIsoDateString(pub.dataPublicacao);
    } else {
      const raw = (pub as any)[field];
      val = raw !== null && raw !== undefined ? String(raw) : '';
    }
    setCellValue(val);
  };

  // valorEscolhido: usado pelo select, que salva no onChange (o estado cellValue ainda não atualizou)
  const handleCommitEdit = async (pub: Publicacao, valorEscolhido?: string) => {
    if (!editingCell || !onUpdatePublicacao) return;

    const { field, rowId } = editingCell;
    const originalRaw = (pub as any)[field];
    setEditingCell(null);
    const valor = valorEscolhido ?? cellValue;

    let processedValue: any = null;

    if (field === 'dataPublicacao') {
      if (valor.trim()) {
        processedValue = new Date(`${valor.trim()}T12:00:00-03:00`).toISOString(); // meio-dia de Brasília
      } else {
        processedValue = pub.dataPublicacao; // fallback se deixar vazio
      }
    } else if (['curtidas', 'comentarios', 'compartilhamentos', 'salvamentos', 'reposts', 'visualizacoes'].includes(field)) {
      if (valor.trim() === '') {
        processedValue = null;
      } else {
        const parsed = parseInt(valor.trim(), 10);
        processedValue = isNaN(parsed) ? null : Math.max(0, parsed);
      }
    } else {
      processedValue = valor.trim() || null;
    }

    // Se não houve alteração real, não dispara chamada
    if (processedValue === originalRaw) return;
    if (field === 'dataPublicacao' && getIsoDateString(processedValue) === getIsoDateString(originalRaw)) return;

    try {
      await onUpdatePublicacao(rowId, field as keyof Publicacao, processedValue);
    } catch (err) {
      console.error('Erro ao salvar alteração inline:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, pub: Publicacao, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommitEdit(pub);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCommitEdit(pub);

      // Avança para o próximo campo da linha ou primeira da próxima linha
      if (!editingCell) return;
      const currentIdx = EDITABLE_FIELDS.indexOf(editingCell.field);
      let nextField = EDITABLE_FIELDS[currentIdx + 1];
      let nextRow = pub;

      if (!nextField) {
        if (rowIndex < publicacoes.length - 1) {
          nextRow = publicacoes[rowIndex + 1];
          nextField = EDITABLE_FIELDS[0];
        }
      }

      if (nextField && nextRow) {
        handleStartEdit(nextRow, nextField);
      }
    }
  };

  const encurtarLink = (url?: string | null) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.length > 15 ? `${parsed.pathname.slice(0, 15)}...` : parsed.pathname;
      return `${parsed.hostname.replace('www.', '')}${pathname}`;
    } catch {
      return url.length > 20 ? `${url.slice(0, 20)}...` : url;
    }
  };

  return (
    <div className="pw-glass-panel rounded-3xl border border-white/60 bg-white/70 shadow-sm overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[1040px] text-xs text-[#1E1A16] border-collapse">
          <thead>
            <tr className="border-b border-[#524B40]/10 bg-white/40 text-[11px] font-bold text-[#7A6440] uppercase tracking-wider text-left select-none">
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-3 w-24">Data</th>
              <th className="py-3 px-3 w-28">Tipo</th>
              <th className="py-3 px-4 min-w-[200px]">Assunto</th>
              <th className="py-3 px-3 min-w-[150px]">Link</th>
              <th className="py-3 px-2.5 w-20 text-right">Curtida</th>
              <th className="py-3 px-2.5 w-24 text-right">Comentário</th>
              <th className="py-3 px-2.5 w-20 text-right">Repost</th>
              <th className="py-3 px-2.5 w-20 text-right">Envios</th>
              <th className="py-3 px-2.5 w-24 text-right">Salvamento</th>
              <th className="py-3 px-2.5 w-28 text-right">Visualização</th>
              {!readOnly && <th className="py-3 px-3 w-20 text-center">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#524B40]/5">
            {publicacoes.length === 0 ? (
              <tr>
                <td 
                  colSpan={readOnly ? 11 : 12} 
                  className="py-12 text-center text-xs text-[#5E574C] font-semibold"
                >
                  Nenhuma publicação cadastrada neste período.
                </td>
              </tr>
            ) : (
              publicacoes.map((pub, idx) => {
                const status = rowStatus[pub.id];
                const isVisualizacoesApplicable = pub.tipo === 'REELS' || pub.tipo === 'VIDEO' || pub.tipo === 'STORY';

                return (
                  <tr 
                    key={pub.id}
                    className="hover:bg-white/60 transition-colors group"
                  >
                    {/* 1. Numeração */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#8F8271]">
                      <div className="flex items-center justify-center gap-1">
                        <span>{idx + 1}</span>
                        {status === 'saving' && <Loader2 className="w-3 h-3 text-[#C7A15F] animate-spin" />}
                        {status === 'saved' && <Check className="w-3 h-3 text-emerald-600 animate-fade-in" />}
                        {status === 'error' && (
                          <span title="Erro ao salvar">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Data */}
                    <td 
                      onClick={() => handleStartEdit(pub, 'dataPublicacao')}
                      className={`py-2.5 px-3 whitespace-nowrap font-medium ${
                        !readOnly ? 'cursor-pointer hover:bg-white/80' : ''
                      }`}
                    >
                      {editingCell?.rowId === pub.id && editingCell?.field === 'dataPublicacao' ? (
                        <input
                          ref={inputRef as any}
                          type="date"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => handleCommitEdit(pub)}
                          onKeyDown={(e) => handleKeyDown(e, pub, idx)}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-[#C7A15F] bg-white focus:outline-none shadow-xs"
                        />
                      ) : (
                        <span>{formatarDataExibicao(pub.dataPublicacao)}</span>
                      )}
                    </td>

                    {/* 3. Tipo */}
                    <td 
                      onClick={() => handleStartEdit(pub, 'tipo')}
                      className={`py-2.5 px-3 ${!readOnly ? 'cursor-pointer hover:bg-white/80' : ''}`}
                    >
                      {editingCell?.rowId === pub.id && editingCell?.field === 'tipo' ? (
                        <select
                          ref={inputRef as any}
                          value={cellValue}
                          onChange={(e) => {
                            setCellValue(e.target.value);
                            handleCommitEdit(pub, e.target.value);
                          }}
                          onBlur={() => handleCommitEdit(pub)}
                          onKeyDown={(e) => handleKeyDown(e, pub, idx)}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-[#C7A15F] bg-white focus:outline-none shadow-xs"
                        >
                          {TIPOS_PUBLICACAO.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTipoBadgeStyle(pub.tipo)}`}>
                          {pub.tipo}
                        </span>
                      )}
                    </td>

                    {/* 4. Assunto */}
                    <td 
                      onClick={() => handleStartEdit(pub, 'assunto')}
                      className={`py-2.5 px-4 font-semibold ${
                        !readOnly ? 'cursor-pointer hover:bg-white/80' : ''
                      }`}
                    >
                      {editingCell?.rowId === pub.id && editingCell?.field === 'assunto' ? (
                        <input
                          ref={inputRef as any}
                          type="text"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => handleCommitEdit(pub)}
                          onKeyDown={(e) => handleKeyDown(e, pub, idx)}
                          placeholder="Assunto da publicação..."
                          className="w-full px-2 py-1 text-xs rounded-lg border border-[#C7A15F] bg-white focus:outline-none shadow-xs"
                        />
                      ) : (
                        <span className="truncate block max-w-[280px]">
                          {pub.assunto || <span className="text-[#8F8271] italic font-normal">Sem assunto</span>}
                        </span>
                      )}
                    </td>

                    {/* 5. Link */}
                    <td 
                      onClick={() => !readOnly && !pub.link && handleStartEdit(pub, 'link')}
                      className={`py-2.5 px-3 ${!readOnly ? 'cursor-pointer hover:bg-white/80' : ''}`}
                    >
                      {editingCell?.rowId === pub.id && editingCell?.field === 'link' ? (
                        <input
                          ref={inputRef as any}
                          type="url"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => handleCommitEdit(pub)}
                          onKeyDown={(e) => handleKeyDown(e, pub, idx)}
                          placeholder="https://..."
                          className="w-full px-2 py-1 text-xs rounded-lg border border-[#C7A15F] bg-white focus:outline-none shadow-xs"
                        />
                      ) : pub.link ? (
                        <div className="flex items-center gap-1 max-w-[170px]">
                          <a
                            href={pub.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#7A6440] hover:text-[#1E1A16] font-semibold underline truncate flex items-center gap-1"
                            title={pub.link}
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{encurtarLink(pub.link)}</span>
                          </a>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(pub, 'link');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-200 rounded transition-opacity"
                              title="Editar URL"
                            >
                              <LinkIcon className="w-3 h-3 text-[#5E574C]" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#8F8271] italic">-</span>
                      )}
                    </td>

                    {/* 6. Curtidas */}
                    <td 
                      onClick={() => handleStartEdit(pub, 'curtidas')}
                      className={`py-2.5 px-2.5 text-right font-mono font-medium ${
                        !readOnly ? 'cursor-pointer hover:bg-white/80' : ''
                      }`}
                    >
                      {editingCell?.rowId === pub.id && editingCell?.field === 'curtidas' ? (
                        <input
                          ref={inputRef as any}
                          type="number"
                          min="0"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => handleCommitEdit(pub)}
                          onKeyDown={(e) => handleKeyDown(e, pub, idx)}
                          className="w-16 px-1.5 py-0.5 text-xs text-right rounded-lg border border-[#C7A15F] bg-white focus:outline-none"
                        />
                      ) : (
                        <span>{pub.curtidas !== null && pub.curtidas !== undefined ? pub.curtidas : '-'}</span>
                      )}
                    </td>

                    {/* 7. Comentários */}
                    <td 
                      onClick={() => handleStartEdit(pub, 'comentarios')}
                      className={`py-2.5 px-2.5 text-right font-mono font-medium ${
                        !readOnly ? 'cursor-pointer hover:bg-white/80' : ''
                      }`}
                    >
                      {editingCell?.rowId === pub.id && editingCell?.field === 'comentarios' ? (
                        <input
                          ref={inputRef as any}
                          type="number"
                          min="0"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => handleCommitEdit(pub)}
                          onKeyDown={(e) => handleKeyDown(e, pub, idx)}
                          className="w-16 px-1.5 py-0.5 text-xs text-right rounded-lg border border-[#C7A15F] bg-white focus:outline-none"
                        />
                      ) : (
                        <span>{pub.comentarios !== null && pub.comentarios !== undefined ? pub.comentarios : '-'}</span>
                      )}
                    </td>

                    {/* 8. Reposts */}
                    <td 
                      onClick={() => handleStartEdit(pub, 'reposts')}
                      className={`py-2.5 px-2.5 text-right font-mono font-medium ${
                        !readOnly ? 'cursor-pointer hover:bg-white/80' : ''
                      }`}
                    >
                      {editingCell?.rowId === pub.id && editingCell?.field === 'reposts' ? (
                        <input
                          ref={inputRef as any}
                          type="number"
                          min="0"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => handleCommitEdit(pub)}
                          onKeyDown={(e) => handleKeyDown(e, pub, idx)}
                          className="w-16 px-1.5 py-0.5 text-xs text-right rounded-lg border border-[#C7A15F] bg-white focus:outline-none"
                        />
                      ) : (
                        <span>{pub.reposts !== null && pub.reposts !== undefined ? pub.reposts : '-'}</span>
                      )}
                    </td>

                    {/* 9. Envios (compartilhamentos) */}
                    <td 
                      onClick={() => handleStartEdit(pub, 'compartilhamentos')}
                      className={`py-2.5 px-2.5 text-right font-mono font-medium ${
                        !readOnly ? 'cursor-pointer hover:bg-white/80' : ''
                      }`}
                    >
                      {editingCell?.rowId === pub.id && editingCell?.field === 'compartilhamentos' ? (
                        <input
                          ref={inputRef as any}
                          type="number"
                          min="0"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => handleCommitEdit(pub)}
                          onKeyDown={(e) => handleKeyDown(e, pub, idx)}
                          className="w-16 px-1.5 py-0.5 text-xs text-right rounded-lg border border-[#C7A15F] bg-white focus:outline-none"
                        />
                      ) : (
                        <span>{pub.compartilhamentos !== null && pub.compartilhamentos !== undefined ? pub.compartilhamentos : '-'}</span>
                      )}
                    </td>

                    {/* 10. Salvamentos */}
                    <td 
                      onClick={() => handleStartEdit(pub, 'salvamentos')}
                      className={`py-2.5 px-2.5 text-right font-mono font-medium ${
                        !readOnly ? 'cursor-pointer hover:bg-white/80' : ''
                      }`}
                    >
                      {editingCell?.rowId === pub.id && editingCell?.field === 'salvamentos' ? (
                        <input
                          ref={inputRef as any}
                          type="number"
                          min="0"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => handleCommitEdit(pub)}
                          onKeyDown={(e) => handleKeyDown(e, pub, idx)}
                          className="w-16 px-1.5 py-0.5 text-xs text-right rounded-lg border border-[#C7A15F] bg-white focus:outline-none"
                        />
                      ) : (
                        <span>{pub.salvamentos !== null && pub.salvamentos !== undefined ? pub.salvamentos : '-'}</span>
                      )}
                    </td>

                    {/* 11. Visualizações */}
                    <td 
                      onClick={() => isVisualizacoesApplicable && handleStartEdit(pub, 'visualizacoes')}
                      className={`py-2.5 px-2.5 text-right font-mono font-medium ${
                        !readOnly && isVisualizacoesApplicable ? 'cursor-pointer hover:bg-white/80' : ''
                      }`}
                    >
                      {!isVisualizacoesApplicable ? (
                        <span className="text-[#8F8271] select-none">-</span>
                      ) : editingCell?.rowId === pub.id && editingCell?.field === 'visualizacoes' ? (
                        <input
                          ref={inputRef as any}
                          type="number"
                          min="0"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => handleCommitEdit(pub)}
                          onKeyDown={(e) => handleKeyDown(e, pub, idx)}
                          className="w-20 px-1.5 py-0.5 text-xs text-right rounded-lg border border-[#C7A15F] bg-white focus:outline-none"
                        />
                      ) : (
                        <span>{pub.visualizacoes !== null && pub.visualizacoes !== undefined ? pub.visualizacoes : '-'}</span>
                      )}
                    </td>

                    {/* 12. Ações (se editável) */}
                    {!readOnly && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Deseja realmente excluir esta publicação?')) {
                              onDeletePublicacao?.(pub.id);
                            }
                          }}
                          className="p-1 rounded-lg text-[#8F8271] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir publicação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
