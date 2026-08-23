import React, { useState, useEffect } from 'react';
import type { StatusTarefa, PrioridadeTarefa, Cliente, Projeto } from '../../types';
import { tarefasApi } from '../../api/tarefas';
import { api } from '../../api/client';
import { 
  X, 
  Plus, 
  Sparkles, 
  Trash2, 
  Loader2, 
  Calendar, 
  User as UserIcon, 
  Building2, 
  FolderKanban,
  Flame 
} from 'lucide-react';

interface UserOption {
  id: string;
  nome: string;
  email: string;
}

interface TaskFormModalProps {
  initialStatus?: StatusTarefa;
  initialWorkspaceId?: string | null;
  initialClienteId?: string | null;
  initialServicoId?: string | null;
  workspaces?: Projeto[];
  onClose: () => void;
  onTaskCreated: () => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  initialStatus = 'A_FAZER',
  initialWorkspaceId = null,
  initialClienteId = null,
  initialServicoId = null,
  workspaces = [],
  onClose,
  onTaskCreated,
}) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<StatusTarefa>(initialStatus);
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('MEDIA');
  const [projetoId, setProjetoId] = useState<string>(initialWorkspaceId || '');
  const [responsavelId, setResponsavelId] = useState('');
  const [clienteId, setClienteId] = useState(initialClienteId || '');
  const [servicoId, setServicoId] = useState(initialServicoId || '');
  const [prazo, setPrazo] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState('');
  const [checklist, setChecklist] = useState<string[]>([]);
  const [novoItem, setNovoItem] = useState('');

  const [usuarios, setUsuarios] = useState<UserOption[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicosCliente, setServicosCliente] = useState<any[]>([]);
  const [listaWorkspaces, setListaWorkspaces] = useState<Projeto[]>(workspaces);
  const [loading, setLoading] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  const carregarServicos = async (cId: string) => {
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

  useEffect(() => {
    if (initialClienteId) {
      carregarServicos(initialClienteId);
    }
  }, [initialClienteId]);

  useEffect(() => {
    const carregarDependencias = async () => {
      try {
        const [usersRes, clientesRes, wsRes] = await Promise.all([
          api.get<UserOption[]>('/users').catch(() => ({ data: [] })),
          api.get<Cliente[]>('/clientes').catch(() => ({ data: [] })),
          workspaces.length > 0 ? Promise.resolve(workspaces) : tarefasApi.getProjetos().catch(() => []),
        ]);
        setUsuarios(usersRes.data || []);
        setClientes(clientesRes.data || []);
        setListaWorkspaces(wsRes || []);

        // Se houver initialClienteId e existir um workspace para este cliente, pré-seleciona
        if (initialClienteId && !initialWorkspaceId && wsRes) {
          const wsDoCliente = wsRes.find((w: any) => w.clienteId === initialClienteId);
          if (wsDoCliente) {
            setProjetoId(wsDoCliente.id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar usuários/clientes/workspaces:', err);
      }
    };

    carregarDependencias();
  }, []);

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItem.trim()) return;
    setChecklist([...checklist, novoItem.trim()]);
    setNovoItem('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleGerarChecklistIa = async () => {
    if (!titulo.trim()) {
      alert('Preencha o título da tarefa primeiro para que a IA possa gerar o checklist adequado.');
      return;
    }
    setLoadingAi(true);
    try {
      const sugestoes = await tarefasApi.gerarChecklistIa({
        titulo,
        descricao,
        clienteId: clienteId || undefined,
      });
      setChecklist(sugestoes);
    } catch (err) {
      console.error('Erro ao gerar checklist via IA:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setLoading(true);
    try {
      await tarefasApi.createTarefa({
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        status,
        prioridade,
        projetoId: projetoId || undefined,
        responsavelId: responsavelId || undefined,
        clienteId: clienteId || undefined,
        servicoId: servicoId || undefined,
        prazo: prazo ? new Date(prazo).toISOString() : undefined,
        horasEstimadas: horasEstimadas ? Number(horasEstimadas) : undefined,
        checklist: checklist.length > 0 ? checklist : undefined,
      });

      onTaskCreated();
      onClose();
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0D0B]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#FFFDF8] border-b border-[#D8CBB8] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#1E1A16] uppercase tracking-wider">
              Criar Nova Tarefa
            </h3>
            <span className="text-[11px] text-[#8F8271]">
              Módulo Vivox GP • Gestão Operacional
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#847663] hover:text-[#1E1A16] hover:bg-[#EEE7DC] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
              Título da Tarefa <span className="text-[#B83B32]">*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Desenvolver nova Landing Page do Dr. Micaela"
              className="w-full text-sm font-semibold text-[#1E1A16] bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg px-3.5 py-2 outline-none focus:border-[#C7A15F]"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
              Descrição & Briefing
            </label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Informações, orientações ou links úteis para a equipe..."
              className="w-full text-xs text-[#1E1A16] bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg p-3 outline-none focus:border-[#C7A15F] resize-y"
            />
          </div>

          {/* Workspace e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                <FolderKanban className="w-3.5 h-3.5 text-[#C7A15F]" />
                Workspace de Destino
              </label>
              <select
                value={projetoId}
                onChange={(e) => setProjetoId(e.target.value)}
                className="w-full text-xs font-semibold py-2 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
              >
                <option value="">Nenhum (Workspace Geral)</option>
                {listaWorkspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.icone || '📁'} {ws.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
                Coluna / Status Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusTarefa)}
                className="w-full text-xs font-semibold py-2 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="A_FAZER">A Fazer</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="EM_REVISAO">Em Revisão</option>
                <option value="CONCLUIDA">Concluída</option>
              </select>
            </div>
          </div>

          {/* Linha: Prioridade e Responsável */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as PrioridadeTarefa)}
                className="w-full text-xs font-semibold py-2 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">🔥 Urgente</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                <UserIcon className="w-3.5 h-3.5 text-[#8F8271]" />
                Responsável
              </label>
              <select
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
              >
                <option value="">Não atribuído</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha: Cliente e Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                <Building2 className="w-3.5 h-3.5 text-[#8F8271]" />
                Cliente Vinculado
              </label>
              <select
                value={clienteId}
                onChange={(e) => {
                  const newCId = e.target.value;
                  setClienteId(newCId);
                  setServicoId('');
                  carregarServicos(newCId);
                }}
                className="w-full text-xs py-2 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
              >
                <option value="">Nenhum cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeFantasia}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#8F8271]" />
                Prazo de Entrega
              </label>
              <input
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
              />
            </div>
          </div>

          {/* Serviço Contratado do Cliente (Se houver cliente) */}
          {clienteId && (
            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                <FolderKanban className="w-3.5 h-3.5 text-[#C7A15F]" />
                Serviço Contratado do Cliente
              </label>
              <select
                value={servicoId}
                onChange={(e) => setServicoId(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F] font-semibold text-[#1E1A16]"
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

          {/* Checklist Inicial */}
          <div className="pt-2 border-t border-[#D8CBB8]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider">
                Checklist de Subtarefas
              </label>
              <button
                type="button"
                onClick={handleGerarChecklistIa}
                disabled={loadingAi}
                className="text-[11px] font-bold text-[#8F6F2D] hover:text-[#1E1A16] bg-[#C7A15F]/20 hover:bg-[#C7A15F]/30 border border-[#C7A15F]/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loadingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-[#C7A15F]" />}
                Gerar com IA
              </button>
            </div>

            <div className="space-y-1.5 mb-2">
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg text-xs"
                >
                  <span className="text-[#1E1A16]">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(idx)}
                    className="text-[#8F8271] hover:text-[#B83B32] p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={novoItem}
                onChange={(e) => setNovoItem(e.target.value)}
                placeholder="Digitar subtarefa manual..."
                className="flex-1 text-xs bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg px-3 py-1.5 outline-none focus:border-[#C7A15F]"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 bg-[#EEE7DC] hover:bg-[#E5D9C8] text-[#1E1A16] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-4 border-t border-[#D8CBB8] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#847663] hover:text-[#1E1A16] hover:bg-[#EEE7DC] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !titulo.trim()}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#C7A15F] hover:bg-[#D1B174] text-[#1E1A16] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
