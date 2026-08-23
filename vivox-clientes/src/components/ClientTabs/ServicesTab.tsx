import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cliente, ServicoContratado, StatusServico, TipoServico, Tarefa } from '../../types';
import { api } from '../../api/client';
import { tarefasApi } from '../../api/tarefas';
import { Button } from '../Button';
import { Input } from '../Input';
import { Select } from '../Select';
import { Textarea } from '../Textarea';
import { Modal } from '../Modal';
import { Badge } from '../Badge';
import { TaskFormModal } from '../gp/TaskFormModal';
import { 
  Plus, 
  History, 
  ChevronRight, 
  Lock, 
  ExternalLink, 
  CheckCircle2, 
  Kanban, 
  Layers, 
  Clock, 
  Calendar 
} from 'lucide-react';

interface Props {
  cliente: Cliente;
}

const TODOS_SERVICOS: { tipo: TipoServico; nome: string; descricao: string; imagem: string }[] = [
  { tipo: 'GERENCIAMENTO_REDES', nome: 'Gerenciamento de Redes', descricao: 'Gestão de redes sociais, planejamento e postagens.', imagem: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop' },
  { tipo: 'FOLDER', nome: 'Folder', descricao: 'Criação e design de materiais impressos e promocionais.', imagem: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?q=80&w=800&auto=format&fit=crop' },
  { tipo: 'REVISTA', nome: 'Revista', descricao: 'Projeto editorial e diagramação de revistas e catálogos.', imagem: 'https://images.unsplash.com/photo-1585241936939-cf40b39be28b?q=80&w=800&auto=format&fit=crop' },
  { tipo: 'LANDING_PAGE', nome: 'Landing Page', descricao: 'Desenvolvimento de páginas web focadas em alta conversão.', imagem: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop' },
  { tipo: 'APP', nome: 'App', descricao: 'Desenvolvimento de aplicativos móveis sob medida.', imagem: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop' },
  { tipo: 'FOTOGRAFIA', nome: 'Fotografia', descricao: 'Cobertura fotográfica, fotos de produtos e ensaios corporativos.', imagem: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop' },
  { tipo: 'VIDEO', nome: 'Vídeo', descricao: 'Produção, captação e edição audiovisual para campanhas.', imagem: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=800&auto=format&fit=crop' },
  { tipo: 'TRAFEGO_PAGO', nome: 'Tráfego Pago', descricao: 'Gestão de campanhas e anúncios online (Google, Meta, etc).', imagem: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop' },
  { tipo: 'IDENTIDADE_VISUAL', nome: 'Identidade Visual', descricao: 'Criação de logotipo, branding e manual da marca.', imagem: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop' },
];

export const SERVICOS_COM_ARQUITETURA: TipoServico[] = ['APP', 'LANDING_PAGE', 'IDENTIDADE_VISUAL'];

export function ServicesTab({ cliente }: Props) {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState<ServicoContratado[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [isNewModalOpen, setNewModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedServico, setSelectedServico] = useState<ServicoContratado | null>(null);
  const [actionLog, setActionLog] = useState({ acao: '', observacao: '', status: '' as StatusServico });

  // Modal para criação de demanda no GP diretamente do serviço
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedServiceForTask, setSelectedServiceForTask] = useState<string | null>(null);

  const [newService, setNewService] = useState<any>({
    tipoServico: 'GERENCIAMENTO_REDES',
    status: 'ATIVO',
    dataContratacao: new Date().toISOString().split('T')[0],
    descricaoEscopo: '',
  });

  useEffect(() => {
    loadServicos();
    loadTarefas();
  }, [cliente.id]);

  const loadServicos = async () => {
    try {
      const response = await api.get(`/servicos/cliente/${cliente.id}`);
      setServicos(
        response.data.sort(
          (a: any, b: any) =>
            new Date(b.dataContratacao).getTime() - new Date(a.dataContratacao).getTime()
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const loadTarefas = async () => {
    try {
      const data = await tarefasApi.getTarefas({ clienteId: cliente.id });
      setTarefas(data);
    } catch (e) {
      console.error('Erro ao carregar tarefas do cliente:', e);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        clienteId: cliente.id,
        tipoServico: newService.tipoServico as TipoServico,
        status: newService.status as StatusServico,
        dataContratacao: newService.dataContratacao
          ? new Date(newService.dataContratacao).toISOString()
          : new Date().toISOString(),
        descricaoEscopo: newService.descricaoEscopo || '',
      };
      await api.post('/servicos', payload);
      setNewModalOpen(false);
      loadServicos();
    } catch (e) {
      alert('Erro ao criar serviço');
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServico) return;

    try {
      await api.patch(`/servicos/${selectedServico.id}`, {
        status: actionLog.status || selectedServico.status,
      });
      setHistoryModalOpen(false);
      setSelectedServico(null);
      setActionLog({ acao: '', observacao: '', status: 'ATIVO' });
      loadServicos();
    } catch (e) {
      alert('Erro ao atualizar o serviço');
    }
  };

  const openPlanejamento = (s: ServicoContratado) => {
    navigate(`/cliente/${cliente.id}/servicos/${s.id}/planejamento`);
  };

  const handleOpenNewModal = (tipo?: TipoServico) => {
    setNewService({
      tipoServico: tipo || 'GERENCIAMENTO_REDES',
      status: 'ATIVO',
      dataContratacao: new Date().toISOString().split('T')[0],
      descricaoEscopo: '',
    });
    setNewModalOpen(true);
  };

  const handleOpenHistoryModal = (servico: ServicoContratado, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedServico(servico);
    setActionLog({ acao: '', observacao: '', status: servico.status });
    setHistoryModalOpen(true);
  };

  const handleOpenCreateTask = (servicoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedServiceForTask(servicoId);
    setIsTaskModalOpen(true);
  };

  const handleNavigateToGP = (servicoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/gp?clienteId=${cliente.id}&servicoId=${servicoId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-[#1E1A16]">Serviços & Históricos</h3>
          <p className="text-xs text-[#8F8271]">
            Mapa de serviços contratados e integração direta com o Vivox GP
          </p>
        </div>

        <Button
          onClick={() => handleOpenNewModal()}
          className="flex items-center gap-1.5 text-xs bg-[#181512] hover:bg-[#2B261F] text-white rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Contratar Novo Serviço
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {[...TODOS_SERVICOS]
          .sort((a, b) => {
            const contratadoA = servicos.find((s: any) => s.tipoServico === a.tipo);
            const contratadoB = servicos.find((s: any) => s.tipoServico === b.tipo);
            if (contratadoA && !contratadoB) return -1;
            if (!contratadoA && contratadoB) return 1;
            return 0;
          })
          .map((servicoInfo) => {
            const contratado = servicos.find((s: any) => s.tipoServico === servicoInfo.tipo) as any;

            if (contratado) {
              const servicoTarefas = tarefas.filter((t) => t.servicoId === contratado.id);
              const tarefasConcluidas = servicoTarefas.filter((t) => t.status === 'CONCLUIDA').length;
              const percentual = servicoTarefas.length > 0 ? Math.round((tarefasConcluidas / servicoTarefas.length) * 100) : 0;

              return (
                <div
                  key={servicoInfo.tipo}
                  className="relative rounded-[24px] overflow-hidden group cursor-pointer shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  onClick={() => openPlanejamento(contratado)}
                  style={{ minHeight: '270px' }}
                >
                  {/* Background Image */}
                  <img
                    src={servicoInfo.imagem}
                    alt={servicoInfo.nome}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14120E] via-[#14120E]/80 to-[#14120E]/40" />

                  {/* Top Bar */}
                  <div className="relative p-4 pb-0 flex justify-between items-start z-10">
                    <Badge
                      variant={
                        contratado.status === 'ATIVO'
                          ? 'success'
                          : contratado.status === 'CANCELADO'
                          ? 'danger'
                          : contratado.status === 'PAUSADO'
                          ? 'warning'
                          : 'default'
                      }
                      className="capitalize bg-opacity-95 backdrop-blur-md text-xs font-bold px-2.5 py-0.5 shadow-xs"
                    >
                      {contratado.status.toLowerCase()}
                    </Badge>

                    <button
                      onClick={(e) => handleOpenHistoryModal(contratado, e)}
                      title="Ver histórico e timeline de alterações"
                      className="bg-white/20 hover:bg-white/35 backdrop-blur-md p-2 rounded-full text-white transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Middle Content */}
                  <div className="relative px-4 py-3 z-10">
                    <h4 className="font-bold text-lg text-white mb-1 shadow-black/50 drop-shadow-sm">
                      {servicoInfo.nome}
                    </h4>
                    <p className="text-xs text-stone-300 mb-3 line-clamp-2 leading-relaxed">
                      {contratado.descricaoEscopo || servicoInfo.descricao}
                    </p>

                    {/* Widget Vivox GP Integrado */}
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-2.5 mb-2">
                      <div className="flex items-center justify-between text-[11px] text-stone-200 mb-1.5">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Kanban className="w-3.5 h-3.5 text-[#C7A15F]" />
                          {servicoTarefas.length > 0
                            ? `${tarefasConcluidas}/${servicoTarefas.length} entregas GP`
                            : 'Nenhuma demanda vinculada'}
                        </span>
                        <span className="font-bold text-white">{percentual}%</span>
                      </div>

                      {/* Mini Barra de Progresso */}
                      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C7A15F] rounded-full transition-all duration-500"
                          style={{ width: `${percentual}%` }}
                        />
                      </div>

                      {/* Botões Rápidos GP */}
                      <div className="flex items-center gap-2 pt-2 mt-1.5 border-t border-white/10">
                        <button
                          onClick={(e) => handleNavigateToGP(contratado.id, e)}
                          title="Abrir pipeline no Vivox GP"
                          className="flex-1 py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Kanban className="w-3 h-3 text-[#C7A15F]" />
                          <span>Ver no GP</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                        </button>

                        <button
                          onClick={(e) => handleOpenCreateTask(contratado.id, e)}
                          title="Criar nova demanda vinculada a este serviço"
                          className="py-1 px-2.5 rounded-lg bg-[#C7A15F] hover:bg-[#B89455] text-[#1D160B] text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Demanda</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Bar */}
                  <div className="relative px-4 py-2.5 border-t border-white/15 flex justify-between items-center text-xs text-stone-300 z-10 bg-black/20 backdrop-blur-xs">
                    <span>
                      Início: {new Date(contratado.dataContratacao).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center text-[#C7A15F] font-bold group-hover:underline">
                      <span>Ver Entregáveis</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={servicoInfo.tipo}
                className="relative rounded-[24px] overflow-hidden group cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                onClick={() => handleOpenNewModal(servicoInfo.tipo)}
                style={{ minHeight: '270px' }}
              >
                {/* Background Image - Grayscale for locked */}
                <img
                  src={servicoInfo.imagem}
                  alt={servicoInfo.nome}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter grayscale opacity-30 group-hover:opacity-50 group-hover:grayscale-0"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#14120E] via-[#14120E]/90 to-[#14120E]/60" />

                {/* Top Bar */}
                <div className="relative p-4 pb-0 flex justify-between items-start z-10">
                  <Badge
                    variant="default"
                    className="bg-black/60 text-stone-300 backdrop-blur-md border-white/10 text-xs font-semibold px-2.5 py-0.5"
                  >
                    Não Contratado
                  </Badge>
                  <div className="bg-black/60 backdrop-blur-md p-2 rounded-full text-stone-400 group-hover:text-[#C7A15F] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                {/* Middle Content */}
                <div className="relative px-4 py-3 z-10">
                  <h4 className="font-bold text-lg text-stone-200 group-hover:text-white mb-1 shadow-black/50 drop-shadow-sm transition-colors">
                    {servicoInfo.nome}
                  </h4>
                  <p className="text-xs text-stone-400 group-hover:text-stone-300 mb-3 line-clamp-2 leading-relaxed transition-colors">
                    {servicoInfo.descricao}
                  </p>
                </div>

                {/* Bottom Bar */}
                <div className="relative px-4 py-3 border-t border-white/10 flex justify-between items-center text-xs text-stone-400 z-10 bg-black/20 backdrop-blur-xs">
                  <span>Disponível para contratação</span>
                  <span className="flex items-center text-stone-300 font-semibold group-hover:text-[#C7A15F] group-hover:underline transition-colors">
                    Contratar <Plus className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Modal Novo Serviço */}
      <Modal isOpen={isNewModalOpen} onClose={() => setNewModalOpen(false)} title="Adicionar Serviço">
        <form onSubmit={handleCreateService} className="space-y-4">
          <Select
            label="Tipo de Serviço"
            required
            value={newService.tipoServico}
            onChange={(e) => setNewService({ ...newService, tipoServico: e.target.value as TipoServico })}
          >
            {TODOS_SERVICOS.map((t) => (
              <option key={t.tipo} value={t.tipo}>
                {t.nome}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status Inicial"
              required
              value={newService.status}
              onChange={(e) => setNewService({ ...newService, status: e.target.value as StatusServico })}
            >
              <option value="ATIVO">Ativo</option>
              <option value="PAUSADO">Pausado</option>
            </Select>
            <Input
              label="Data de Contratação"
              type="date"
              required
              value={newService.dataContratacao}
              onChange={(e) => setNewService({ ...newService, dataContratacao: e.target.value })}
            />
          </div>
          <Textarea
            label="Escopo do Serviço"
            required
            value={newService.descricaoEscopo}
            onChange={(e) => setNewService({ ...newService, descricaoEscopo: e.target.value })}
            placeholder="Descreva os entregáveis, SLA, objetivos..."
            rows={3}
          />
          <div className="flex justify-end pt-2 gap-2">
            <Button variant="outline" type="button" onClick={() => setNewModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar Serviço</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Histórico e Timeline de Eventos */}
      {selectedServico && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title={`Histórico de Entregas: ${
            TODOS_SERVICOS.find((t) => t.tipo === (selectedServico as any).tipoServico)?.nome || ''
          }`}
          className="max-w-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formulário para Novo Registro Manual */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#D8CBB8] h-fit space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#1E1A16]">
                Registrar Alteração
              </h4>
              <form onSubmit={handleAddLog} className="space-y-3">
                <Select
                  label="Status do Serviço"
                  required
                  value={actionLog.status}
                  onChange={(e) => setActionLog({ ...actionLog, status: e.target.value as StatusServico })}
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="PAUSADO">Pausado</option>
                  <option value="CANCELADO">Cancelado</option>
                </Select>
                <Input
                  label="Ação / Motivo"
                  required
                  placeholder="Ex: Renovação de contrato, alteração de escopo..."
                  value={actionLog.acao}
                  onChange={(e) => setActionLog({ ...actionLog, acao: e.target.value })}
                />
                <Textarea
                  label="Observação"
                  required
                  placeholder="Detalhes adicionais..."
                  value={actionLog.observacao}
                  onChange={(e) => setActionLog({ ...actionLog, observacao: e.target.value })}
                  rows={2}
                />
                <Button type="submit" className="w-full bg-[#181512] hover:bg-[#2B261F] text-white">
                  Registrar Log
                </Button>
              </form>
            </div>

            {/* Timeline de Eventos Reais (Inclui logs automáticos do Vivox GP) */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#1E1A16] sticky top-0 bg-[#FFFDF8] pb-1 z-10">
                Timeline & Auditoria do Serviço
              </h4>

              {(!selectedServico.historico || selectedServico.historico.length === 0) ? (
                <div className="py-8 text-center text-xs text-[#8F8271] bg-[#FAF7F2] rounded-xl border border-dashed border-[#D8CBB8]">
                  Nenhum evento registrado ainda. Conclusões de demandas no Vivox GP aparecerão aqui automaticamente.
                </div>
              ) : (
                <div className="relative border-l-2 border-[#D8CBB8] ml-3 space-y-4 pt-1">
                  {selectedServico.historico.map((item: any) => (
                    <div key={item.id} className="relative pl-5">
                      {/* Ponto na timeline */}
                      <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[#C7A15F] border-2 border-white shadow-2xs" />

                      <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl p-3 shadow-2xs">
                        <div className="flex items-center justify-between text-[10px] text-[#8F8271] mb-1">
                          <span className="font-bold text-[#1E1A16]">
                            {item.usuario?.nome || 'Equipe Vivox'}
                          </span>
                          <span>{new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                        </div>
                        <p className="text-xs font-semibold text-[#1E1A16] leading-relaxed">
                          {item.acao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Criação de Demanda no Vivox GP pré-vinculada ao Serviço */}
      {isTaskModalOpen && (
        <TaskFormModal
          initialStatus="A_FAZER"
          initialClienteId={cliente.id}
          initialServicoId={selectedServiceForTask}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedServiceForTask(null);
          }}
          onTaskCreated={() => {
            loadTarefas();
            loadServicos();
          }}
        />
      )}
    </div>
  );
}
