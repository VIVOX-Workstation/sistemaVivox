import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';
import { chamadosApi } from '../../api/chamados';
import type { Chamado, StatusChamado, ChamadoComentario } from '../../api/chamados';
import type { Cliente } from '../../types';
import { 
  X, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Timer,
  User,
  Send,
  MessageSquare,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface UserOption {
  id: string;
  nome: string;
}

interface ChamadoModalProps {
  chamado: Chamado;
  clientes: Cliente[];
  onClose: () => void;
  onUpdate: (chamado: Chamado) => void;
}

const statusConfig = {
  ABERTO: { label: 'Aberto', color: 'bg-[#FF5B5B]/10 text-[#FF5B5B] border-[#FF5B5B]/20', icon: AlertCircle },
  EM_ANDAMENTO: { label: 'Em Atendimento', color: 'bg-[#FFA800]/10 text-[#FFA800] border-[#FFA800]/20', icon: Timer },
  RESOLVIDO: { label: 'Resolvido', color: 'bg-[#24C16E]/10 text-[#24C16E] border-[#24C16E]/20', icon: CheckCircle2 }
};

export const ChamadoModal: React.FC<ChamadoModalProps> = ({
  chamado,
  clientes,
  onClose,
  onUpdate
}) => {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [comentarios, setComentarios] = useState<ChamadoComentario[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const cliente = clientes.find(c => c.id === chamado.clienteId);
  const ticketNum = `#${chamado.id.substring(0, 6).toUpperCase()}`;
  const statusInfo = statusConfig[chamado.status];
  const StatusIcon = statusInfo.icon;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, comentariosRes] = await Promise.all([
          api.get<UserOption[]>('/users').catch(() => ({ data: [] })),
          chamadosApi.getComentarios(chamado.id)
        ]);
        setUsers(usersRes.data);
        setComentarios(comentariosRes);
      } catch (err) {
        console.error('Erro ao carregar dados do modal de chamado:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chamado.id]);

  const handleUpdateStatus = async (newStatus: StatusChamado) => {
    if (newStatus === chamado.status) return;
    setUpdating(true);
    try {
      const updated = await chamadosApi.updateChamado(chamado.id, { status: newStatus });
      onUpdate(updated);
      const newComentarios = await chamadosApi.getComentarios(chamado.id);
      setComentarios(newComentarios);
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateProprietario = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const propId = e.target.value || null;
    if (propId === chamado.proprietarioId) return;
    setUpdating(true);
    try {
      const updated = await chamadosApi.updateChamado(chamado.id, { proprietarioId: propId });
      onUpdate(updated);
      const newComentarios = await chamadosApi.getComentarios(chamado.id);
      setComentarios(newComentarios);
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar proprietário');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    
    const texto = novoComentario;
    setNovoComentario('');
    try {
      await chamadosApi.addComentario(chamado.id, texto);
      const newComentarios = await chamadosApi.getComentarios(chamado.id);
      setComentarios(newComentarios);
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar comentário');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 md:p-6">
      <div 
        className="w-full max-w-4xl bg-[#FFFDF8] rounded-[32px] shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-[#F6F2EA] bg-white">
          <div className="flex items-start gap-4">
            {cliente?.logoUrl ? (
              <img src={resolveMediaUrl(cliente.logoUrl)} alt="Logo" className="w-12 h-12 rounded-full object-cover shadow-sm mt-1" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#241F1A] to-[#181512] flex items-center justify-center text-[#C7A15F] shadow-inner mt-1">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-black text-[#8F8271] uppercase tracking-wider flex items-center gap-1">
                  <Hash className="w-4 h-4" /> {ticketNum}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-2xs ${statusInfo.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusInfo.label}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-[#1E1A16] tracking-tight">
                {chamado.descricaoProblema || 'Detalhes do Chamado'}
              </h2>
              <p className="text-sm font-bold text-[#8F8271] mt-1 flex items-center gap-2">
                <span>{cliente?.nomeFantasia || 'Desconhecido'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {format(new Date(chamado.createdAt), "dd MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#FAF7F2] text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#E5D9C8] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLS (Status & Owner) */}
        <div className="px-8 py-4 bg-[#FAF7F2]/50 border-b border-[#F6F2EA] flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#8F8271] uppercase tracking-wider">Status:</span>
            <select
              value={chamado.status}
              onChange={(e) => handleUpdateStatus(e.target.value as StatusChamado)}
              disabled={updating}
              className="bg-white border border-[#E5D9C8] text-sm font-bold text-[#1E1A16] rounded-xl px-3 py-1.5 outline-none focus:border-[#C7A15F] transition-colors disabled:opacity-50"
            >
              <option value="ABERTO">Aberto</option>
              <option value="EM_ANDAMENTO">Em Atendimento</option>
              <option value="RESOLVIDO">Resolvido</option>
            </select>
          </div>

          <div className="w-px h-6 bg-[#E5D9C8]"></div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#8F8271] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Proprietário:
            </span>
            <select
              value={chamado.proprietarioId || ''}
              onChange={handleUpdateProprietario}
              disabled={updating || loading}
              className="bg-white border border-[#E5D9C8] text-sm font-bold text-[#1E1A16] rounded-xl px-3 py-1.5 outline-none focus:border-[#C7A15F] transition-colors disabled:opacity-50"
            >
              <option value="">Nenhum (Não atribuído)</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TIMELINE / CONVERSA */}
        <div className="flex-1 bg-white p-8 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[#8F8271]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C7A15F]"></div>
            </div>
          ) : comentarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#8F8271] gap-2">
              <MessageSquare className="w-6 h-6 opacity-40" />
              <p className="text-sm font-medium">Nenhum histórico de conversa ainda.</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#E5D9C8] before:to-transparent">
              {comentarios.map((comentario, index) => {
                const isSystem = comentario.isSystemMessage;
                return (
                  <div key={comentario.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${isSystem ? 'is-system' : 'is-user'}`}>
                    
                    {/* Marker */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#FAF7F2] text-[#C7A15F] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      {isSystem ? <AlertCircle className="w-4 h-4 text-[#8F8271]" /> : <MessageSquare className="w-4 h-4 text-[#C7A15F]" />}
                    </div>

                    {/* Content */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border shadow-2xs transition-all hover:shadow-md bg-white border-[#E5D9C8]">
                      {isSystem ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-bold text-[#625746]">{comentario.texto}</p>
                          <span className="text-[10px] font-bold text-[#8F8271] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(comentario.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-black text-[#1E1A16] flex items-center gap-1.5">
                              <User className="w-3 h-3 text-[#C7A15F]" />
                              {comentario.autor?.nome || 'Usuário'}
                            </span>
                            <span className="text-[10px] font-bold text-[#8F8271]">
                              {format(new Date(comentario.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-[#625746] whitespace-pre-wrap">{comentario.texto}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="px-8 py-5 border-t border-[#F6F2EA] bg-[#FAF7F2]">
          <form onSubmit={handleSendComment} className="flex gap-3">
            <input
              type="text"
              placeholder="Adicionar uma anotação na conversa..."
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              className="flex-1 bg-white border border-[#E5D9C8] rounded-xl px-4 py-3 text-sm font-medium text-[#1E1A16] placeholder:text-[#8F8271] outline-none focus:border-[#C7A15F] focus:ring-4 focus:ring-[#C7A15F]/10 transition-all shadow-2xs"
            />
            <button
              type="submit"
              disabled={!novoComentario.trim()}
              className="w-12 h-12 rounded-xl bg-[#181512] hover:bg-[#2A241E] text-[#C7A15F] flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-[#181512] shrink-0 shadow-2xs"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
