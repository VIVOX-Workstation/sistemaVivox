import React, { useState, useEffect } from 'react';
import type { Cliente } from '../../types';
import { tarefasApi } from '../../api/tarefas';
import { api } from '../../api/client';
import { X, Loader2, Building2, User as UserIcon, Palette } from 'lucide-react';

interface UserOption {
  id: string;
  nome: string;
  email: string;
}

interface WorkspaceModalProps {
  workspaceId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const ICONES_SUGERIDOS = ['📁', '🚀', '🎨', '📊', '🎬', '💼', '💻', '🎯', '⚡', '🌟', '📱', '🔥'];
const CORES_SUGERIDAS = ['#C7A15F', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#64748B'];

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  workspaceId,
  onClose,
  onSaved,
}) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState('#C7A15F');
  const [icone, setIcone] = useState('📁');
  const [clienteId, setClienteId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [clientesRes, usersRes] = await Promise.all([
          api.get<Cliente[]>('/clientes').catch(() => ({ data: [] })),
          api.get<UserOption[]>('/users').catch(() => ({ data: [] })),
        ]);
        setClientes(clientesRes.data || []);
        setUsuarios(usersRes.data || []);

        if (workspaceId) {
          const ws = await tarefasApi.getProjetoById(workspaceId);
          if (ws) {
            setNome(ws.nome || '');
            setDescricao(ws.descricao || '');
            setCor(ws.cor || '#C7A15F');
            setIcone(ws.icone || '📁');
            setClienteId(ws.clienteId || '');
            setResponsavelId(ws.responsavelId || '');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do workspace:', err);
      }
    };

    carregar();
  }, [workspaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setLoading(true);
    try {
      if (workspaceId) {
        await tarefasApi.updateProjeto(workspaceId, {
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          cor,
          icone,
          clienteId: clienteId || undefined,
          responsavelId: responsavelId || undefined,
        });
      } else {
        await tarefasApi.createProjeto({
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          cor,
          icone,
          clienteId: clienteId || undefined,
          responsavelId: responsavelId || undefined,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0D0B]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFFDF8] border-b border-[#D8CBB8] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#1E1A16] uppercase tracking-wider">
              {workspaceId ? 'Editar Workspace' : 'Criar Novo Workspace'}
            </h3>
            <span className="text-[11px] text-[#8F8271]">
              Espaço de trabalho com Kanban próprio
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome e Ícone */}
          <div>
            <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
              Nome do Workspace <span className="text-[#B83B32]">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={icone}
                  onChange={(e) => setIcone(e.target.value)}
                  className="w-12 text-center text-base py-2 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
                  title="Emoji/Ícone do workspace"
                />
              </div>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Tráfego Pago, Produção de LPs, Dr. Micaela..."
                className="flex-1 text-sm font-semibold text-[#1E1A16] bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg px-3.5 py-2 outline-none focus:border-[#C7A15F]"
              />
            </div>

            {/* Sugestões de Emojis */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] text-[#8F8271] font-medium mr-1">Ícone:</span>
              {ICONES_SUGERIDOS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcone(emoji)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-[#EEE7DC] transition-colors cursor-pointer ${
                    icone === emoji ? 'bg-[#24201A] text-[#C7A15F] ring-1 ring-[#C7A15F]' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
              Descrição / Finalidade
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Objetivo deste espaço de trabalho..."
              className="w-full text-xs text-[#1E1A16] bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg p-3 outline-none focus:border-[#C7A15F] resize-y"
            />
          </div>

          {/* Cor de Destaque */}
          <div>
            <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <Palette className="w-3.5 h-3.5 text-[#8F8271]" />
              Cor de Destaque
            </label>
            <div className="flex items-center gap-2">
              {CORES_SUGERIDAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                    cor === c ? 'border-[#1E1A16] scale-110 shadow-xs' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Cliente e Responsável */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                <Building2 className="w-3.5 h-3.5 text-[#8F8271]" />
                Vincular a Cliente (Opcional)
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
              >
                <option value="">Nenhum (Workspace Geral)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeFantasia}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                <UserIcon className="w-3.5 h-3.5 text-[#8F8271]" />
                Líder / Responsável
              </label>
              <select
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
              >
                <option value="">Não definido</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões */}
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
              disabled={loading || !nome.trim()}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#C7A15F] hover:bg-[#D1B174] text-[#1E1A16] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {workspaceId ? 'Salvar Workspace' : 'Criar Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
