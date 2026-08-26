import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Cliente } from '../../types';
import { api } from '../../api/client';
import { chamadosApi, type CategoriaChamado, type UrgenciaChamado } from '../../api/chamados';
import { X, Loader2, Building2, FolderKanban, Paperclip, AlertTriangle } from 'lucide-react';

interface NovoChamadoModalProps {
  initialClienteId?: string | null;
  onClose: () => void;
  onChamadoCreated: () => void;
}

export const NovoChamadoModal: React.FC<NovoChamadoModalProps> = ({
  initialClienteId = null,
  onClose,
  onChamadoCreated,
}) => {
  const [clienteId, setClienteId] = useState(initialClienteId || '');
  const [servicoId, setServicoId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricaoProblema, setDescricaoProblema] = useState('');
  const [categoria, setCategoria] = useState<CategoriaChamado>('BUG');
  const [urgencia, setUrgencia] = useState<UrgenciaChamado>('MEDIA');
  const [anexos, setAnexos] = useState<File[]>([]);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicosCliente, setServicosCliente] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    api.get<Cliente[]>('/clientes').then((res) => setClientes(res.data || [])).catch(() => setClientes([]));
    if (initialClienteId) carregarServicos(initialClienteId);
  }, [initialClienteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !titulo.trim() || !descricaoProblema.trim()) return;

    setLoading(true);
    try {
      const chamado = await chamadosApi.createChamado({
        clienteId,
        servicoId: servicoId || undefined,
        titulo: titulo.trim(),
        categoria,
        urgencia,
        descricaoProblema: descricaoProblema.trim(),
      });

      for (const file of anexos) {
        await chamadosApi.uploadAnexo(chamado.id, file).catch((err) =>
          console.error('Erro ao enviar anexo do chamado:', err)
        );
      }

      onChamadoCreated();
      onClose();
    } catch (err) {
      console.error('Erro ao criar chamado:', err);
      alert('Erro ao criar chamado.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0D0B]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#FFFDF8] border-b border-[#D8CBB8] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#1E1A16] uppercase tracking-wider">
              Novo Chamado
            </h3>
            <span className="text-[11px] text-[#8F8271]">
              Suporte pós-entrega • Central de Chamados
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
          {/* Cliente e Serviço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                <Building2 className="w-3.5 h-3.5 text-[#8F8271]" />
                Cliente <span className="text-[#B83B32]">*</span>
              </label>
              <select
                required
                value={clienteId}
                onChange={(e) => {
                  const newCId = e.target.value;
                  setClienteId(newCId);
                  setServicoId('');
                  carregarServicos(newCId);
                }}
                className="w-full text-xs font-semibold py-2.5 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
              >
                <option value="">Selecione o cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                <FolderKanban className="w-3.5 h-3.5 text-[#8F8271]" />
                Serviço (opcional)
              </label>
              <select
                value={servicoId}
                onChange={(e) => setServicoId(e.target.value)}
                disabled={!clienteId}
                className="w-full text-xs font-semibold py-2.5 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F] disabled:opacity-50"
              >
                <option value="">Nenhum específico</option>
                {servicosCliente.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.tipoServico?.replace(/_/g, ' ')} ({srv.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
              Título / Assunto <span className="text-[#B83B32]">*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Erro ao acessar o e-mail corporativo"
              className="w-full text-sm font-semibold text-[#1E1A16] bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg px-3.5 py-2 outline-none focus:border-[#C7A15F]"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
              Descrição Detalhada <span className="text-[#B83B32]">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={descricaoProblema}
              onChange={(e) => setDescricaoProblema(e.target.value)}
              placeholder="O que está acontecendo, com passos para reproduzir o erro ou contexto do pedido..."
              className="w-full text-xs text-[#1E1A16] bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg p-3 outline-none focus:border-[#C7A15F] resize-y"
            />
          </div>

          {/* Categoria e Urgência */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
                Categoria / Tipo de Problema <span className="text-[#B83B32]">*</span>
              </label>
              <select
                required
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaChamado)}
                className="w-full text-xs font-semibold py-2 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
              >
                <option value="BUG">Bug / Erro</option>
                <option value="AJUSTE">Ajuste / Melhoria</option>
                <option value="DUVIDA">Dúvida</option>
                <option value="ACESSO">Acesso / Login</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
                Urgência / Impacto
              </label>
              <select
                value={urgencia}
                onChange={(e) => setUrgencia(e.target.value as UrgenciaChamado)}
                className="w-full text-xs font-semibold py-2 px-3 bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg outline-none focus:border-[#C7A15F]"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
          </div>

          {/* Anexos */}
          <div>
            <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
              <Paperclip className="w-3.5 h-3.5 text-[#8F8271]" />
              Anexos (opcional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.log,.txt,.pdf"
              onChange={(e) => setAnexos(Array.from(e.target.files || []))}
              className="w-full text-xs bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg p-2.5 outline-none focus:border-[#C7A15F] file:mr-3 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-[#E5D9C8] file:text-[#1E1A16] file:text-xs file:font-bold"
            />
            {anexos.length > 0 && (
              <p className="text-[11px] text-[#8F8271] mt-1">{anexos.length} arquivo(s) selecionado(s)</p>
            )}
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
              disabled={loading || !clienteId || !titulo.trim() || !descricaoProblema.trim()}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#B83B32] hover:bg-[#9c322a] text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Criar Chamado
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
