import React, { useEffect, useState } from 'react';
import type { Cliente, ServicoContratado, StatusServico, TipoServico } from '../../types';
import { api } from '../../api/client';
import { Button } from '../Button';
import { Input } from '../Input';
import { Select } from '../Select';
import { Textarea } from '../Textarea';
import { Modal } from '../Modal';
import { Badge } from '../Badge';
import { Plus, History, ChevronRight, Lock } from 'lucide-react';

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

export function ServicesTab({ cliente }: Props) {
  const [servicos, setServicos] = useState<ServicoContratado[]>([]);
  const [isNewModalOpen, setNewModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedServico, setSelectedServico] = useState<ServicoContratado | null>(null);
  const [actionLog, setActionLog] = useState({ acao: '', observacao: '', status: '' as StatusServico });

  const [newService, setNewService] = useState<any>({
    tipoServico: 'GERENCIAMENTO_REDES',
    status: 'ATIVO',
    dataContratacao: new Date().toISOString().split('T')[0],
    descricaoEscopo: '',
  });

  useEffect(() => {
    loadServicos();
  }, [cliente.id]);

  const loadServicos = async () => {
    try {
      const response = await api.get(`/servicos/cliente/${cliente.id}`);
      setServicos(response.data.sort((a: any, b: any) => new Date(b.dataContratacao).getTime() - new Date(a.dataContratacao).getTime()));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        clienteId: cliente.id,
        tipoServico: newService.tipoServico as TipoServico,
        status: newService.status as StatusServico,
        dataContratacao: newService.dataContratacao ? new Date(newService.dataContratacao).toISOString() : new Date().toISOString(),
        descricaoEscopo: newService.descricaoEscopo || '',
      };
      await api.post('/servicos', payload);
      setNewModalOpen(false);
      loadServicos();
    } catch (e) {
      alert("Erro ao criar serviço");
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServico) return;

    try {
      await api.patch(`/servicos/${selectedServico.id}`, {
        status: actionLog.status || selectedServico.status,
      });
      // Em uma aplicação real, salvaríamos o log no ServicoHistorico endpoint.
      setHistoryModalOpen(false);
      setSelectedServico(null);
      setActionLog({ acao: '', observacao: '', status: 'ATIVO' });
      loadServicos();
    } catch (e) {
      alert("Erro ao atualizar o serviço");
    }
  };

  const openHistory = (s: ServicoContratado) => {
    setSelectedServico(s);
    setActionLog({ acao: '', observacao: '', status: s.status });
    setHistoryModalOpen(true);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Serviços e Históricos</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...TODOS_SERVICOS].sort((a, b) => {
          const contratadoA = servicos.find((s: any) => s.tipoServico === a.tipo);
          const contratadoB = servicos.find((s: any) => s.tipoServico === b.tipo);
          if (contratadoA && !contratadoB) return -1;
          if (!contratadoA && contratadoB) return 1;
          return 0;
        }).map(servicoInfo => {
          const contratado = servicos.find((s: any) => s.tipoServico === servicoInfo.tipo) as any;
          
          if (contratado) {
            return (
              <div 
                key={servicoInfo.tipo} 
                className="relative rounded-xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                onClick={() => openHistory(contratado)}
                style={{ minHeight: '220px' }}
              >
                {/* Background Image */}
                <img 
                  src={servicoInfo.imagem} 
                  alt={servicoInfo.nome} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/20" />
                
                {/* Content */}
                <div className="relative h-full flex flex-col p-5">
                  <div className="flex justify-between items-start mb-auto">
                    <Badge 
                      variant={contratado.status === 'ATIVO' ? 'success' : contratado.status === 'CANCELADO' ? 'danger' : contratado.status === 'PAUSADO' ? 'warning' : 'default'} 
                      className="capitalize bg-opacity-90 backdrop-blur-sm"
                    >
                      {contratado.status.toLowerCase()}
                    </Badge>
                    <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full text-white">
                      <History className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-bold text-lg text-white mb-1 shadow-black/50 drop-shadow-sm">{servicoInfo.nome}</h4>
                    <p className="text-sm text-slate-300 mb-3 line-clamp-2">{contratado.descricaoEscopo}</p>
                    
                    <div className="pt-3 border-t border-white/20 flex justify-between items-center text-xs text-slate-300">
                      <span>Início: {new Date(contratado.dataContratacao).toLocaleDateString('pt-BR')}</span>
                      <span className="flex items-center text-white font-medium group-hover:underline">
                        Ver Histórico <ChevronRight className="w-3 h-3 ml-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={servicoInfo.tipo} 
              className="relative rounded-xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              onClick={() => handleOpenNewModal(servicoInfo.tipo)}
              style={{ minHeight: '220px' }}
            >
              {/* Background Image - Grayscale for locked */}
              <img 
                src={servicoInfo.imagem} 
                alt={servicoInfo.nome} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter grayscale opacity-40 group-hover:opacity-60 group-hover:grayscale-0"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/80 to-slate-900/50" />
              
              {/* Content */}
              <div className="relative h-full flex flex-col p-5">
                <div className="flex justify-between items-start mb-auto">
                  <Badge variant="default" className="bg-slate-800/80 text-slate-300 backdrop-blur-sm border-slate-600">
                    Não Contratado
                  </Badge>
                  <div className="bg-slate-800/80 backdrop-blur-sm p-1.5 rounded-full text-slate-400 group-hover:text-indigo-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-bold text-lg text-slate-200 group-hover:text-white mb-1 shadow-black/50 drop-shadow-sm transition-colors">{servicoInfo.nome}</h4>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 mb-3 line-clamp-2 transition-colors">{servicoInfo.descricao}</p>
                  
                  <div className="pt-3 border-t border-slate-600/50 flex justify-between items-center text-xs text-slate-400">
                    <span>Disponível para compra</span>
                    <span className="flex items-center text-slate-300 font-medium group-hover:text-indigo-400 group-hover:underline transition-colors">
                      Contratar <Plus className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </div>
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
            onChange={e => setNewService({...newService, tipoServico: e.target.value as TipoServico})}
          >
            {TODOS_SERVICOS.map(s => (
              <option key={s.tipo} value={s.tipo}>{s.nome}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Status Inicial" 
              required 
              value={newService.status} 
              onChange={e => setNewService({...newService, status: e.target.value as StatusServico})}
            >
              <option value="ATIVO">Ativo</option>
              <option value="PAUSADO">Pausado</option>
            </Select>
            <Input 
              label="Data de Contratação" 
              type="date" 
              required 
              value={newService.dataContratacao} 
              onChange={e => setNewService({...newService, dataContratacao: e.target.value})} 
            />
          </div>
          <Textarea 
            label="Escopo do Serviço" 
            required 
            value={newService.descricaoEscopo} 
            onChange={e => setNewService({...newService, descricaoEscopo: e.target.value})} 
            placeholder="Descreva os entregáveis, SLA, etc." 
            rows={3} 
          />
          <div className="flex justify-end pt-2 gap-2">
            <Button variant="outline" type="button" onClick={() => setNewModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Histórico */}
      {selectedServico && (
        <Modal 
          isOpen={isHistoryModalOpen} 
          onClose={() => setHistoryModalOpen(false)} 
          title={`Histórico: ${TODOS_SERVICOS.find(t => t.tipo === (selectedServico as any).tipoServico)?.nome || ''}`} 
          className="max-w-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formulário para Novo Registro */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-fit">
              <h4 className="font-semibold text-slate-800 mb-4">Registrar Alteração</h4>
              <form onSubmit={handleAddLog} className="space-y-4">
                <Select 
                  label="Novo Status do Serviço" 
                  required 
                  value={actionLog.status} 
                  onChange={e => setActionLog({...actionLog, status: e.target.value as StatusServico})}
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="PAUSADO">Pausado</option>
                  <option value="CANCELADO">Cancelado</option>
                </Select>
                <Input 
                  label="Ação / Motivo" 
                  required 
                  placeholder="Ex: Renovação, Mudança de escopo..." 
                  value={actionLog.acao} 
                  onChange={e => setActionLog({...actionLog, acao: e.target.value})} 
                />
                <Textarea 
                  label="Observação" 
                  required 
                  placeholder="Detalhes da alteração..." 
                  value={actionLog.observacao} 
                  onChange={e => setActionLog({...actionLog, observacao: e.target.value})} 
                  rows={3} 
                />
                <Button type="submit" className="w-full">Registrar</Button>
              </form>
            </div>

            {/* Timeline */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <h4 className="font-semibold text-slate-800 sticky top-0 bg-white pb-2 z-10">Timeline de Eventos</h4>
              <div className="relative border-l border-slate-200 ml-3 space-y-6">
                <p className="text-sm text-slate-500 pl-4">Integração do histórico pendente no backend MVP.</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
