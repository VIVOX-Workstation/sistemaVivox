import { useState, useEffect } from 'react';
import type { Cliente, AtivoHospedagem, StatusHospedagem } from '../../types';
import { api } from '../../api/client';
import {
  Globe,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layout,
} from 'lucide-react';
import { Modal } from '../Modal';
import { Input } from '../Input';
import { Select } from '../Select';
import { Textarea } from '../Textarea';

interface Props {
  cliente: Cliente;
}

export function HostingTab({ cliente }: Props) {
  const [ativos, setAtivos] = useState<AtivoHospedagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAtivo, setEditingAtivo] = useState<AtivoHospedagem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State Simplificado
  const [formData, setFormData] = useState<{
    titulo: string;
    url: string;
    dominio: string;
    dataExpiracaoDominio: string;
    status: StatusHospedagem;
    observacoes: string;
  }>({
    titulo: '',
    url: '',
    dominio: '',
    dataExpiracaoDominio: '',
    status: 'ATIVO',
    observacoes: '',
  });

  useEffect(() => {
    loadAtivos();
  }, [cliente.id]);

  const loadAtivos = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hospedagens/cliente/${cliente.id}`);
      setAtivos(res.data);
    } catch (e) {
      console.error('Erro ao carregar Landing Pages:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewModal = () => {
    setEditingAtivo(null);
    setFormData({
      titulo: '',
      url: '',
      dominio: '',
      dataExpiracaoDominio: '',
      status: 'ATIVO',
      observacoes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ativo: AtivoHospedagem) => {
    setEditingAtivo(ativo);
    setFormData({
      titulo: ativo.titulo,
      url: ativo.url,
      dominio: ativo.dominio || '',
      dataExpiracaoDominio: ativo.dataExpiracaoDominio ? ativo.dataExpiracaoDominio.split('T')[0] : '',
      status: ativo.status || 'ATIVO',
      observacoes: ativo.observacoes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        clienteId: cliente.id,
        titulo: formData.titulo,
        url: formData.url,
        dominio: formData.dominio || undefined,
        dataExpiracaoDominio: formData.dataExpiracaoDominio
          ? new Date(formData.dataExpiracaoDominio).toISOString()
          : undefined,
        status: formData.status,
        observacoes: formData.observacoes || undefined,
      };

      if (editingAtivo) {
        await api.patch(`/hospedagens/${editingAtivo.id}`, payload);
      } else {
        await api.post('/hospedagens', payload);
      }

      setIsModalOpen(false);
      loadAtivos();
    } catch (err) {
      console.error('Erro ao salvar Landing Page:', err);
      alert('Erro ao salvar Landing Page.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${titulo}"?`)) return;
    try {
      await api.delete(`/hospedagens/${id}`);
      loadAtivos();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir ativo.');
    }
  };

  const calcularDiasRestantes = (dataStr?: string) => {
    if (!dataStr) return null;
    const dataAlvo = new Date(dataStr);
    const hoje = new Date();
    return Math.ceil((dataAlvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatarDataBR = (dataStr?: string) => {
    if (!dataStr) return 'Não informada';
    const d = new Date(dataStr);
    return d.toLocaleDateString('pt-BR');
  };

  const renderBadgeVencimento = (dias: number | null) => {
    if (dias === null) {
      return (
        <span className="text-[10px] text-[#847663] bg-[#EEE7DC] px-2 py-0.5 rounded font-medium">
          Sem data
        </span>
      );
    }
    if (dias < 0) {
      return (
        <span className="text-[10px] text-[#B83B32] bg-[#FDF2F2] border border-[#FCDAD7] px-2.5 py-0.5 rounded font-bold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Expirou há {Math.abs(dias)}d
        </span>
      );
    }
    if (dias <= 7) {
      return (
        <span className="text-[10px] text-[#B83B32] bg-[#FDF2F2] border border-[#FCDAD7] px-2.5 py-0.5 rounded font-bold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Vence em {dias}d (Crítico)
        </span>
      );
    }
    if (dias <= 30) {
      return (
        <span className="text-[10px] text-[#8A6828] bg-[#FAF2E4] border border-[#E8D4B4] px-2.5 py-0.5 rounded font-bold flex items-center gap-1">
          <Clock className="w-3 h-3" /> Vence em {dias}d
        </span>
      );
    }
    return (
      <span className="text-[10px] text-[#247A4A] bg-[#E6F4EA] border border-[#CEEAD6] px-2.5 py-0.5 rounded font-semibold flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Em dia ({dias}d)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE CONTROLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1E1A16] tracking-tight">Landing Pages & Renovações de Domínio</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4]">
              {ativos.length} {ativos.length === 1 ? 'página' : 'páginas'}
            </span>
          </div>
          <p className="text-xs text-[#625746] mt-0.5">
            Cadastre as Landing Pages do cliente e acompanhe a data de renovação do domínio para evitar que o site saia do ar.
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="px-3.5 py-2 rounded-lg bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Landing Page
        </button>
      </div>

      {/* LISTAGEM DE LANDING PAGES */}
      {loading ? (
        <div className="py-12 text-center text-[#625746]">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#B89455] border-r-transparent mr-2 align-middle"></div>
          Carregando páginas do cliente...
        </div>
      ) : ativos.length === 0 ? (
        <div className="bg-[#FAF7F2] rounded-[11px] border border-dashed border-[#D8CBB8] p-10 text-center space-y-3">
          <Layout className="w-10 h-10 text-[#847663] mx-auto opacity-70" />
          <div>
            <h3 className="text-sm font-bold text-[#1E1A16]">Nenhuma Landing Page cadastrada</h3>
            <p className="text-xs text-[#625746] mt-0.5">
              Cadastre as páginas hospedadas para monitorar as datas de vencimento do domínio.
            </p>
          </div>
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] text-xs font-bold rounded-lg shadow-2xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Primeira LP
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ativos.map((ativo) => {
            const diasDom = calcularDiasRestantes(ativo.dataExpiracaoDominio);

            return (
              <div
                key={ativo.id}
                className="bg-[#FFFDF8] rounded-[11px] border border-[#D8CBB8] shadow-xs hover:border-[#B89455] transition-all p-4 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#247A4A] inline-block"></span>
                        <h3 className="text-sm font-bold text-[#1E1A16]">{ativo.titulo}</h3>
                      </div>
                      <a
                        href={ativo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#8A6828] hover:underline flex items-center gap-1 font-mono truncate max-w-[220px]"
                        title={ativo.url}
                      >
                        {ativo.url}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(ativo)}
                        className="p-1.5 text-[#847663] hover:text-[#1E1A16] hover:bg-[#EEE7DC] rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ativo.id, ativo.titulo)}
                        className="p-1.5 text-[#847663] hover:text-[#B83B32] hover:bg-[#FDF2F2] rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Informações de Domínio e Renovação */}
                  <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#E5D9C8] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#847663] flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-[#B89455]" /> Domínio:
                      </span>
                      <span className="font-bold text-[#1E1A16]">{ativo.dominio || '-'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#EEE7DC]">
                      <span className="text-[#847663] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#8A6828]" /> Renovação:
                      </span>
                      <span className="font-semibold text-[#1E1A16]">
                        {formatarDataBR(ativo.dataExpiracaoDominio)}
                      </span>
                    </div>

                    <div className="pt-1 flex justify-end">
                      {renderBadgeVencimento(diasDom)}
                    </div>
                  </div>

                  {/* Observações */}
                  {ativo.observacoes && (
                    <div className="text-[11px] text-[#625746] bg-[#FAF6F0] p-2 rounded-md border border-[#E5D9C8]">
                      <span className="font-bold text-[#1E1A16]">Notas: </span>
                      {ativo.observacoes}
                    </div>
                  )}
                </div>

                {/* Footer do Card */}
                <div className="pt-2 border-t border-[#EEE7DC] flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4]">
                    {ativo.status}
                  </span>
                  <a
                    href={ativo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-[#8A6828] hover:underline flex items-center gap-1"
                  >
                    Acessar LP <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL SIMPLIFICADO */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAtivo ? 'Editar Landing Page' : 'Cadastrar Nova Landing Page'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Título da Landing Page / Projeto *"
            placeholder="Ex: LP Implante Capilar, Site Institucional"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            required
          />

          <Input
            label="URL da Página *"
            placeholder="Ex: https://drcliente.com.br/captura"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Domínio Principal"
              placeholder="Ex: drcliente.com.br"
              value={formData.dominio}
              onChange={(e) => setFormData({ ...formData, dominio: e.target.value })}
            />

            <Input
              label="Data de Renovação do Domínio"
              type="date"
              value={formData.dataExpiracaoDominio}
              onChange={(e) => setFormData({ ...formData, dataExpiracaoDominio: e.target.value })}
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusHospedagem })}
          >
            <option value="ATIVO">Ativo</option>
            <option value="PENDENTE_RENOVACAO">Pendente Renovação</option>
            <option value="MANUTENCAO">Em Manutenção</option>
            <option value="EXPIRADO">Expirado</option>
          </Select>

          <Textarea
            label="Observações / Anotações"
            placeholder="Ex: Domínio no Registro.br com e-mail do cliente, renovação automática..."
            rows={3}
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[#D8CBB8]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-[#D8CBB8] text-xs font-semibold text-[#625746] hover:bg-[#EEE7DC] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] text-xs font-bold shadow-xs transition-colors"
            >
              {saving ? 'Salvando...' : editingAtivo ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
