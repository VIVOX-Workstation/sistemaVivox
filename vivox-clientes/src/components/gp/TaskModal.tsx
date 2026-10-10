import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { 
  Tarefa, 
  StatusTarefa, 
  PrioridadeTarefa, 
  Cliente,
  Projeto 
} from '../../types';
import { tarefasApi, type UpdateTarefaPayload } from '../../api/tarefas';
import { api } from '../../api/client';
import { carregarOpcoesTarefa, type UserOption } from '../../api/opcoesTarefa';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  CheckSquare,
  Sparkles,
  Plus,
  Trash2,
  Send,
  Building2,
  Calendar,
  MessageSquare,
  Loader2,
  Flame,
  Save,
  Paperclip,
  FolderKanban,
  Timer,
  ExternalLink,
  Users,
  AlertTriangle,
  Lock
} from 'lucide-react';
import './TaskModal.css';
import { DEFAULT_COLUNAS } from './KanbanBoard';

const toDatetimeLocalValue = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface TaskModalProps {
  tarefaId: string | null;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  tarefaId,
  onClose,
  onTaskUpdated,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  // Campos da tarefa
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<StatusTarefa>('A_FAZER');
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('MEDIA');
  const [responsavelId, setResponsavelId] = useState<string>('');
  const [clienteId, setClienteId] = useState<string>('');
  const [projetoId, setProjetoId] = useState<string>('');
  const [servicoId, setServicoId] = useState<string>('');
  const [prazo, setPrazo] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState<string>('');
  const [horasGastas, setHorasGastas] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [novaTag, setNovaTag] = useState('');

  // Subtarefas e Comentários
  const [novoItemChecklist, setNovoItemChecklist] = useState('');
  const [novoComentario, setNovoComentario] = useState('');
  const [mensagemRespondida, setMensagemRespondida] = useState<any>(null);
  const [showChecklistSection, setShowChecklistSection] = useState(true);

  // Fecha modal com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Auxiliares
  const [usuarios, setUsuarios] = useState<UserOption[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [workspaces, setWorkspaces] = useState<Projeto[]>([]);
  const [servicosCliente, setServicosCliente] = useState<any[]>([]);
  const [observadorIds, setObservadorIds] = useState<string[]>([]);
  const [showObservadorPicker, setShowObservadorPicker] = useState(false);

  // Carrega os serviços do cliente selecionado
  const carregarServicosCliente = async (cId: string) => {
    if (!cId) {
      setServicosCliente([]);
      return;
    }
    try {
      const res = await api.get(`/servicos/cliente/${cId}`);
      setServicosCliente(res.data || []);
    } catch {
      setServicosCliente([]);
    }
  };

  const carregarTarefa = async (id: string) => {
    try {
      const data = await tarefasApi.getTarefaById(id);
      setTarefa(data);
      setTitulo(data.titulo || '');
      setDescricao(data.descricao || '');
      setStatus(data.status || 'A_FAZER');
      setPrioridade(data.prioridade || 'MEDIA');
      setResponsavelId(data.responsavelId || '');
      setClienteId(data.clienteId || '');
      setProjetoId(data.projetoId || '');
      setServicoId(data.servicoId || '');
      setPrazo(toDatetimeLocalValue(data.prazo));
      setHorasEstimadas(data.horasEstimadas ? String(data.horasEstimadas) : '');
      setHorasGastas(data.horasGastas ? String(data.horasGastas) : '');
      setTags(data.tags || []);
      setObservadorIds((data.observadores || []).map((o: any) => o.id));

      if (data.clienteId) {
        carregarServicosCliente(data.clienteId);
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes da tarefa:', err);
    } finally {
      setLoading(false);
    }
  };

  // Usuários, clientes e workspaces (cacheados) só alimentam os selects;
  // não devem bloquear a exibição da tarefa em si.
  useEffect(() => {
    let ativo = true;
    carregarOpcoesTarefa()
      .then((opcoes) => {
        if (!ativo) return;
        setUsuarios(opcoes.usuarios);
        setClientes(opcoes.clientes);
        setWorkspaces(opcoes.workspaces);
      })
      .catch((e) => console.error('Erro ao carregar selects:', e));
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!tarefaId) return;
    setLoading(true);
    carregarTarefa(tarefaId);
  }, [tarefaId]);

  const getEtapaLabel = (statusValue: string): string => {
    try {
      const storageKey = `vivox_kanban_columns_v3_${tarefa?.projetoId || 'default'}`;
      const saved = localStorage.getItem(storageKey);
      const colunas = saved ? JSON.parse(saved) : DEFAULT_COLUNAS;
      const encontrada = Array.isArray(colunas)
        ? colunas.find((c: any) => c.id === statusValue)
        : null;
      if (encontrada?.titulo) return encontrada.titulo;
    } catch {
      // ignora erro de parse e usa o rótulo padrão abaixo
    }
    const fallback: Record<string, string> = {
      BACKLOG: 'Backlog',
      A_FAZER: 'A Fazer',
      EM_ANDAMENTO: 'Em Andamento',
      EM_REVISAO: 'Em Revisão',
      CONCLUIDA: 'Concluída',
      CANCELADA: 'Cancelada',
    };
    return fallback[statusValue] || statusValue;
  };

  const handleSalvarCamposPrincipais = async () => {
    if (!tarefaId || !tarefa || saving) return;
    setSaving(true);
    const statusMudou = status !== tarefa.status;
    let camposSalvos = false;
    try {
      const campos: UpdateTarefaPayload = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        prioridade,
        responsavelId: responsavelId || undefined,
        clienteId: clienteId || undefined,
        projetoId: projetoId || undefined,
        servicoId: servicoId || undefined,
        ...(isAdmin && prazo !== toDatetimeLocalValue(tarefa.prazo)
          ? { prazo: prazo ? new Date(prazo).toISOString() : null }
          : {}),
        horasEstimadas: horasEstimadas ? Number(horasEstimadas) : undefined,
        horasGastas: horasGastas ? Number(horasGastas) : undefined,
        tags,
      };
      const alteracoes = Object.fromEntries(
        Object.entries(campos).filter(([campo, valor]) =>
          valor !== undefined && JSON.stringify(valor) !== JSON.stringify(tarefa[campo as keyof Tarefa])
        )
      ) as UpdateTarefaPayload;
      let versao = tarefa.versao;

      if (Object.keys(alteracoes).length > 0) {
        const atualizada = await tarefasApi.updateTarefa(tarefaId, { ...alteracoes, versao });
        versao = atualizada.versao;
        camposSalvos = true;
      }

      if (statusMudou) {
        // A API aplica as permissões e registra o evento da movimentação.
        await tarefasApi.updateTarefa(tarefaId, { status, versao });
      }
    } catch (err: any) {
      console.error('Erro ao salvar alterações da tarefa:', err);
      const message = err?.response?.data?.message;
      const mensagemApi = Array.isArray(message) ? message.join('\n') : message;
      const codigo = err?.response?.status;
      const fallback = codigo === 403
        ? 'Você não tem permissão para realizar esta alteração.'
        : codigo === 409
          ? 'Esta tarefa foi alterada por outra pessoa. Confira os dados atualizados e tente novamente.'
          : codigo === 400
            ? 'Não foi possível aplicar esta alteração. Confira os campos e a etapa selecionada.'
            : 'Não foi possível salvar as alterações. Tente novamente.';
      const contexto = camposSalvos && statusMudou
        ? 'Os campos foram salvos, mas a etapa não foi alterada.\n'
        : '';
      window.alert(contexto + (mensagemApi || fallback));
    } finally {
      // Recarrega também após falha parcial ou conflito, incluindo a nova versão.
      await carregarTarefa(tarefaId);
      onTaskUpdated();
      setSaving(false);
    }
  };

  const handleToggleObservador = async (userId: string) => {
    if (!tarefaId) return;
    const novaLista = observadorIds.includes(userId)
      ? observadorIds.filter((id) => id !== userId)
      : [...observadorIds, userId];
    const listaAnterior = observadorIds;
    setObservadorIds(novaLista);
    try {
      await tarefasApi.setObservadores(tarefaId, novaLista);
    } catch (err) {
      console.error('Erro ao atualizar observadores:', err);
      setObservadorIds(listaAnterior);
    }
  };

  const handleToggleChecklist = async (itemId: string, concluidoAtual: boolean) => {
    if (!tarefaId) return;
    try {
      await tarefasApi.updateChecklistItem(itemId, { concluido: !concluidoAtual });
      await carregarTarefa(tarefaId);
      onTaskUpdated();
    } catch (err) {
      console.error('Erro ao alternar item do checklist:', err);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarefaId || !novoItemChecklist.trim()) return;

    try {
      await tarefasApi.addChecklistItem(tarefaId, novoItemChecklist.trim());
      setNovoItemChecklist('');
      await carregarTarefa(tarefaId);
      onTaskUpdated();
    } catch (err) {
      console.error('Erro ao adicionar subtarefa:', err);
    }
  };

  const handleRemoveChecklistItem = async (itemId: string) => {
    if (!tarefaId) return;
    try {
      await tarefasApi.removeChecklistItem(itemId);
      await carregarTarefa(tarefaId);
      onTaskUpdated();
    } catch (err) {
      console.error('Erro ao remover item:', err);
    }
  };

  const handleGerarChecklistIa = async () => {
    if (!tarefaId || !titulo.trim()) return;
    setLoadingAi(true);
    try {
      const sugestoes = await tarefasApi.gerarChecklistIa({
        titulo,
        descricao,
        clienteId: clienteId || undefined,
      });

      for (const itemTitulo of sugestoes) {
        await tarefasApi.addChecklistItem(tarefaId, itemTitulo);
      }

      await carregarTarefa(tarefaId);
      onTaskUpdated();
    } catch (err) {
      console.error('Erro ao gerar subtarefas com IA:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tarefaId) return;

    setUploadingFile(true);
    try {
      await tarefasApi.uploadAnexo(tarefaId, file);
      await carregarTarefa(tarefaId);
      onTaskUpdated();
    } catch (err) {
      console.error('Erro ao enviar anexo:', err);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderTextoComLinks = (texto: string) => {
    const lines = texto.split('\n');

    return lines.map((line, lineIdx) => {
      const isQuoteStrict = line.startsWith('>');
      const content = isQuoteStrict ? line.replace(/^>\s?/, '') : line;

      // Quebra por links markdown [Nome](url) e URLs soltas https:// ou http://
      const tokens = content.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s]+)/g);

      const renderedTokens = tokens.map((token, i) => {
        const checkMedia = (url: string, label: string, isRaw: boolean = false) => {
          const lowerUrl = url.toLowerCase();
          const urlWithoutQuery = lowerUrl.split('?')[0];
          const isImage = urlWithoutQuery.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/);
          const isVideo = urlWithoutQuery.match(/\.(mp4|webm|ogg|mov)$/);

          if (isImage) {
            return (
              <div key={i} className="my-2 inline-block w-full">
                <a href={url} target="_blank" rel="noopener noreferrer" className="block w-max max-w-full rounded-lg overflow-hidden border border-[#DED7CC] shadow-sm hover:opacity-90 transition-opacity">
                  <img src={url} alt={label} className="w-full h-auto max-h-64 object-contain bg-[#211C16]/5" />
                </a>
                {!isRaw && (
                  <div className="text-[12px] text-[#847663] mt-1 flex items-center gap-1">
                    <span>📎</span> {label}
                  </div>
                )}
              </div>
            );
          }

          if (isVideo) {
            return (
              <div key={i} className="my-2 inline-block w-full">
                <video controls className="w-full max-w-sm max-h-64 rounded-lg border border-[#DED7CC] shadow-sm bg-[#211C16]/5">
                  <source src={url} />
                  Seu navegador não suporta vídeos.
                </video>
                <div className="text-[12px] text-[#847663] mt-1 flex items-center gap-1">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                    <span>📎</span> {isRaw ? 'Video Link' : label} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          }

          return null;
        };

        const mdMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
        if (mdMatch) {
          const [, label, url] = mdMatch;
          const mediaRender = checkMedia(url, label);
          if (mediaRender) return mediaRender;

          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#2563EB] hover:text-[#1D4ED8] underline font-bold bg-[#3B82F6]/10 px-2 py-0.5 rounded-lg my-0.5 transition-colors"
            >
              <span>📎</span>
              <span>{label}</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          );
        }

        if (token.match(/^https?:\/\//)) {
          const mediaRender = checkMedia(token, token, true);
          if (mediaRender) return mediaRender;

          return (
            <a
              key={i}
              href={token}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:text-[#1D4ED8] underline font-semibold break-all inline-flex items-center gap-0.5"
            >
              {token}
              <ExternalLink className="w-3 h-3 inline shrink-0" />
            </a>
          );
        }

        return <span key={i}>{token}</span>;
      });

      if (isQuoteStrict) {
        return (
          <div key={lineIdx} className="border-l-2 border-[#C7A15F] pl-2 my-0.5 text-[#847663] bg-[#C7A15F]/5 py-1 pr-2 rounded-r-md italic">
            {renderedTokens}
          </div>
        );
      }

      return (
        <React.Fragment key={lineIdx}>
          {renderedTokens}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const handleAddComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarefaId || !novoComentario.trim()) return;

    let textoFinal = novoComentario.trim();
    if (mensagemRespondida) {
      const citacao = mensagemRespondida.texto.split('\n').map((l: string) => `> ${l}`).join('\n');
      textoFinal = `> **${mensagemRespondida.autor?.nome || 'Usuário'}** escreveu:\n${citacao}\n\n${textoFinal}`;
    }

    try {
      await tarefasApi.addComentario(tarefaId, textoFinal);
      setNovoComentario('');
      setMensagemRespondida(null);
      await carregarTarefa(tarefaId);
      onTaskUpdated();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && novaTag.trim()) {
      e.preventDefault();
      const limpa = novaTag.trim().replace(/^#/, '');
      if (!tags.includes(limpa)) {
        setTags([...tags, limpa]);
      }
      setNovaTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleDeleteTarefa = async () => {
    if (!tarefaId) return;
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa permanentemente?')) return;
    try {
      await tarefasApi.deleteTarefa(tarefaId);
      onTaskUpdated();
      onClose();
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
    }
  };

  if (!tarefaId) return null;

  const checklistTotal = tarefa?.checklist?.length || 0;
  const checklistConcluidos = tarefa?.checklist?.filter((c) => c.concluido).length || 0;
  const checklistPercent = checklistTotal > 0 ? Math.round((checklistConcluidos / checklistTotal) * 100) : 0;

  const atrasoInfo = (() => {
    if (!prazo || status === 'CONCLUIDA' || status === 'CANCELADA') return null;
    const prazoDate = new Date(prazo);
    const agora = new Date();
    const diffMs = agora.getTime() - prazoDate.getTime();
    if (diffMs <= 0) return null;
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHoras < 24) {
      const horas = diffHoras || 1;
      return { texto: `Atrasado ${horas} hora${horas === 1 ? '' : 's'}` };
    }
    const diffDias = Math.floor(diffHoras / 24);
    return { texto: `Atrasado ${diffDias} dia${diffDias === 1 ? '' : 's'}` };
  })();

  return createPortal(
    <div className="task-detail-overlay fixed inset-0 z-50 flex items-center justify-center bg-[#17130F]/60 backdrop-blur-xs">
      {/* Drawer / Modal Estilo Bitrix24 com Cores do Sistema Vivox */}
      <div role="dialog" aria-modal="true" aria-label="Detalhes da tarefa" className="task-detail-dialog bg-[#FFFDF8] border border-[#DED7CC] shadow-2xl flex flex-col overflow-hidden">
        {/* Barra Superior de Fechamento */}
        <div className="task-detail-topbar px-6 py-4 bg-[#FFFDF8] border-b border-[#E7E1D7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#847663]">
            <span className="w-2 h-2 rounded-full bg-[#C7A15F]" />
            <span className="text-[#1E1A16]">Vivox GP / Detalhes da tarefa</span>
            {tarefa?.id && (
              <span className="font-mono text-[12.5px] text-[#847663] bg-[#F2EEE7] px-1.5 py-0.2 rounded">
                #{tarefa.id.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSalvarCamposPrincipais}
              disabled={saving || loading || !tarefa || !titulo.trim()}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#C7A15F] hover:bg-[#B89455] text-[#1D160B] flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Alterações
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#847663] hover:text-[#1E1A16] hover:bg-[#F2EEE7] transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo Dividido em 2 Painéis */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#847663]">
            <Loader2 className="w-8 h-8 animate-spin text-[#847663]" />
            <span className="text-xs font-medium">Carregando detalhes da tarefa...</span>
          </div>
        ) : (
          <div className="task-detail-body">
            {/* ======================================================== */}
            {/* PAINEL ESQUERDO: DETALHES & PROPRIEDADES (6 cols)        */}
            {/* ======================================================== */}
            <div className="task-detail-main">
              <div className="task-detail-summary">
                <span className="task-detail-status" data-status={status}>
                  <span />{getEtapaLabel(status)}
                </span>
                <span className="text-xs text-[#625746] flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  {checklistConcluidos} de {checklistTotal} itens concluídos
                </span>
              </div>
              {/* Título da Tarefa em Destaque - Topo Esquerdo, estilo Bitrix */}
              <div className="flex items-start justify-between gap-3 pb-1">
                <textarea
                  aria-label="Título da tarefa"
                  rows={2}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  placeholder="Nome da Tarefa..."
                  className="flex-1 resize-none text-xl md:text-2xl font-extrabold text-[#1E1A16] placeholder:text-[#847663]/50 placeholder:font-semibold outline-none bg-transparent border-b border-transparent focus:border-[#C7A15F] leading-snug transition-all"
                />

                <button
                  type="button"
                  onClick={() => setPrioridade(prioridade === 'URGENTE' ? 'MEDIA' : 'URGENTE')}
                  title={prioridade === 'URGENTE' ? 'Tarefa marcada como urgente' : 'Marcar como urgente'}
                  className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    prioridade === 'URGENTE'
                      ? 'bg-[#B83B32]/15 text-[#B83B32] border-[#B83B32]/40 shadow-xs ring-1 ring-[#B83B32]/30'
                      : 'text-[#847663] hover:text-[#B83B32] hover:bg-[#B83B32]/10 border-transparent'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                </button>
              </div>

              {/* Card de Descrição & Barra de Ações */}
              <div className="task-detail-description bg-[#FAF8F4] border border-[#DED7CC] rounded-2xl p-3.5 flex flex-col gap-2">
                <label htmlFor="task-description" className="text-sm font-semibold text-[#1E1A16]">Descrição</label>
                <textarea
                  id="task-description"
                  rows={4}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição, instruções e links para esta tarefa..."
                  className="w-full text-xs text-[#1E1A16] bg-transparent outline-none resize-y placeholder:text-[#847663]/60 leading-relaxed"
                />

                {/* Toolbar de Ações Bitrix (Anexos, CoPilot, Checklist) */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E7E1D7] text-[#847663] text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Anexar arquivo"
                      className="p-1 hover:text-[#1E1A16] hover:bg-[#F2EEE7] rounded transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>



                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGerarChecklistIa}
                      disabled={loadingAi}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#625746] hover:text-[#1E1A16] bg-[#F2EEE7] hover:bg-[#EAE3D8] px-2.5 py-1 rounded-lg border border-[#DED7CC] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loadingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#847663]" />}
                      Gerar checklist com IA
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowChecklistSection(!showChecklistSection)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#4A4032] hover:text-[#1E1A16] bg-[#F2EEE7] hover:bg-[#EAE3D8] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-[#847663]" />
                      Checklist ({checklistConcluidos}/{checklistTotal})
                    </button>
                  </div>
                </div>
              </div>

              {/* Seção de Checklist / Subtarefas */}
              {showChecklistSection && (
                <div className="bg-[#FAF8F4] border border-[#DED7CC] rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#847663]" />
                      <h4 className="text-xs font-bold text-[#1E1A16]">
                        Lista de Verificação
                      </h4>
                      <span className="text-[12.5px] font-bold text-[#625746] bg-[#F2EEE7] px-2 py-0.5 rounded-full">
                        {checklistConcluidos}/{checklistTotal}
                      </span>
                    </div>

                    {checklistTotal > 0 && (
                      <span className="text-xs font-bold text-[#625746]">
                        {checklistPercent}%
                      </span>
                    )}
                  </div>

                  {/* Barra de Progresso */}
                  {checklistTotal > 0 && (
                    <div className="w-full bg-[#F2EEE7] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#16A34A] h-full rounded-full transition-all duration-300"
                        style={{ width: `${checklistPercent}%` }}
                      />
                    </div>
                  )}

                  {/* Itens */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {tarefa?.checklist?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 p-2 bg-[#FFFDF8] border border-[#E7E1D7] rounded-xl hover:border-[#DED7CC] transition-all group shadow-2xs"
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                          <input
                            type="checkbox"
                            checked={item.concluido}
                            onChange={() => handleToggleChecklist(item.id, item.concluido)}
                            className="w-4 h-4 rounded text-[#15803D] accent-[#15803D] cursor-pointer"
                          />
                          <span
                            className={`text-xs ${
                              item.concluido ? 'line-through text-[#847663]' : 'text-[#1E1A16] font-medium'
                            }`}
                          >
                            {item.titulo}
                          </span>
                        </label>
                        <button
                          onClick={() => handleRemoveChecklistItem(item.id)}
                          className="opacity-50 group-hover:opacity-100 p-1 text-[#847663] hover:text-[#B83B32] transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Input Adicionar Item */}
                  <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                    <input
                      type="text"
                      value={novoItemChecklist}
                      onChange={(e) => setNovoItemChecklist(e.target.value)}
                      placeholder="Adicionar novo item..."
                      className="flex-1 text-xs bg-[#FFFDF8] border border-[#E7E1D7] rounded-xl px-3 py-2 outline-none focus:border-[#C7A15F]"
                    />
                    <button
                      type="submit"
                      disabled={!novoItemChecklist.trim()}
                      className="px-3 py-2 bg-[#302921] text-[#FFFDF8] rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-[#211C16] transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </form>
                </div>
              )}

              {/* Cabeçalho: ID, Criado, Proprietário, Responsável, Prazo, Status e Observadores */}
              <div className="bg-[#FAF8F4] border border-[#DED7CC] rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#E7E1D7]">
                  <span className="font-mono text-[12.5px] text-[#847663] bg-[#F2EEE7] px-2 py-0.5 rounded">
                    ID: #{tarefa?.id ? tarefa.id.slice(0, 8).toUpperCase() : '—'}
                  </span>
                  <span className="text-[12px] text-[#847663]">
                    Criado: {tarefa?.createdAt
                      ? new Date(tarefa.createdAt).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                </div>

                {/* Proprietário da Tarefa (Criador) */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#625746] font-medium w-36">
                    Proprietário da tarefa:
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#302921] text-[#FFFDF8] border border-[#DED7CC] flex items-center justify-center text-[12px] font-bold shadow-2xs">
                      {tarefa?.autor?.nome?.slice(0, 2).toUpperCase() || 'VK'}
                    </div>
                    <span className="font-semibold text-[#1E1A16]">
                      {tarefa?.autor?.nome || 'Administrador'}
                    </span>
                  </div>
                </div>

                {/* Responsável */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#625746] font-medium w-36">
                    Responsável:
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <select
                      value={responsavelId}
                      onChange={(e) => setResponsavelId(e.target.value)}
                      className="flex-1 text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#DED7CC] rounded-xl outline-none focus:border-[#C7A15F] font-semibold text-[#1E1A16]"
                    >
                      <option value="">Não atribuído</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nome} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Prazo */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#625746] font-medium w-36 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#847663]" />
                    Prazo:
                  </span>
                  <div className="flex-1">
                    <input
                      type="datetime-local"
                      value={prazo}
                      onChange={(e) => setPrazo(e.target.value)}
                      disabled={!isAdmin}
                      title={isAdmin ? undefined : 'Apenas administradores podem alterar o prazo'}
                      className="w-full text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#DED7CC] rounded-xl outline-none focus:border-[#C7A15F] text-[#1E1A16] font-semibold disabled:bg-[#F2EEE7] disabled:text-[#847663] disabled:cursor-not-allowed"
                    />
                    {!isAdmin && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#847663] mt-1">
                        <Lock className="w-3 h-3" />
                        Somente administradores podem alterar o prazo
                      </span>
                    )}
                  </div>
                </div>
                {atrasoInfo && (
                  <div className="flex items-center justify-end -mt-2">
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#B83B32] bg-[#B83B32]/10 border border-[#B83B32]/30 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      {atrasoInfo.texto}
                    </span>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#625746] font-medium w-36">
                    Status:
                  </span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusTarefa)}
                    className="flex-1 text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#DED7CC] rounded-xl outline-none focus:border-[#C7A15F] font-bold text-[#1E1A16]"
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="A_FAZER">A Fazer</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="EM_REVISAO">Em Revisão</option>
                    <option value="CONCLUIDA">Concluída</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>

                {/* Observadores */}
                <div className="flex items-center justify-between text-xs relative">
                  <span className="text-[#625746] font-medium w-36 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#847663]" />
                    Observadores:
                  </span>
                  <div className="flex-1 flex items-center flex-wrap gap-1.5">
                    {observadorIds.length === 0 && (
                      <span className="text-[#847663] text-[12.5px]">Nenhum</span>
                    )}
                    {observadorIds.map((id) => {
                      const u = usuarios.find((us) => us.id === id);
                      if (!u) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F2EEE7] text-[#4A4032] border border-[#DED7CC] rounded-lg text-[12.5px] font-semibold"
                        >
                          {u.nome}
                          <button
                            type="button"
                            onClick={() => handleToggleObservador(id)}
                            className="hover:text-[#B83B32] font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setShowObservadorPicker((v) => !v)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFFDF8] border border-dashed border-[#DED7CC] hover:border-[#C7A15F] text-[#847663] hover:text-[#1E1A16] rounded-lg text-[12.5px] font-semibold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Adicionar
                    </button>

                    {showObservadorPicker && (
                      <div className="absolute right-0 top-6 z-20 w-56 max-h-56 overflow-y-auto bg-[#FFFDF8] border border-[#DED7CC] rounded-xl shadow-lg p-2 space-y-1">
                        {usuarios.map((u) => (
                          <label
                            key={u.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F2EEE7] cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={observadorIds.includes(u.id)}
                              onChange={() => handleToggleObservador(u.id)}
                              className="w-3.5 h-3.5 accent-[#C7A15F]"
                            />
                            <span className="text-[#1E1A16]">{u.nome}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Workspace, Cliente, Status e Horas */}
              <div className="bg-[#FAF8F4] border border-[#DED7CC] rounded-2xl p-4 space-y-3.5">
                {/* Projeto / Workspace */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#625746] font-medium w-36 flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5 text-[#847663]" />
                    Projeto / Workspace:
                  </span>
                  <select
                    value={projetoId}
                    onChange={(e) => setProjetoId(e.target.value)}
                    className="flex-1 text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#DED7CC] rounded-xl outline-none focus:border-[#C7A15F] font-bold text-[#625746]"
                  >
                    <option value="">Nenhum (Workspace Geral)</option>
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.icone || '📁'} {ws.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cliente */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#625746] font-medium w-36 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#847663]" />
                    Cliente:
                  </span>
                  <select
                    value={clienteId}
                    onChange={(e) => {
                      const newCId = e.target.value;
                      setClienteId(newCId);
                      setServicoId('');
                      carregarServicosCliente(newCId);
                    }}
                    className="flex-1 text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#DED7CC] rounded-xl outline-none focus:border-[#C7A15F] font-medium text-[#1E1A16]"
                  >
                    <option value="">Nenhum cliente vinculado</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nomeFantasia}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Serviço Contratado do Cliente */}
                {clienteId && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#625746] font-medium w-36 flex items-center gap-1">
                      <FolderKanban className="w-3.5 h-3.5 text-[#847663]" />
                      Serviço do Contrato:
                    </span>
                    <select
                      value={servicoId}
                      onChange={(e) => setServicoId(e.target.value)}
                      className="flex-1 text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#DED7CC] rounded-xl outline-none focus:border-[#C7A15F] font-semibold text-[#1E1A16]"
                    >
                      <option value="">Nenhum (Demanda Avulsa / Geral)</option>
                      {servicosCliente.map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.tipoServico?.replace(/_/g, ' ')} ({srv.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Horas Estimadas vs Gastas */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#625746] font-medium w-36 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-[#847663]" />
                    Horas (Est / Gastas):
                  </span>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.5"
                      value={horasEstimadas}
                      onChange={(e) => setHorasEstimadas(e.target.value)}
                      placeholder="Estimado (h)"
                      className="text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#DED7CC] rounded-xl outline-none focus:border-[#C7A15F]"
                    />
                    <input
                      type="number"
                      step="0.5"
                      value={horasGastas}
                      onChange={(e) => setHorasGastas(e.target.value)}
                      placeholder="Gasto (h)"
                      className="text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#DED7CC] rounded-xl outline-none focus:border-[#C7A15F]"
                    />
                  </div>
                </div>
              </div>

              {/* Tags / Marcadores */}
              <div className="bg-[#FAF8F4] border border-[#DED7CC] rounded-2xl p-4">
                <label className="text-[12.5px] font-bold text-[#847663] uppercase tracking-wider block mb-1.5">
                  Marcadores
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F2EEE7] text-[#4A4032] border border-[#DED7CC] rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-[#B83B32] font-bold ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={novaTag}
                  onChange={(e) => setNovaTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Adicionar marcador e pressionar Enter..."
                  className="w-full text-xs py-1.5 px-3 bg-[#FFFDF8] border border-[#DED7CC] rounded-xl outline-none focus:border-[#C7A15F]"
                />
              </div>

              {/* Botões do Rodapé Esquerdo */}
              <div className="task-detail-footer pt-3 border-t border-[#E7E1D7] flex items-center justify-between gap-3 mt-auto">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSalvarCamposPrincipais}
                    disabled={saving || loading || !tarefa || !titulo.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C7A15F] hover:bg-[#B89455] text-[#1D160B] flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Salvar Alterações
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#625746] hover:bg-[#F2EEE7] transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteTarefa}
                  className="p-2 text-[#B83B32] hover:bg-[#B83B32]/10 border border-[#B83B32]/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="Excluir tarefa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PAINEL DIREITO: BATE-PAPO DA TAREFA                      */}
            {/* ======================================================== */}
            <div className="task-detail-chat bg-[#FAF8F4] flex flex-col overflow-hidden">
              {/* Header do Bate-Papo */}
              <div className="px-6 py-3.5 bg-[#FFFDF8] border-b border-[#E7E1D7] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#F2EEE7] text-[#625746] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1E1A16] leading-tight">
                      Conversa da tarefa
                    </h3>
                    <span className="text-[12px] text-[#847663]">
                      {tarefa?.comentarios?.length || 0} registros na conversa
                    </span>
                  </div>
                </div>
              </div>

              {/* Feed de Mensagens / Comentários */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {(!tarefa?.comentarios || tarefa.comentarios.length === 0) ? (
                  /* Banner Vazio com Cores Vivox */
                  <div className="h-full min-h-48 flex flex-col items-center justify-center text-center px-5 py-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#F2EEE7] text-[#625746] flex items-center justify-center mb-4">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-[#1E1A16]">Tudo sobre a tarefa, por aqui</h4>
                    <p className="text-xs text-[#847663] leading-relaxed max-w-64 mt-2">
                      Compartilhe uma atualização, tire dúvidas ou anexe arquivos para manter a equipe alinhada.
                    </p>
                  </div>
                ) : (
                  (() => {
                    let lastDateKey = '';
                    const nodes: React.ReactNode[] = [];

                    tarefa.comentarios.forEach((com) => {
                      const dataObj = new Date(com.createdAt);
                      const dateKey = dataObj.toDateString();

                      if (dateKey !== lastDateKey) {
                        lastDateKey = dateKey;
                        const rotulo = dataObj.toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                        });

                        nodes.push(
                          <div
                            key={`data-${dateKey}`}
                            className="sticky top-0 z-10 flex justify-center py-1.5 pointer-events-none"
                          >
                            <span className="pointer-events-auto text-[12px] font-bold text-[#FFFDF8] bg-[#4A4032]/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm capitalize">
                              {rotulo}
                            </span>
                          </div>
                        );
                      }

                      if (com.sistema) {
                        nodes.push(
                          <div key={com.id} className="flex justify-center py-1">
                            <span className="text-[12px] text-[#847663] bg-[#F2EEE7] border border-[#E7E1D7] px-3 py-1 rounded-full text-center">
                              <span className="font-semibold text-[#4A4032]">
                                {com.autor?.nome || 'Alguém'}
                              </span>{' '}
                              {com.texto}
                              {' · '}
                              {dataObj.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        );
                        return;
                      }

                      nodes.push(
                        <div key={com.id} className="flex items-start gap-2.5">
                          {/* Avatar do Autor */}
                          <div
                            title={com.autor?.nome || 'Usuário'}
                            className="w-8 h-8 rounded-full bg-[#EAE3D8] text-[#847663] border-2 border-white shadow-2xs flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5"
                          >
                            {com.autor?.nome ? com.autor.nome.slice(0, 2).toUpperCase() : 'US'}
                          </div>

                          {/* Balão da Mensagem */}
                          <div className="bg-[#FFFDF8] border border-[#DED7CC] rounded-2xl p-3.5 shadow-2xs flex flex-col gap-1 flex-1 max-w-[88%] group relative">
                            <div className="flex items-center justify-between text-[12px] text-[#847663]">
                              <span className="font-bold text-[#1E1A16]">
                                {com.autor?.nome || 'Usuário'}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setMensagemRespondida(com)}
                                  className="opacity-70 group-hover:opacity-100 focus-visible:opacity-100 text-[#847663] hover:text-[#B89455] transition-opacity cursor-pointer font-semibold"
                                >
                                  Responder
                                </button>
                                <span>
                                  {dataObj.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-[#4A4032] leading-relaxed whitespace-pre-wrap mt-0.5">
                              {renderTextoComLinks(com.texto)}
                            </div>
                          </div>
                        </div>
                      );
                    });

                    return nodes;
                  })()
                )}
              </div>

              {/* Barra de Envio de Mensagem com Botão de Anexo */}
              <div className="p-4 bg-[#FFFDF8] border-t border-[#E7E1D7] shrink-0 flex flex-col gap-2">
                {/* Preview de Resposta */}
                {mensagemRespondida && (
                  <div className="bg-[#FAF8F4] border border-[#DED7CC] rounded-xl p-2.5 flex items-start justify-between gap-2">
                    <div className="flex-1 overflow-hidden">
                      <div className="text-[12px] font-bold text-[#847663] mb-0.5">
                        Respondendo a {mensagemRespondida.autor?.nome || 'Usuário'}
                      </div>
                      <div className="text-xs text-[#847663] truncate">
                        {mensagemRespondida.texto}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMensagemRespondida(null)}
                      className="text-[#847663] hover:text-[#B83B32] p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleAddComentario} className="flex items-center gap-2">
                  {/* Botão de Anexar Arquivo */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    title="Anexar arquivo ou imagem"
                    className="w-10 h-10 rounded-2xl bg-[#FAF8F4] border border-[#DED7CC] hover:border-[#1E1A16] text-[#847663] hover:text-[#1E1A16] flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#847663]" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div className="flex-1 bg-[#FAF8F4] border border-[#DED7CC] focus-within:border-[#C7A15F] focus-within:bg-[#FFFDF8] rounded-2xl px-3.5 py-2 flex items-center gap-2 transition-all">
                    <input
                      type="text"
                      value={novoComentario}
                      onChange={(e) => setNovoComentario(e.target.value)}
                      aria-label="Mensagem para a equipe"
                      placeholder="Escreva uma mensagem..."
                      className="flex-1 text-xs bg-transparent outline-none text-[#1E1A16] placeholder:text-[#847663]/60"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!novoComentario.trim()}
                    className="w-10 h-10 rounded-2xl bg-[#C7A15F] hover:bg-[#B89455] text-[#1D160B] flex items-center justify-center shadow-xs transition-all disabled:opacity-40 cursor-pointer shrink-0"
                    title="Enviar mensagem"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
