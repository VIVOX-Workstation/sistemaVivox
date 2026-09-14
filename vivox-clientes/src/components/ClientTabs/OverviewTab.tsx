import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cliente, ServicoContratado, Tarefa } from '../../types';
import { api } from '../../api/client';
import {
  Plus,
  Clock,
  Calendar as CalendarIcon,
  FileText,
  Filter,
  MessageSquare,
  Pin,
  CheckCircle2,
  Sparkles,
  FolderKanban,
  StickyNote
} from 'lucide-react';

interface Props {
  cliente: Cliente;
  onChange: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const STATUS_SERVICO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  ATIVO: { bg: 'bg-[#247A4A]/10 border-[#247A4A]/30', text: 'text-[#247A4A]', label: 'Ativo' },
  CONCLUIDO: { bg: 'bg-[#C7A15F]/15 border-[#C7A15F]/30', text: 'text-[#8A6828]', label: 'Concluído' },
  PAUSADO: { bg: 'bg-[#8F8271]/15 border-[#8F8271]/30', text: 'text-[#625746]', label: 'Pausado' },
  CANCELADO: { bg: 'bg-[#B83B32]/10 border-[#B83B32]/30', text: 'text-[#B83B32]', label: 'Cancelado' },
};

const STATUS_TAREFA_LABEL: Record<string, string> = {
  BACKLOG: 'Backlog',
  A_FAZER: 'A Fazer',
  EM_ANDAMENTO: 'Em Andamento',
  EM_REVISAO: 'Em Revisão',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export function OverviewTab({ cliente, onChange, onNavigateTab }: Props) {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState<ServicoContratado[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  // Observações rápidas
  const [observacoes, setObservacoes] = useState(cliente.observacoes || '');
  const [salvandoObs, setSalvandoObs] = useState(false);
  const [obsSalva, setObsSalva] = useState(false);

  useEffect(() => {
    loadDados();
  }, [cliente.id]);

  const loadDados = async () => {
    setLoading(true);
    try {
      const [resServicos, resTarefas] = await Promise.allSettled([
        api.get(`/servicos/cliente/${cliente.id}`),
        api.get('/tarefas'),
      ]);

      if (resServicos.status === 'fulfilled') {
        setServicos(resServicos.value.data || []);
      }
      if (resTarefas.status === 'fulfilled') {
        const allTasks: any[] = resTarefas.value.data || [];
        const clientTasks = allTasks.filter(
          (t) => t.clienteId === cliente.id || t.projeto?.clienteId === cliente.id
        );
        setTarefas(clientTasks);
      }
    } catch (e) {
      console.warn('Erro ao carregar serviços/tarefas na visão geral:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarObservacoes = async () => {
    setSalvandoObs(true);
    try {
      await api.patch(`/clientes/${cliente.id}`, { observacoes });
      onChange(cliente.id);
      setObsSalva(true);
      setTimeout(() => setObsSalva(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar diretrizes.');
    } finally {
      setSalvandoObs(false);
    }
  };

  const proximosPrazos = tarefas
    .filter((t) => t.prazo && t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA')
    .sort((a, b) => new Date(a.prazo!).getTime() - new Date(b.prazo!).getTime())
    .slice(0, 6);

  const atalhos = [
    {
      icone: <FolderKanban className="w-4 h-4" />,
      titulo: 'Mapa de Serviços',
      subtitulo: `${servicos.length} serviço(s) contratado(s)`,
      onClick: () => onNavigateTab?.('services'),
    },
    {
      icone: <Sparkles className="w-4 h-4" />,
      titulo: 'Estúdio de Criação & IA',
      subtitulo: 'Gerar copies e conteúdos para este cliente',
      onClick: () => onNavigateTab?.('ai-studio'),
      destaque: true,
    },
    {
      icone: <StickyNote className="w-4 h-4" />,
      titulo: 'Anotações',
      subtitulo: 'Registros e histórico do cliente',
      onClick: () => onNavigateTab?.('notes'),
    },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* ========================================================================= */}
      {/* 1. SERVIÇOS CONTRATADOS (DADOS REAIS)                                     */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFDF8] rounded-[28px] p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex items-center gap-2 bg-[#181512] text-[#C7A15F] px-5 py-2.5 rounded-full text-xs font-bold shadow-xs">
            <span>Serviços Contratados</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab?.('services')}
              title="Adicionar serviço"
              className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#181512] hover:text-[#C7A15F] text-[#625746] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/gp')}
              title="Ver demandas no GP"
              className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#181512] hover:text-[#C7A15F] text-[#625746] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs font-semibold text-[#8F8271]">
            Carregando serviços...
          </div>
        ) : servicos.length === 0 ? (
          <div
            onClick={() => onNavigateTab?.('services')}
            className="py-10 text-center rounded-[20px] border border-dashed border-[#D8CBB8] cursor-pointer hover:bg-[#FAF7F2] transition-all"
          >
            <p className="text-xs font-bold text-[#1E1A16]">Nenhum serviço contratado ainda</p>
            <p className="text-[12.5px] text-[#8F8271] mt-1">Clique para adicionar o primeiro serviço deste cliente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicos.slice(0, 6).map((servico) => {
              const statusInfo = STATUS_SERVICO_STYLE[servico.status] || STATUS_SERVICO_STYLE.ATIVO;
              return (
                <div
                  key={servico.id}
                  onClick={() => onNavigateTab?.('services')}
                  className={`rounded-[24px] p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[150px] border ${statusInfo.bg}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`text-[12.5px] font-bold ${statusInfo.text} bg-[#FFFDF8]/80 px-3 py-1 rounded-full`}>
                        {statusInfo.label}
                      </span>
                      {(servico.dataContratacao || servico.data_contratacao) && (
                        <span className="text-[12px] font-bold text-[#8F8271]">
                          {new Date(servico.dataContratacao || servico.data_contratacao!).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-[#1E1A16] leading-tight">
                      {(servico as any)?.nomePersonalizado || (servico.tipoServico || servico.tipo_servico || '').replace(/_/g, ' ')}
                    </h4>

                    {(servico.descricaoEscopo || servico.descricao_escopo) && (
                      <p className="text-[12.5px] text-[#625746] mt-2 line-clamp-2">
                        {servico.descricaoEscopo || servico.descricao_escopo}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SEÇÃO INFERIOR: PRÓXIMOS PRAZOS (REAL) + ATALHOS RÁPIDOS               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Próximos Prazos (dados reais de tarefas) */}
        <div className="lg:col-span-6 bg-[#FFFDF8] rounded-[28px] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-[#1E1A16] uppercase tracking-wider">
                Próximos Prazos
              </h3>
              <CalendarIcon className="w-3.5 h-3.5 text-[#8F8271]" />
            </div>
          </div>

          {proximosPrazos.length === 0 ? (
            <div className="py-8 text-center text-[12.5px] font-semibold text-[#8F8271]">
              Nenhum prazo agendado para este cliente.
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {proximosPrazos.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate('/gp')}
                  className="p-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#FAF2E4] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-[#1E1A16] truncate">{t.titulo}</h4>
                    <p className="text-[12px] text-[#8F8271] truncate">{STATUS_TAREFA_LABEL[t.status] || t.status}</p>
                  </div>
                  <span className="text-[12px] font-bold text-[#8A6828] bg-[#FAF2E4] px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(t.prazo!).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna Direita: Atalhos Rápidos */}
        <div className="lg:col-span-6 bg-[#FFFDF8] rounded-[28px] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-[#1E1A16] uppercase tracking-wider">
                Atalhos Rápidos
              </h3>
              <MessageSquare className="w-3.5 h-3.5 text-[#8F8271]" />
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {atalhos.map((atalho) => (
              <div
                key={atalho.titulo}
                onClick={atalho.onClick}
                className={`p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  atalho.destaque
                    ? 'bg-[#181512] text-white shadow-md border border-[#C7A15F]/20'
                    : 'bg-[#FAF7F2] hover:bg-[#FAF2E4] shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    atalho.destaque ? 'bg-[#C7A15F] text-[#181512]' : 'bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4]'
                  }`}>
                    {atalho.icone}
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-xs font-black truncate ${atalho.destaque ? 'text-white' : 'text-[#1E1A16]'}`}>
                      {atalho.titulo}
                    </h4>
                    <p className={`text-[12px] truncate ${atalho.destaque ? 'text-[#C7A15F]' : 'text-[#8F8271]'}`}>
                      {atalho.subtitulo}
                    </p>
                  </div>
                </div>
                <Pin className={`w-3.5 h-3.5 shrink-0 ${atalho.destaque ? 'text-[#C7A15F]' : 'text-[#8F8271]'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DIRETRIZES ESTRATÉGICAS (PALETA VIVOX GP)                               */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFDF8] rounded-[28px] p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#FAF2E4]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8A6828]" />
            <h3 className="text-xs font-black text-[#1E1A16] uppercase tracking-wider">
              Diretrizes Estratégicas da Conta
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {obsSalva && (
              <span className="text-[12.5px] font-bold text-[#247A4A] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Salvo!
              </span>
            )}
            <button
              onClick={handleSalvarObservacoes}
              disabled={salvandoObs}
              className="px-5 py-2 rounded-full bg-[#181512] hover:bg-[#2A241E] text-[#C7A15F] text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs border border-[#C7A15F]/20"
            >
              {salvandoObs ? 'Salvando...' : 'Salvar Diretrizes'}
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Insira as regras da marca, tom de voz e notas estratégicas..."
          className="w-full bg-[#FAF7F2] rounded-2xl p-4 text-xs text-[#1E1A16] leading-relaxed outline-none border-0 focus:ring-1 focus:ring-[#C7A15F] transition-all resize-y"
        />
      </div>
    </div>
  );
}
