import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ServicoContratado, Tarefa, StatusTarefa } from '../types';
import { api } from '../api/client';
import { tarefasApi } from '../api/tarefas';
import { TaskModal } from '../components/gp/TaskModal';
import { TaskFormModal } from '../components/gp/TaskFormModal';
import { Modal } from '../components/Modal';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Building2, 
  Plus, 
  FileText, 
  Sparkles, 
  ExternalLink, 
  Kanban, 
  Layers, 
  Save, 
  Loader2, 
  ChevronRight,
  Smartphone,
  Globe,
  Palette,
  Code2,
  Trash2,
  Edit3,
  Zap,
  BookOpen,
  FolderOpen,
  CheckSquare,
  Square,
  Link as LinkIcon,
  Layout,
  FileCheck2,
  Milestone,
  Maximize2
} from 'lucide-react';

export interface EstruturaSecao {
  id: string;
  titulo: string;
  descricao?: string;
}

export interface EtapaProducao {
  id: string;
  titulo: string;
  concluido: boolean;
}

export interface ItemPlanejado {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'BRIEFING' | 'PLANEJAMENTO' | 'EM_PRODUCAO' | 'EM_REVISAO' | 'CONCLUIDO';
  prazo?: string;
  linkFigma?: string;
  linkFinal?: string;
  penpotUrl?: string;
  copyTexto?: string;
  estrutura: EstruturaSecao[];
  etapas: EtapaProducao[];
  createdAt: string;
}

const getPenpotBaseUrl = () => {
  if (import.meta.env.VITE_PENPOT_URL) {
    return import.meta.env.VITE_PENPOT_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:9005`;
  }
  return 'http://localhost:9005';
};

const resolvePenpotUrl = (url?: string) => {
  const base = getPenpotBaseUrl();
  if (!url || !url.trim()) return base;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return url.replace('http://localhost:9005', base).replace('http://127.0.0.1:9005', base);
  }
  return url;
};

export function PlanejamentoServico() {
  const { id: clienteId, servicoId, itemId: paramItemId } = useParams<{
    id: string;
    servicoId: string;
    itemId?: string;
  }>();
  const navigate = useNavigate();

  const [servico, setServico] = useState<ServicoContratado | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [itens, setItens] = useState<ItemPlanejado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Item selecionado via rota de URL
  const selectedItemId = paramItemId || null;

  // Aba dentro do item selecionado: 'estrutura' | 'copy' | 'etapas' | 'links' | 'penpot'
  const [abaItem, setAbaItem] = useState<'estrutura' | 'copy' | 'etapas' | 'links' | 'penpot'>('estrutura');

  // Modal Novo Item / Peça
  const [isNovoItemModalOpen, setIsNovoItemModalOpen] = useState(false);
  const [novoItemTitulo, setNovoItemTitulo] = useState('');
  const [novoItemDescricao, setNovoItemDescricao] = useState('');
  const [novoItemPrazo, setNovoItemPrazo] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');

  // IA Loading states
  const [loadingIaEstrutura, setLoadingIaEstrutura] = useState(false);
  const [loadingIaCopy, setLoadingIaCopy] = useState(false);
  const [loadingPenpotCreation, setLoadingPenpotCreation] = useState(false);

  // Modais de Tarefas GP
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [initialTaskTitle, setInitialTaskTitle] = useState('');
  const [initialTaskDesc, setInitialTaskDesc] = useState('');

  // Nome do tipo de serviço
  const tipoStr = servico?.tipoServico || servico?.tipo_servico || 'LANDING_PAGE';
  const nomeFormatadoServico = tipoStr.replace(/_/g, ' ');

  const getNomeItemSingular = () => {
    switch (tipoStr) {
      case 'LANDING_PAGE': return 'Landing Page';
      case 'FOLDER': return 'Folder';
      case 'REVISTA': return 'Revista / Catálogo';
      case 'APP': return 'App / Projeto';
      case 'VIDEO': return 'Vídeo / Produção';
      case 'FOTOGRAFIA': return 'Ensaio Fotográfico';
      case 'IDENTIDADE_VISUAL': return 'Identidade Visual';
      case 'GERENCIAMENTO_REDES': return 'Rede Social / Post';
      default: return 'Projeto / Peça';
    }
  };

  const getNomeItemPlural = () => {
    switch (tipoStr) {
      case 'LANDING_PAGE': return 'Landing Pages';
      case 'FOLDER': return 'Folders';
      case 'REVISTA': return 'Revistas & Catálogos';
      case 'APP': return 'Projetos de App';
      case 'VIDEO': return 'Vídeos & Produções';
      case 'FOTOGRAFIA': return 'Ensaios Fotográficos';
      case 'IDENTIDADE_VISUAL': return 'Projetos de Identidade Visual';
      case 'GERENCIAMENTO_REDES': return 'Campanhas de Redes';
      default: return 'Projetos & Peças';
    }
  };

  const carregarDados = async () => {
    if (!servicoId) return;
    setLoading(true);
    try {
      const [servicoRes, tarefasRes, planRes] = await Promise.all([
        api.get<ServicoContratado>(`/servicos/${servicoId}`),
        tarefasApi.getTarefas({ servicoId }).catch(() => []),
        api.get(`/planejamento-servico/servico/${servicoId}`).catch(() => ({ data: null })),
      ]);

      setServico(servicoRes.data);
      setTarefas(tarefasRes);

      let resolvedClientName = servicoRes.data?.cliente?.nomeFantasia;
      if (!resolvedClientName && clienteId) {
        try {
          const cRes = await api.get(`/clientes/${clienteId}`);
          resolvedClientName = cRes.data?.nomeFantasia || cRes.data?.razaoSocial || cRes.data?.nome;
        } catch (_) {}
      }
      if (resolvedClientName) {
        setNomeCliente(resolvedClientName);
      }

      // Carrega itens planejados daquele serviço
      let itensCarregados: ItemPlanejado[] = [];
      const storageKey = `@Vivox:itensPlanejados:${servicoId}`;
      const savedLocal = localStorage.getItem(storageKey);

      if (savedLocal !== null) {
        try {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed)) {
            itensCarregados = parsed;
          }
        } catch (_) {}
      } else if (planRes.data && Array.isArray(planRes.data.flowNodes)) {
        itensCarregados = planRes.data.flowNodes;
      } else {
        // Se nunca foi inicializado, inicia vazio para o usuário cadastrar
        itensCarregados = [];
        localStorage.setItem(storageKey, JSON.stringify([]));
      }

      // Normaliza itens caso existam para garantir integridade
      if (itensCarregados.length > 0) {
        itensCarregados = itensCarregados.map((item: any, idx: number) => ({
          id: item.id || `item-${Date.now()}-${idx}`,
          titulo: item.titulo || `${getNomeItemSingular()} ${idx + 1}`,
          descricao: item.descricao || '',
          status: item.status || 'BRIEFING',
          prazo: item.prazo || '',
          linkFigma: item.linkFigma || '',
          linkFinal: item.linkFinal || '',
          penpotUrl: item.penpotUrl || '',
          copyTexto: item.copyTexto || '',
          estrutura: Array.isArray(item.estrutura)
            ? item.estrutura
            : [
                { id: 's1', titulo: '1. Abertura / Capa', descricao: 'Apresentação principal da peça.' },
                { id: 's2', titulo: '2. Conteúdo Central', descricao: 'Diferenciais e argumentos principais.' },
                { id: 's3', titulo: '3. Fechamento & Chamada para Ação', descricao: 'Contatos e próximos passos.' },
              ],
          etapas: Array.isArray(item.etapas) && item.etapas.length > 0
            ? item.etapas
            : [
                { id: 'e1', titulo: '1. Briefing e alinhamento', concluido: true },
                { id: 'e2', titulo: '2. Redação de conteúdo / Copy', concluido: false },
                { id: 'e3', titulo: '3. Design e diagramação', concluido: false },
                { id: 'e4', titulo: '4. Aprovação e entrega', concluido: false },
              ],
          createdAt: item.createdAt || new Date().toISOString(),
        }));
      }

      setItens(itensCarregados);
    } catch (err: any) {
      console.error('Erro ao carregar planejamento:', err);
      setError('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [servicoId]);

  const salvarItensNoStorage = async (novosItens: ItemPlanejado[]) => {
    setItens(novosItens);
    if (servicoId) {
      const storageKey = `@Vivox:itensPlanejados:${servicoId}`;
      localStorage.setItem(storageKey, JSON.stringify(novosItens));
      try {
        const res = await api.get(`/planejamento-servico/servico/${servicoId}`).catch(() => ({ data: null }));
        if (res.data?.id) {
          await api.patch(`/planejamento-servico/${res.data.id}`, { flowNodes: novosItens });
        } else {
          await api.post('/planejamento-servico', { servicoContratadoId: servicoId, flowNodes: novosItens });
        }
      } catch (err) {
        console.warn('Erro ao sincronizar com backend:', err);
      }
    }
  };

  const handleCriarNovoItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItemTitulo.trim()) return;

    let penpotFileUrl = getPenpotBaseUrl();
    try {
      const clientName = nomeCliente || servico?.cliente?.nomeFantasia || 'Cliente';
      const penpotRes = await api.post<{ url: string }>('/penpot/criar-arquivo', {
        titulo: novoItemTitulo.trim(),
        clienteNome: clientName,
      });
      if (penpotRes.data?.url) {
        penpotFileUrl = penpotRes.data.url;
      }
    } catch (err) {
      console.warn('Não foi possível gerar URL do Penpot automaticamente:', err);
    }

    const novo: ItemPlanejado = {
      id: `item-${Date.now()}`,
      titulo: novoItemTitulo.trim(),
      descricao: novoItemDescricao.trim(),
      status: 'BRIEFING',
      prazo: novoItemPrazo || new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      penpotUrl: penpotFileUrl,
      copyTexto: '',
      estrutura: [
        { id: 's1', titulo: '1. Abertura / Capa', descricao: 'Apresentação principal da peça.' },
        { id: 's2', titulo: '2. Conteúdo Central', descricao: 'Diferenciais e argumentos principais.' },
        { id: 's3', titulo: '3. Fechamento & Chamada para Ação', descricao: 'Contatos e próximos passos.' },
      ],
      etapas: [
        { id: 'e1', titulo: '1. Briefing e alinhamento', concluido: false },
        { id: 'e2', titulo: '2. Redação de conteúdo / Copy', concluido: false },
        { id: 'e3', titulo: '3. Design e diagramação', concluido: false },
        { id: 'e4', titulo: '4. Aprovação e entrega', concluido: false },
      ],
      createdAt: new Date().toISOString(),
    };

    const atualizados = [...itens, novo];
    salvarItensNoStorage(atualizados);
    setIsNovoItemModalOpen(false);
    setNovoItemTitulo('');
    setNovoItemDescricao('');
    setNovoItemPrazo('');
    navigate(`/cliente/${clienteId}/servicos/${servicoId}/planejamento/${novo.id}`);
  };

  const handleGerarPranchetaPenpot = async () => {
    if (!itemAtivo) return;
    setLoadingPenpotCreation(true);
    try {
      const clientName = nomeCliente || servico?.cliente?.nomeFantasia || 'Cliente';
      const penpotRes = await api.post<{ url: string }>('/penpot/criar-arquivo', {
        titulo: itemAtivo.titulo,
        clienteNome: clientName,
      });
      if (penpotRes.data?.url) {
        atualizarItemAtivo({ penpotUrl: penpotRes.data.url });
      }
    } catch (err) {
      console.error('Erro ao gerar prancheta Penpot:', err);
    } finally {
      setLoadingPenpotCreation(false);
    }
  };

  const handleDeletarItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Tem certeza que deseja excluir esta ${getNomeItemSingular()}?`)) return;
    const atualizados = itens.filter((i) => i.id !== id);
    salvarItensNoStorage(atualizados);
    if (selectedItemId === id) {
      navigate(`/cliente/${clienteId}/servicos/${servicoId}/planejamento`);
    }
  };

  // Item atualmente em edição
  const itemAtivo = itens.find((i) => i.id === selectedItemId) || null;

  const atualizarItemAtivo = (campos: Partial<ItemPlanejado>) => {
    if (!itemAtivo) return;
    const atualizados = itens.map((i) => (i.id === itemAtivo.id ? { ...i, ...campos } : i));
    salvarItensNoStorage(atualizados);
  };

  // --- IA COPILOT: GERAR ESTRUTURA DA PEÇA ---
  const handleGerarEstruturaIa = async () => {
    if (!itemAtivo || !servico) return;
    setLoadingIaEstrutura(true);
    try {
      const prompt = `Atue como Especialista em Criação e Planejamento da agência Vivox.
Gere a estrutura de seções/telas/dobras recomendada para a peça "${itemAtivo.titulo}" (${nomeFormatadoServico}) da empresa "${servico.cliente?.nomeFantasia || 'Cliente'}".

Retorne OBRIGATORIAMENTE um array JSON válido contendo objetos no formato:
[
  {
    "titulo": "1. Nome da Seção / Dobra / Tela",
    "descricao": "Objetivo e o que deve conter nesta parte da peça"
  }
]`;

      const res = await api.post<{ resposta: string }>('/ia/chat', {
        pergunta: prompt,
        clienteId: clienteId || undefined,
      });

      if (res.data?.resposta) {
        const matchJson = res.data.resposta.match(/\[[\s\S]*\]/);
        if (matchJson) {
          const parsed = JSON.parse(matchJson[0]);
          const novaEstrutura: EstruturaSecao[] = parsed.map((s: any, idx: number) => ({
            id: `sec-${Date.now()}-${idx}`,
            titulo: s.titulo || `Seção ${idx + 1}`,
            descricao: s.descricao || '',
          }));
          atualizarItemAtivo({ estrutura: novaEstrutura });
        }
      }
    } catch (err) {
      console.error('Erro ao gerar estrutura com IA:', err);
    } finally {
      setLoadingIaEstrutura(false);
    }
  };

  // --- IA COPILOT: GERAR COPYWRITING & TEXTOS ---
  const handleGerarCopyIa = async () => {
    if (!itemAtivo || !servico) return;
    setLoadingIaCopy(true);
    try {
      const prompt = `Atue como Copywriter sênior e estrategista de conversão da agência Vivox.
Escreva a Copy completa (Headline, Subheadline, Argumentos de Venda, Benefícios e CTAs) para a peça "${itemAtivo.titulo}" (${nomeFormatadoServico}) da empresa "${servico.cliente?.nomeFantasia || 'Cliente'}".`;

      const res = await api.post<{ resposta: string }>('/ia/chat', {
        pergunta: prompt,
        clienteId: clienteId || undefined,
      });

      if (res.data?.resposta) {
        atualizarItemAtivo({ copyTexto: res.data.resposta });
      }
    } catch (err) {
      console.error('Erro ao gerar copy com IA:', err);
    } finally {
      setLoadingIaCopy(false);
    }
  };

  const handleExportarItemParaGP = () => {
    if (!itemAtivo) return;
    setInitialTaskTitle(`[${nomeFormatadoServico}] ${itemAtivo.titulo}`);
    setInitialTaskDesc(
      `Planejamento da Peça:\n${itemAtivo.descricao || ''}\n\nLink Figma: ${itemAtivo.linkFigma || 'N/A'}\n\nEtapas de Produção:\n` +
      itemAtivo.etapas.map((e) => `- [${e.concluido ? 'x' : ' '}] ${e.titulo}`).join('\n')
    );
    setIsCreateTaskModalOpen(true);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C7A15F]" />
        <span className="text-sm font-semibold text-[#8F8271]">
          Carregando Planejamento de {nomeFormatadoServico}...
        </span>
      </div>
    );
  }

  if (error || !servico) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm font-bold text-[#B83B32] mb-4">{error || 'Serviço não encontrado'}</p>
        <button
          onClick={() => navigate(`/cliente/${clienteId}?tab=services`)}
          className="px-4 py-2 bg-[#181512] text-white rounded-xl text-xs font-bold"
        >
          Voltar ao Mapa de Serviços
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-20 bg-[#FAF7F2]">
      {/* ======================================================== */}
      {/* 1. SE NENHUM ITEM ESTIVER SELECIONADO: LISTA DE ITENS   */}
      {/* ======================================================== */}
      {!selectedItemId && (
        <>
          {/* Cabeçalho do Serviço */}
          <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/cliente/${clienteId}?tab=services`)}
                title="Voltar ao Mapa de Serviços do cliente"
                className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#D8CBB8] hover:border-[#1E1A16] hover:bg-white flex items-center justify-center text-[#1E1A16] transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8F8271] flex items-center gap-1">
                    <Layout className="w-3.5 h-3.5 text-[#C7A15F]" />
                    Central de Projetos & Planejamento
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#247A4A]/10 text-[#247A4A] border border-[#247A4A]/30">
                    {servico.status}
                  </span>
                </div>

                <h1 className="text-2xl lg:text-3xl font-black text-[#1E1A16] tracking-tight leading-tight mt-0.5">
                  {getNomeItemPlural()} de {servico.cliente?.nomeFantasia || 'Cliente'}
                </h1>

                <p className="text-xs text-[#625746] flex items-center gap-2 mt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#C7A15F]" />
                    <span className="font-bold text-[#1E1A16]">{servico.cliente?.nomeFantasia || 'Cliente'}</span>
                  </span>
                  <span>•</span>
                  <span>{itens.length} {itens.length === 1 ? `${getNomeItemSingular().toLowerCase()} cadastrada` : `${getNomeItemPlural().toLowerCase()} cadastradas`}</span>
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => navigate(`/gp?clienteId=${clienteId}&servicoId=${servico.id}`)}
                className="px-4 py-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-white border border-[#D8CBB8] hover:border-[#1E1A16] text-xs font-bold text-[#1E1A16] flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Kanban className="w-4 h-4 text-[#C7A15F]" />
                <span>Ver no Vivox GP</span>
                <ExternalLink className="w-3 h-3 text-[#8F8271]" />
              </button>

              <button
                onClick={() => setIsNovoItemModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo {getNomeItemSingular()}</span>
              </button>
            </div>
          </div>

          {/* Grade de Cards das Peças/Itens Criados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#1E1A16] uppercase tracking-wider">
                Selecione um item para abrir o planejamento detalhado:
              </h3>
            </div>

            {itens.length === 0 ? (
              <div
                onClick={() => setIsNovoItemModalOpen(true)}
                className="py-16 border-2 border-dashed border-[#D8CBB8] hover:border-[#1E1A16] bg-[#FFFDF8] rounded-3xl flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all group p-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#D8CBB8] flex items-center justify-center text-[#1E1A16] group-hover:scale-110 transition-transform shadow-xs">
                  <Plus className="w-7 h-7 text-[#C7A15F]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E1A16]">Nenhum item cadastrado</h3>
                  <p className="text-xs text-[#8F8271] mt-1 max-w-md">
                    Clique aqui para criar o primeiro {getNomeItemSingular().toLowerCase()} e planejar a estrutura, copy e etapas.
                  </p>
                </div>
                <button className="mt-2 px-4 py-2 bg-[#181512] text-white text-xs font-bold rounded-xl shadow-xs">
                  + Criar {getNomeItemSingular()}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {itens.map((item, idx) => {
                  const etapas = Array.isArray(item.etapas) ? item.etapas : [];
                  const etapasConcluidas = etapas.filter((e) => e && e.concluido).length;
                  const totalEtapas = etapas.length;
                  const percentual = totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/cliente/${clienteId}/servicos/${servicoId}/planejamento/${item.id}`)}
                      className="bg-[#FFFDF8] border border-[#D8CBB8] hover:border-[#C7A15F] rounded-3xl p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
                      style={{ minHeight: '260px' }}
                    >
                      <div className="space-y-3">
                        {/* Topo do Card */}
                        <div className="flex justify-between items-start">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FAF7F2] border border-[#D8CBB8] text-[#1E1A16]">
                            {getNomeItemSingular()} #{idx + 1}
                          </span>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                item.status === 'CONCLUIDO'
                                  ? 'bg-[#247A4A]/10 text-[#247A4A] border-[#247A4A]/30'
                                  : item.status === 'EM_PRODUCAO'
                                  ? 'bg-[#FFA800]/15 text-[#B45309] border-[#FFA800]/30'
                                  : 'bg-[#181512]/10 text-[#181512] border-[#181512]/20'
                              }`}
                            >
                              {item.status.replace(/_/g, ' ')}
                            </span>

                            <button
                              onClick={(e) => handleDeletarItem(item.id, e)}
                              title="Excluir item"
                              className="text-[#8F8271] hover:text-[#B83B32] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Título & Descrição */}
                        <div>
                          <h4 className="font-black text-base text-[#1E1A16] group-hover:text-[#C7A15F] transition-colors line-clamp-1">
                            {item.titulo}
                          </h4>
                          <p className="text-xs text-[#625746] mt-1 line-clamp-2 leading-relaxed">
                            {item.descricao || 'Sem descrição cadastrada.'}
                          </p>
                        </div>

                        {/* Progresso das Etapas */}
                        <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-[#1E1A16]">
                              {etapasConcluidas}/{totalEtapas} etapas
                            </span>
                            <span className="text-[#C7A15F]">{percentual}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#E5D9C8] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#C7A15F] rounded-full transition-all duration-500"
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Rodapé do Card */}
                      <div className="pt-4 border-t border-[#D8CBB8] flex items-center justify-between text-xs text-[#8F8271]">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          Prazo: {item.prazo ? new Date(item.prazo).toLocaleDateString('pt-BR') : 'A definir'}
                        </span>

                        <span className="font-bold text-[#1E1A16] flex items-center gap-1 group-hover:text-[#C7A15F] transition-colors">
                          Planejar <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 2. SE UM ITEM ESTIVER SELECIONADO: PLANEJAMENTO DA PEÇA  */}
      {/* ======================================================== */}
      {itemAtivo && (
        <div className="space-y-6">
          {/* Barra Superior de Retorno & Título do Item */}
          <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/cliente/${clienteId}/servicos/${servicoId}/planejamento`)}
                title={`Voltar para todos os ${getNomeItemPlural()}`}
                className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#D8CBB8] hover:border-[#1E1A16] hover:bg-white flex items-center justify-center text-[#1E1A16] transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8F8271]">
                    Planejamento • {nomeFormatadoServico}
                  </span>
                  <select
                    value={itemAtivo.status}
                    onChange={(e) => atualizarItemAtivo({ status: e.target.value as any })}
                    className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#D8CBB8] text-[#1E1A16] outline-none cursor-pointer"
                  >
                    <option value="BRIEFING">Briefing</option>
                    <option value="PLANEJAMENTO">Planejamento</option>
                    <option value="EM_PRODUCAO">Em Produção</option>
                    <option value="EM_REVISAO">Em Revisão</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="text"
                    value={itemAtivo.titulo}
                    onChange={(e) => atualizarItemAtivo({ titulo: e.target.value })}
                    className="text-2xl font-black text-[#1E1A16] bg-transparent border-b border-transparent hover:border-[#D8CBB8] focus:border-[#C7A15F] outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Ações Rápidas da Peça */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleExportarItemParaGP}
                className="px-4 py-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-white border border-[#D8CBB8] hover:border-[#1E1A16] text-xs font-bold text-[#1E1A16] flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Zap className="w-4 h-4 text-[#C7A15F]" />
                <span>Exportar Demanda para o GP</span>
              </button>

              <button
                onClick={() => navigate(`/cliente/${clienteId}/servicos/${servicoId}/planejamento`)}
                className="px-5 py-2.5 rounded-2xl bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Concluir Planejamento</span>
              </button>
            </div>
          </div>

          {/* Seletor de Abas de Planejamento da Peça */}
          <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-2xl p-1.5 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setAbaItem('estrutura')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                abaItem === 'estrutura'
                  ? 'bg-[#181512] text-white shadow-xs'
                  : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#FAF7F2]'
              }`}
            >
              <Layout className="w-4 h-4 text-[#C7A15F]" />
              <span>1. Estrutura & Seções ({(itemAtivo.estrutura || []).length})</span>
            </button>

            <button
              onClick={() => setAbaItem('copy')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                abaItem === 'copy'
                  ? 'bg-[#181512] text-white shadow-xs'
                  : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#FAF7F2]'
              }`}
            >
              <FileText className="w-4 h-4 text-[#C7A15F]" />
              <span>2. Textos, Copy & Briefing</span>
            </button>

            <button
              onClick={() => setAbaItem('etapas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                abaItem === 'etapas'
                  ? 'bg-[#181512] text-white shadow-xs'
                  : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#FAF7F2]'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-[#C7A15F]" />
              <span>
                3. Checklist de Produção ({(itemAtivo.etapas || []).filter((e) => e && e.concluido).length}/{(itemAtivo.etapas || []).length})
              </span>
            </button>

            <button
              onClick={() => setAbaItem('links')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                abaItem === 'links'
                  ? 'bg-[#181512] text-white shadow-xs'
                  : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#FAF7F2]'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-[#C7A15F]" />
              <span>4. Links (Figma / Publicação)</span>
            </button>

            <button
              onClick={() => setAbaItem('penpot')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                abaItem === 'penpot'
                  ? 'bg-[#181512] text-white shadow-xs'
                  : 'text-[#625746] hover:text-[#1E1A16] hover:bg-[#FAF7F2]'
              }`}
            >
              <Palette className="w-4 h-4 text-[#C7A15F]" />
              <span>5. 🎨 Estúdio Penpot (Figma)</span>
            </button>
          </div>

          {/* ABA ITEM 1: ESTRUTURA & SEÇÕES */}
          {abaItem === 'estrutura' && (
            <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-[#1E1A16] uppercase tracking-wider flex items-center gap-2">
                    <Layout className="w-4 h-4 text-[#C7A15F]" />
                    Estrutura de Seções / Dobras / Telas
                  </h3>
                  <p className="text-xs text-[#8F8271]">
                    Defina a sequência de conteúdo e blocos visuais desta peça
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGerarEstruturaIa}
                    disabled={loadingIaEstrutura}
                    className="px-3.5 py-1.5 rounded-full bg-[#C7A15F]/20 hover:bg-[#C7A15F]/30 text-[#8F6F2D] border border-[#C7A15F]/40 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loadingIaEstrutura ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C7A15F]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#C7A15F]" />
                    )}
                    Gerar Estrutura com IA
                  </button>

                  <button
                    onClick={() => {
                      const nova: EstruturaSecao = {
                        id: `sec-${Date.now()}`,
                        titulo: `${itemAtivo.estrutura.length + 1}. Nova Seção`,
                        descricao: '',
                      };
                      atualizarItemAtivo({ estrutura: [...itemAtivo.estrutura, nova] });
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Bloco
                  </button>
                </div>
              </div>

              {/* Lista de Blocos Estruturais */}
              <div className="space-y-3">
                {(itemAtivo.estrutura || []).map((sec, sIdx) => (
                  <div
                    key={sec.id}
                    className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <span className="w-7 h-7 rounded-xl bg-[#181512] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {sIdx + 1}
                      </span>
                      <div className="space-y-1 flex-1">
                        <input
                          type="text"
                          value={sec.titulo}
                          onChange={(e) => {
                            const updated = [...(itemAtivo.estrutura || [])];
                            updated[sIdx].titulo = e.target.value;
                            atualizarItemAtivo({ estrutura: updated });
                          }}
                          className="font-bold text-sm text-[#1E1A16] bg-transparent outline-none w-full border-b border-transparent focus:border-[#C7A15F]"
                        />
                        <input
                          type="text"
                          placeholder="Objetivo ou conteúdo desta parte..."
                          value={sec.descricao || ''}
                          onChange={(e) => {
                            const updated = [...(itemAtivo.estrutura || [])];
                            updated[sIdx].descricao = e.target.value;
                            atualizarItemAtivo({ estrutura: updated });
                          }}
                          className="text-xs text-[#625746] bg-transparent outline-none w-full"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const updated = (itemAtivo.estrutura || []).filter((_, idx) => idx !== sIdx);
                        atualizarItemAtivo({ estrutura: updated });
                      }}
                      className="text-[#8F8271] hover:text-[#B83B32] p-1.5 transition-colors cursor-pointer self-end md:self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA ITEM 2: COPYWRITING & TEXTOS */}
          {abaItem === 'copy' && (
            <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-[#1E1A16] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C7A15F]" />
                    Redação de Copy, Textos & Argumentos de Venda
                  </h3>
                  <p className="text-xs text-[#8F8271]">
                    Headlines, chamadas para ação e textos que serão aplicados no design final
                  </p>
                </div>

                <button
                  onClick={handleGerarCopyIa}
                  disabled={loadingIaCopy}
                  className="px-3.5 py-1.5 rounded-full bg-[#C7A15F]/20 hover:bg-[#C7A15F]/30 text-[#8F6F2D] border border-[#C7A15F]/40 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loadingIaCopy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C7A15F]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#C7A15F]" />
                  )}
                  Escrever Copy com IA
                </button>
              </div>

              <textarea
                rows={12}
                value={itemAtivo.copyTexto || ''}
                onChange={(e) => atualizarItemAtivo({ copyTexto: e.target.value })}
                placeholder="Insira os textos, títulos, argumentos de persuasão e direcionamento de conteúdo..."
                className="w-full text-xs text-[#1E1A16] bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-4 outline-none focus:border-[#C7A15F] leading-relaxed resize-y font-mono"
              />
            </div>
          )}

          {/* ABA ITEM 3: ETAPAS DE PRODUÇÃO */}
          {abaItem === 'etapas' && (
            <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#1E1A16] uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#C7A15F]" />
                    Checklist de Produção da Peça
                  </h3>
                  <p className="text-xs text-[#8F8271]">
                    Marque as etapas conforme a criação for avançando
                  </p>
                </div>

                <button
                  onClick={() => {
                    const nova: EtapaProducao = {
                      id: `eta-${Date.now()}`,
                      titulo: 'Nova Etapa',
                      concluido: false,
                    };
                    atualizarItemAtivo({ etapas: [...(itemAtivo.etapas || []), nova] });
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Etapa
                </button>
              </div>

              <div className="space-y-2.5">
                {(itemAtivo.etapas || []).map((etapa, eIdx) => (
                  <div
                    key={etapa.id}
                    className="flex items-center justify-between gap-3 bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-3.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => {
                          const updated = [...itemAtivo.etapas];
                          updated[eIdx].concluido = !updated[eIdx].concluido;
                          atualizarItemAtivo({ etapas: updated });
                        }}
                        className="cursor-pointer"
                      >
                        {etapa.concluido ? (
                          <CheckCircle2 className="w-5 h-5 text-[#247A4A]" />
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-[#8F8271]" />
                        )}
                      </button>

                      <input
                        type="text"
                        value={etapa.titulo}
                        onChange={(e) => {
                          const updated = [...itemAtivo.etapas];
                          updated[eIdx].titulo = e.target.value;
                          atualizarItemAtivo({ etapas: updated });
                        }}
                        className={`text-xs font-bold bg-transparent outline-none flex-1 ${
                          etapa.concluido ? 'line-through text-[#8F8271]' : 'text-[#1E1A16]'
                        }`}
                      />
                    </div>

                    <button
                      onClick={() => {
                        const updated = itemAtivo.etapas.filter((_, idx) => idx !== eIdx);
                        atualizarItemAtivo({ etapas: updated });
                      }}
                      className="text-[#8F8271] hover:text-[#B83B32] p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA ITEM 4: LINKS & PROTÓTIPO */}
          {abaItem === 'links' && (
            <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-black text-[#1E1A16] uppercase tracking-wider flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-[#C7A15F]" />
                  Links do Projeto (Figma & Publicação)
                </h3>
                <p className="text-xs text-[#8F8271]">
                  Acesso rápido aos arquivos de design e versão no ar
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                    <LinkIcon className="w-3.5 h-3.5 text-[#C7A15F]" />
                    Link do Protótipo (Figma)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://www.figma.com/file/..."
                      value={itemAtivo.linkFigma || ''}
                      onChange={(e) => atualizarItemAtivo({ linkFigma: e.target.value })}
                      className="w-full text-xs bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl p-3 outline-none focus:border-[#C7A15F]"
                    />
                    {itemAtivo.linkFigma && (
                      <a
                        href={itemAtivo.linkFigma}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-[#181512] text-white rounded-xl hover:bg-[#2B261F] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Globe className="w-3.5 h-3.5 text-[#C7A15F]" />
                    Link Publicado / No Ar
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://sua-pagina.com.br..."
                      value={itemAtivo.linkFinal || ''}
                      onChange={(e) => atualizarItemAtivo({ linkFinal: e.target.value })}
                      className="w-full text-xs bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl p-3 outline-none focus:border-[#C7A15F]"
                    />
                    {itemAtivo.linkFinal && (
                      <a
                        href={itemAtivo.linkFinal}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-[#181512] text-white rounded-xl hover:bg-[#2B261F] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA ITEM 5: ESTÚDIO PENPOT (FIGMA OPEN-SOURCE) */}
          {abaItem === 'penpot' && (
            <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#247A4A] animate-pulse" />
                    <h3 className="text-sm font-black text-[#1E1A16] uppercase tracking-wider">
                      Estúdio de Design Integrado (Penpot)
                    </h3>
                    <span className="text-[10px] font-bold bg-[#C7A15F]/20 text-[#8F6F2D] border border-[#C7A15F]/40 px-2 py-0.5 rounded-full">
                      {typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? 'Produção • Integrado' : 'Local • Porta 9005'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8F8271] mt-0.5">
                    Prancheta e layout dedicado para: <strong className="text-[#1E1A16]">{itemAtivo.titulo}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleGerarPranchetaPenpot}
                    disabled={loadingPenpotCreation}
                    title="Cria automaticamente um arquivo dedicado no Penpot para esta peça"
                    className="px-3.5 py-1.5 rounded-xl bg-[#C7A15F]/20 hover:bg-[#C7A15F]/30 text-[#8F6F2D] border border-[#C7A15F]/40 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {loadingPenpotCreation ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C7A15F]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#C7A15F]" />
                    )}
                    <span>⚡ Gerar Prancheta Automática</span>
                  </button>

                  <button
                    onClick={() => {
                      const iframe = document.getElementById('penpot-frame') as HTMLIFrameElement;
                      if (iframe) {
                        iframe.src = resolvePenpotUrl(itemAtivo.penpotUrl);
                      }
                    }}
                    title="Recarregar o canvas do Penpot"
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#D8CBB8] hover:border-[#1E1A16] text-[#1E1A16] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Recarregar</span>
                  </button>

                  <button
                    onClick={() => {
                      const iframe = document.getElementById('penpot-frame');
                      if (iframe) {
                        if (iframe.requestFullscreen) {
                          iframe.requestFullscreen();
                        }
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#D8CBB8] hover:border-[#1E1A16] text-[#1E1A16] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Tela Cheia</span>
                  </button>

                  <a
                    href={resolvePenpotUrl(itemAtivo.penpotUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <span>Abrir em Nova Aba</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Barra de Vinculação Direta do Arquivo */}
              <div className="bg-[#FAF7F2] border border-[#D8CBB8] rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-bold text-[#625746] shrink-0 flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-[#C7A15F]" />
                    Arquivo Vinculado:
                  </span>
                  <input
                    type="url"
                    placeholder={`Cole aqui a URL direta do arquivo no Penpot (ex: ${getPenpotBaseUrl()}/#/workspace/...)`}
                    value={itemAtivo.penpotUrl || ''}
                    onChange={(e) => atualizarItemAtivo({ penpotUrl: e.target.value })}
                    className="w-full bg-white border border-[#D8CBB8] rounded-xl px-3 py-1.5 outline-none focus:border-[#C7A15F] font-mono text-[11px]"
                  />
                </div>

                {itemAtivo.penpotUrl && (
                  <button
                    onClick={() => atualizarItemAtivo({ penpotUrl: '' })}
                    className="text-[#8F8271] hover:text-[#B83B32] text-[11px] font-bold underline cursor-pointer"
                  >
                    Resetar URL
                  </button>
                )}
              </div>

              {/* Iframe do Penpot com URL direta do arquivo */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-[#D8CBB8] bg-[#1E1E1E] shadow-inner" style={{ height: '780px' }}>
                <iframe
                  id="penpot-frame"
                  src={resolvePenpotUrl(itemAtivo.penpotUrl)}
                  title="Penpot Studio"
                  className="w-full h-full border-0"
                  allow="clipboard-read; clipboard-write; fullscreen"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Item / Peça */}
      <Modal
        isOpen={isNovoItemModalOpen}
        onClose={() => setIsNovoItemModalOpen(false)}
        title={`Cadastrar Novo(a) ${getNomeItemSingular()}`}
      >
        <form onSubmit={handleCriarNovoItem} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
              Nome / Título da Peça
            </label>
            <input
              type="text"
              required
              placeholder={`Ex: ${getNomeItemSingular()} de Lançamento 2026`}
              value={novoItemTitulo}
              onChange={(e) => setNovoItemTitulo(e.target.value)}
              className="w-full text-xs bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl p-3 outline-none focus:border-[#C7A15F]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
              Data Prevista de Entrega
            </label>
            <input
              type="date"
              value={novoItemPrazo}
              onChange={(e) => setNovoItemPrazo(e.target.value)}
              className="w-full text-xs bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl p-3 outline-none focus:border-[#C7A15F]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
              Descrição / Objetivo
            </label>
            <textarea
              rows={3}
              placeholder="Descreva o público-alvo e objetivo principal..."
              value={novoItemDescricao}
              onChange={(e) => setNovoItemDescricao(e.target.value)}
              className="w-full text-xs bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl p-3 outline-none focus:border-[#C7A15F] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNovoItemModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#625746] hover:text-[#1E1A16]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Criar & Abrir Planejamento
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ficha Completa da Tarefa */}
      {selectedTaskId && (
        <TaskModal
          tarefaId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={() => carregarDados()}
        />
      )}

      {/* Modal Criar Demanda no GP pré-preenchida */}
      {isCreateTaskModalOpen && (
        <TaskFormModal
          initialStatus="A_FAZER"
          initialClienteId={clienteId}
          initialServicoId={servico.id}
          onClose={() => {
            setIsCreateTaskModalOpen(false);
            setInitialTaskTitle('');
            setInitialTaskDesc('');
          }}
          onTaskCreated={() => carregarDados()}
        />
      )}
    </div>
  );
}
