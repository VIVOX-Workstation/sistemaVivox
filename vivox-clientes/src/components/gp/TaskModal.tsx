import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { 
  Tarefa, 
  StatusTarefa, 
  PrioridadeTarefa, 
  Cliente,
  Projeto 
} from '../../types';
import { tarefasApi } from '../../api/tarefas';
import { api } from '../../api/client';
import { 
  X, 
  CheckSquare, 
  Sparkles, 
  Plus, 
  Trash2, 
  Send, 
  User as UserIcon, 
  Building2, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Loader2, 
  Flame, 
  Save,
  Paperclip,
  AtSign,
  List,
  ListOrdered,
  FolderKanban,
  Tag,
  CheckCircle2,
  Smile,
  Timer,
  ExternalLink
} from 'lucide-react';

interface UserOption {
  id: string;
  nome: string;
  email: string;
}

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
  const [showChecklistSection, setShowChecklistSection] = useState(true);

  // Auxiliares
  const [usuarios, setUsuarios] = useState<UserOption[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [workspaces, setWorkspaces] = useState<Projeto[]>([]);
  const [servicosCliente, setServicosCliente] = useState<any[]>([]);

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
      setPrazo(data.prazo ? data.prazo.split('T')[0] : '');
      setHorasEstimadas(data.horasEstimadas ? String(data.horasEstimadas) : '');
      setHorasGastas(data.horasGastas ? String(data.horasGastas) : '');
      setTags(data.tags || []);

      if (data.clienteId) {
        carregarServicosCliente(data.clienteId);
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes da tarefa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tarefaId) return;
    setLoading(true);

    const carregarTudo = async () => {
      try {
        const [usersRes, clientesRes, wsRes] = await Promise.all([
          api.get<UserOption[]>('/users').catch(() => ({ data: [] })),
          api.get<Cliente[]>('/clientes').catch(() => ({ data: [] })),
          tarefasApi.getProjetos().catch(() => []),
        ]);
        setUsuarios(usersRes.data || []);
        setClientes(clientesRes.data || []);
        setWorkspaces(wsRes || []);
      } catch (e) {
        console.error('Erro ao carregar selects:', e);
      }
      await carregarTarefa(tarefaId);
    };

    carregarTudo();
  }, [tarefaId]);

  const handleSalvarCamposPrincipais = async () => {
    if (!tarefaId) return;
    setSaving(true);
    try {
      await tarefasApi.updateTarefa(tarefaId, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        status,
        prioridade,
        responsavelId: responsavelId || undefined,
        clienteId: clienteId || undefined,
        projetoId: projetoId || undefined,
        servicoId: servicoId || undefined,
        prazo: prazo ? new Date(prazo).toISOString() : undefined,
        horasEstimadas: horasEstimadas ? Number(horasEstimadas) : undefined,
        horasGastas: horasGastas ? Number(horasGastas) : undefined,
        tags,
      });

      await carregarTarefa(tarefaId);
      onTaskUpdated();
    } catch (err) {
      console.error('Erro ao salvar alterações da tarefa:', err);
    } finally {
      setSaving(false);
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
    // Quebra por links markdown [Nome](url) e URLs soltas https:// ou http://
    const tokens = texto.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s]+)/g);

    return tokens.map((token, i) => {
      const mdMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (mdMatch) {
        const [, label, url] = mdMatch;
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
  };

  const handleAddComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarefaId || !novoComentario.trim()) return;

    try {
      await tarefasApi.addComentario(tarefaId, novoComentario.trim());
      setNovoComentario('');
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0E0D0B]/60 backdrop-blur-xs transition-opacity duration-300">
      {/* Drawer / Modal Estilo Bitrix24 com Cores do Sistema Vivox */}
      <div className="w-full max-w-[96vw] h-[92vh] max-h-[94vh] bg-[#FFFDF8] rounded-t-3xl border-t border-x border-[#D8CBB8] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out">
        {/* Barra Superior de Fechamento */}
        <div className="px-6 py-2.5 bg-[#F6F0E7] border-b border-[#E5D9C8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8F8271]">
            <span className="w-2 h-2 rounded-full bg-[#C7A15F]" />
            <span className="text-[#1E1A16]">Ficha da Tarefa • Vivox GP</span>
            {tarefa?.id && (
              <span className="font-mono text-[11px] text-[#8F8271] bg-[#EEE7DC] px-1.5 py-0.2 rounded">
                #{tarefa.id.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSalvarCamposPrincipais}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#C7A15F] hover:bg-[#B89455] text-[#1D160B] flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Alterações
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#EEE7DC] transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo Dividido em 2 Painéis */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#8F8271]">
            <Loader2 className="w-8 h-8 animate-spin text-[#C7A15F]" />
            <span className="text-xs font-medium">Carregando detalhes da tarefa...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E5D9C8]">
            {/* ======================================================== */}
            {/* PAINEL ESQUERDO: DETALHES & PROPRIEDADES (6 cols)        */}
            {/* ======================================================== */}
            <div className="lg:col-span-6 xl:col-span-6 p-6 overflow-y-auto bg-[#FFFDF8] flex flex-col gap-4">
              {/* Título da Tarefa & Botão Urgente */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Nome da Tarefa..."
                  className="flex-1 text-xl font-bold text-[#1E1A16] placeholder:text-[#8F8271]/50 outline-none border-b border-transparent focus:border-[#C7A15F] py-1 transition-all"
                />

                <button
                  type="button"
                  onClick={() => setPrioridade(prioridade === 'URGENTE' ? 'MEDIA' : 'URGENTE')}
                  title={prioridade === 'URGENTE' ? 'Tarefa marcada como urgente' : 'Marcar como urgente'}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    prioridade === 'URGENTE'
                      ? 'bg-[#B83B32]/15 text-[#B83B32] border-[#B83B32]/40 shadow-xs ring-1 ring-[#B83B32]/30'
                      : 'text-[#8F8271] hover:text-[#B83B32] hover:bg-[#B83B32]/10 border-transparent'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                </button>
              </div>

              {/* Card de Descrição & Barra de Ações */}
              <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-3.5 flex flex-col gap-2 shadow-2xs">
                <textarea
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição, instruções e links para esta tarefa..."
                  className="w-full text-xs text-[#1E1A16] bg-transparent outline-none resize-y placeholder:text-[#8F8271]/60 leading-relaxed"
                />

                {/* Toolbar de Ações Bitrix (Anexos, CoPilot, Checklist) */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E5D9C8] text-[#8F8271] text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Anexar arquivo"
                      className="p-1 hover:text-[#1E1A16] hover:bg-[#EEE7DC] rounded transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Mencionar pessoa"
                      className="p-1 hover:text-[#1E1A16] hover:bg-[#EEE7DC] rounded transition-colors"
                    >
                      <AtSign className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Lista de marcadores"
                      className="p-1 hover:text-[#1E1A16] hover:bg-[#EEE7DC] rounded transition-colors"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Lista numerada"
                      className="p-1 hover:text-[#1E1A16] hover:bg-[#EEE7DC] rounded transition-colors"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGerarChecklistIa}
                      disabled={loadingAi}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#8F6F2D] hover:text-[#1E1A16] bg-[#C7A15F]/20 hover:bg-[#C7A15F]/30 px-2.5 py-1 rounded-lg border border-[#C7A15F]/40 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loadingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#C7A15F]" />}
                      CoPilot IA
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowChecklistSection(!showChecklistSection)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#4A4032] hover:text-[#1E1A16] bg-[#EEE7DC] hover:bg-[#EADFCF] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-[#C7A15F]" />
                      Lista de Verificação ({checklistConcluidos}/{checklistTotal})
                    </button>
                  </div>
                </div>
              </div>

              {/* Seção de Checklist / Subtarefas */}
              {showChecklistSection && (
                <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#C7A15F]" />
                      <h4 className="text-xs font-bold text-[#1E1A16]">
                        Lista de Verificação
                      </h4>
                      <span className="text-[11px] font-bold text-[#8F6F2D] bg-[#C7A15F]/20 px-2 py-0.5 rounded-full">
                        {checklistConcluidos}/{checklistTotal}
                      </span>
                    </div>

                    {checklistTotal > 0 && (
                      <span className="text-xs font-bold text-[#8F6F2D]">
                        {checklistPercent}%
                      </span>
                    )}
                  </div>

                  {/* Barra de Progresso */}
                  {checklistTotal > 0 && (
                    <div className="w-full bg-[#EEE7DC] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#C7A15F] h-full rounded-full transition-all duration-300"
                        style={{ width: `${checklistPercent}%` }}
                      />
                    </div>
                  )}

                  {/* Itens */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {tarefa?.checklist?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 p-2 bg-[#FFFDF8] border border-[#E5D9C8] rounded-xl hover:border-[#D8CBB8] transition-all group shadow-2xs"
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                          <input
                            type="checkbox"
                            checked={item.concluido}
                            onChange={() => handleToggleChecklist(item.id, item.concluido)}
                            className="w-4 h-4 rounded text-[#C7A15F] accent-[#C7A15F] cursor-pointer"
                          />
                          <span
                            className={`text-xs ${
                              item.concluido ? 'line-through text-[#8F8271]' : 'text-[#1E1A16] font-medium'
                            }`}
                          >
                            {item.titulo}
                          </span>
                        </label>
                        <button
                          onClick={() => handleRemoveChecklistItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#8F8271] hover:text-[#B83B32] transition-opacity"
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
                      className="flex-1 text-xs bg-[#FFFDF8] border border-[#E5D9C8] rounded-xl px-3 py-2 outline-none focus:border-[#C7A15F]"
                    />
                    <button
                      type="submit"
                      disabled={!novoItemChecklist.trim()}
                      className="px-3 py-2 bg-[#24201A] text-[#C7A15F] rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-[#14120E] transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </form>
                </div>
              )}

              {/* Card 1: Proprietário, Responsável e Prazo */}
              <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-4 space-y-3.5">
                {/* Proprietário da Tarefa (Criador) */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#625746] font-medium w-36">
                    Proprietário da tarefa:
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#24201A] text-[#C7A15F] border border-[#C7A15F]/40 flex items-center justify-center text-[10px] font-bold shadow-2xs">
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
                      className="flex-1 text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F] font-semibold text-[#1E1A16]"
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
                    <Calendar className="w-3.5 h-3.5 text-[#C7A15F]" />
                    Prazo:
                  </span>
                  <div className="flex-1">
                    <input
                      type="date"
                      value={prazo}
                      onChange={(e) => setPrazo(e.target.value)}
                      className="w-full text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F] text-[#1E1A16] font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Workspace, Cliente, Status e Horas */}
              <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-4 space-y-3.5">
                {/* Projeto / Workspace */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#625746] font-medium w-36 flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5 text-[#C7A15F]" />
                    Projeto / Workspace:
                  </span>
                  <select
                    value={projetoId}
                    onChange={(e) => setProjetoId(e.target.value)}
                    className="flex-1 text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F] font-bold text-[#8F6F2D]"
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
                    <Building2 className="w-3.5 h-3.5 text-[#8F8271]" />
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
                    className="flex-1 text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F] font-medium text-[#1E1A16]"
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
                      <FolderKanban className="w-3.5 h-3.5 text-[#C7A15F]" />
                      Serviço do Contrato:
                    </span>
                    <select
                      value={servicoId}
                      onChange={(e) => setServicoId(e.target.value)}
                      className="flex-1 text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F] font-semibold text-[#1E1A16]"
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

                {/* Status da Tarefa */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#625746] font-medium w-36">
                    Coluna / Status:
                  </span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusTarefa)}
                    className="flex-1 text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F] font-bold text-[#1E1A16]"
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="A_FAZER">A Fazer</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="EM_REVISAO">Em Revisão</option>
                    <option value="CONCLUIDA">Concluída</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>

                {/* Horas Estimadas vs Gastas */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#625746] font-medium w-36 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-[#8F8271]" />
                    Horas (Est / Gastas):
                  </span>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.5"
                      value={horasEstimadas}
                      onChange={(e) => setHorasEstimadas(e.target.value)}
                      placeholder="Estimado (h)"
                      className="text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F]"
                    />
                    <input
                      type="number"
                      step="0.5"
                      value={horasGastas}
                      onChange={(e) => setHorasGastas(e.target.value)}
                      placeholder="Gasto (h)"
                      className="text-xs py-1.5 px-2.5 bg-[#FFFDF8] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F]"
                    />
                  </div>
                </div>
              </div>

              {/* Tags / Marcadores */}
              <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-4">
                <label className="text-[11px] font-bold text-[#8F8271] uppercase tracking-wider block mb-1.5">
                  # Marcadores & Tags (Pressione Enter)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#EEE7DC] text-[#4A4032] border border-[#D8CBB8] rounded-lg text-xs font-semibold shadow-2xs"
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
                  placeholder="Adicionar nova tag..."
                  className="w-full text-xs py-1.5 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F]"
                />
              </div>

              {/* Botões do Rodapé Esquerdo */}
              <div className="pt-3 border-t border-[#E5D9C8] flex items-center justify-between gap-3 mt-auto">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSalvarCamposPrincipais}
                    disabled={saving}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C7A15F] hover:bg-[#B89455] text-[#1D160B] flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Salvar Alterações
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#625746] hover:bg-[#EEE7DC] transition-all cursor-pointer"
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
            <div className="lg:col-span-6 xl:col-span-6 bg-[#FAF7F2] flex flex-col justify-between overflow-hidden">
              {/* Header do Bate-Papo */}
              <div className="px-6 py-3.5 bg-[#FFFDF8] border-b border-[#E5D9C8] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#C7A15F]/20 text-[#8F6F2D] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1E1A16] leading-tight">
                      Bate-papo da tarefa
                    </h3>
                    <span className="text-[10px] text-[#8F8271]">
                      {tarefa?.comentarios?.length || 0} mensagens registradas
                    </span>
                  </div>
                </div>
              </div>

              {/* Feed de Mensagens / Comentários */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {(!tarefa?.comentarios || tarefa.comentarios.length === 0) ? (
                  /* Banner Vazio com Cores Vivox */
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl p-6 shadow-sm max-w-sm flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#C7A15F]/20 text-[#8F6F2D] flex items-center justify-center text-xl shadow-inner">
                        💬
                      </div>
                      <h4 className="text-sm font-bold text-[#1E1A16]">
                        Bate-papo da tarefa
                      </h4>
                      <div className="text-left text-xs text-[#625746] space-y-2 pt-1 border-t border-[#E5D9C8] w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-[#C7A15F]">👥</span>
                          <span>Chamar participantes da tarefa</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#C7A15F]">📎</span>
                          <span>Compartilhar links e atualizações</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#C7A15F]">📊</span>
                          <span>Discutir progresso e resultados</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#C7A15F]">⚡</span>
                          <span>Acompanhar histórico de entregas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  tarefa.comentarios.map((com) => (
                    <div key={com.id} className="flex items-start gap-2.5">
                      {/* Avatar do Autor */}
                      <div
                        title={com.autor?.nome || 'Usuário'}
                        className="w-8 h-8 rounded-full bg-[#181512] text-[#C7A15F] border-2 border-white shadow-2xs flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      >
                        {com.autor?.nome ? com.autor.nome.slice(0, 2).toUpperCase() : 'US'}
                      </div>

                      {/* Balão da Mensagem */}
                      <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-2xl p-3.5 shadow-2xs flex flex-col gap-1 flex-1 max-w-[88%]">
                        <div className="flex items-center justify-between text-[10px] text-[#8F8271]">
                          <span className="font-bold text-[#1E1A16]">
                            {com.autor?.nome || 'Usuário'}
                          </span>
                          <span>
                            {new Date(com.createdAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-[#4A4032] leading-relaxed whitespace-pre-wrap mt-0.5">
                          {renderTextoComLinks(com.texto)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Barra de Envio de Mensagem com Botão de Anexo */}
              <div className="p-4 bg-[#FFFDF8] border-t border-[#E5D9C8] shrink-0">
                <form onSubmit={handleAddComentario} className="flex items-center gap-2">
                  {/* Botão de Anexar Arquivo */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    title="Anexar arquivo ou imagem"
                    className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#D8CBB8] hover:border-[#1E1A16] text-[#8F8271] hover:text-[#1E1A16] flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#C7A15F]" />
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

                  <div className="flex-1 bg-[#FAF7F2] border border-[#D8CBB8] focus-within:border-[#C7A15F] focus-within:bg-[#FFFDF8] rounded-2xl px-3.5 py-2 flex items-center gap-2 transition-all">
                    <input
                      type="text"
                      value={novoComentario}
                      onChange={(e) => setNovoComentario(e.target.value)}
                      placeholder="Digite @ para mencionar, cole links ou envie mensagens..."
                      className="flex-1 text-xs bg-transparent outline-none text-[#1E1A16] placeholder:text-[#8F8271]/60"
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
