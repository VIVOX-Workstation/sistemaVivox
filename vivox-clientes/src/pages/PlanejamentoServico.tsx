import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ServicoContratado, Tarefa } from '../types';
import { api } from '../api/client';
import { tarefasApi } from '../api/tarefas';
import { chamadosApi, type CategoriaChamado, type UrgenciaChamado } from '../api/chamados';
import { TaskModal } from '../components/gp/TaskModal';
import { TaskFormModal } from '../components/gp/TaskFormModal';
import { Modal } from '../components/Modal';
import { QuadroColaborativo } from '../components/QuadroColaborativo';
import { 
  X,
  ArrowLeft, 
  Calendar, 
  Building2, 
  Plus, 
  FileText, 
  Sparkles, 
  ExternalLink, 
  Kanban, 
  Save, 
  Loader2, 
  ChevronRight,
  Globe,
  PenTool,
  Trash2,
  Zap,
  Link as LinkIcon,
  Layout,
  AlertTriangle
} from 'lucide-react';

export interface EstruturaSecao {
  id: string;
  titulo: string;
  descricao?: string;
  texto?: string;
  cta?: string;
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
  copyTexto?: string;
  publico?: string;
  oferta?: string;
  referencias?: string;
  tarefaIds?: string[];
  estrutura: EstruturaSecao[];
  etapas: EtapaProducao[];
  createdAt: string;
}

function estruturaInicial(tipo: string): EstruturaSecao[] {
  const modelos: Record<string, string[]> = {
    LANDING_PAGE: ['Apresentação e proposta de valor', 'Benefícios e prova social', 'Oferta e chamada para ação'],
    VIDEO: ['Cena 1 — Abertura', 'Cena 2 — Desenvolvimento', 'Cena 3 — Encerramento'],
    APP: ['Tela inicial', 'Fluxo principal', 'Confirmação'],
    GERENCIAMENTO_REDES: ['Peça 1 — Apresentação', 'Peça 2 — Conteúdo', 'Peça 3 — Conversão'],
    FOTOGRAFIA: ['Conceito do ensaio', 'Cenas e enquadramentos', 'Seleção e tratamento'],
    IDENTIDADE_VISUAL: ['Conceito da marca', 'Elementos visuais', 'Aplicações'],
  };
  return (modelos[tipo] || ['Abertura', 'Conteúdo principal', 'Fechamento']).map((titulo, idx) => ({ id: 's' + (idx + 1), titulo, descricao: '' }));
}

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
  const [syncError, setSyncError] = useState(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  // Item selecionado via rota de URL
  const selectedItemId = paramItemId || null;

  // Main workflow and optional ideas board.
  const [abaItem, setAbaItem] = useState<'briefing' | 'conteudo' | 'producao' | 'quadro'>('briefing');

  // Modal Novo Item / Peça
  const [isNovoItemModalOpen, setIsNovoItemModalOpen] = useState(false);
  const [novoItemTitulo, setNovoItemTitulo] = useState('');
  const [novoItemDescricao, setNovoItemDescricao] = useState('');
  const [novoItemPrazo, setNovoItemPrazo] = useState('');
  const [_nomeCliente, setNomeCliente] = useState('');

  // IA Loading states
  const [loadingIaEstrutura, setLoadingIaEstrutura] = useState(false);
  const [loadingIaCopy, setLoadingIaCopy] = useState(false);

  // Modais de Tarefas GP
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [initialTaskTitle, setInitialTaskTitle] = useState('');
  const [initialTaskDesc, setInitialTaskDesc] = useState('');
  const [initialTaskChecklist, setInitialTaskChecklist] = useState<string[]>([]);

  // Modal de Chamado (Suporte pós-entrega)
  const [isChamadoModalOpen, setIsChamadoModalOpen] = useState(false);
  const [chamadoTitulo, setChamadoTitulo] = useState('');
  const [chamadoDescricao, setChamadoDescricao] = useState('');
  const [chamadoCategoria, setChamadoCategoria] = useState<CategoriaChamado>('BUG');
  const [chamadoUrgencia, setChamadoUrgencia] = useState<UrgenciaChamado>('MEDIA');
  const [chamadoAnexos, setChamadoAnexos] = useState<File[]>([]);
  const [loadingChamado, setLoadingChamado] = useState(false);

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
        } catch {}
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
        } catch {}
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
          copyTexto: item.copyTexto || '',
          publico: item.publico || '',
          oferta: item.oferta || '',
          referencias: item.referencias || '',
          tarefaIds: Array.isArray(item.tarefaIds) ? item.tarefaIds : [],
          estrutura: Array.isArray(item.estrutura)
            ? item.estrutura
            : estruturaInicial(servicoRes.data.tipoServico || servicoRes.data.tipo_servico || 'LANDING_PAGE'),
          etapas: Array.isArray(item.etapas) ? item.etapas : [],
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
      // Keep writes in order so an older keystroke cannot overwrite newer content.
      saveQueue.current = saveQueue.current.then(async () => {
        try {
          const res = await api.get(`/planejamento-servico/servico/${servicoId}`);
          if (res.data?.id) {
            await api.patch(`/planejamento-servico/${res.data.id}`, { flowNodes: novosItens });
          } else {
            await api.post('/planejamento-servico', { servicoContratadoId: servicoId, flowNodes: novosItens });
          }
          setSyncError(false);
        } catch (err) {
          setSyncError(true);
          console.warn('Erro ao sincronizar com backend:', err);
        }
      });
      await saveQueue.current;
    }
  };

  const handleCriarNovoItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItemTitulo.trim()) return;

    const novo: ItemPlanejado = {
      id: `item-${Date.now()}`,
      titulo: novoItemTitulo.trim(),
      descricao: novoItemDescricao.trim(),
      status: 'BRIEFING',
      prazo: novoItemPrazo || new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      copyTexto: '',
      estrutura: estruturaInicial(tipoStr),
      etapas: [],
      tarefaIds: [],
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
  const tarefasDaEntrega = tarefas.filter((t) => itemAtivo?.tarefaIds?.includes(t.id));
  const nomeBloco = tipoStr === 'VIDEO' ? 'Cena' : tipoStr === 'APP' ? 'Tela' : tipoStr === 'GERENCIAMENTO_REDES' ? 'Peça' : 'Seção';
  const campoPlanejamento = 'w-full text-sm bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl p-3 outline-none focus:border-[#C7A15F]';
  const cardPlanejamento = 'bg-[#FFFDF8] border border-[#D8CBB8] rounded-2xl p-5 space-y-4';
  const rotuloPlanejamento = 'block text-xs font-semibold text-[#625746] mb-2';


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
Gere a estrutura adequada ao tipo de serviço (seções para páginas, cenas para vídeo, telas para app, peças para campanha) para a peça "${itemAtivo.titulo}" (${nomeFormatadoServico}) da empresa "${servico.cliente?.nomeFantasia || 'Cliente'}".

Briefing: ${itemAtivo.descricao || "Não informado"}. Público: ${itemAtivo.publico || "Não informado"}. Oferta: ${itemAtivo.oferta || "Não informada"}.
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
          atualizarItemAtivo({ estrutura: [...itemAtivo.estrutura, ...novaEstrutura] });
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

  const handleAbrirChamado = async () => {
    if (!itemAtivo || !servico || !chamadoTitulo.trim() || !chamadoDescricao.trim()) return;
    setLoadingChamado(true);
    try {
      const chamado = await chamadosApi.createChamado({
        clienteId: clienteId!,
        servicoId: servico.id,
        itemPlanejadoId: itemAtivo.id,
        itemTitulo: itemAtivo.titulo,
        titulo: chamadoTitulo.trim(),
        categoria: chamadoCategoria,
        urgencia: chamadoUrgencia,
        descricaoProblema: chamadoDescricao.trim(),
      });

      for (const file of chamadoAnexos) {
        await chamadosApi.uploadAnexo(chamado.id, file).catch((err) =>
          console.error('Erro ao enviar anexo do chamado:', err)
        );
      }

      setIsChamadoModalOpen(false);
      setChamadoTitulo('');
      setChamadoDescricao('');
      setChamadoCategoria('BUG');
      setChamadoUrgencia('MEDIA');
      setChamadoAnexos([]);
    } catch (err) {
      console.error('Erro ao abrir chamado:', err);
    } finally {
      setLoadingChamado(false);
    }
  };

  const handleExportarItemParaGP = () => {
    if (!itemAtivo) return;
    setInitialTaskChecklist([]);
    setInitialTaskTitle(`[${nomeFormatadoServico}] ${itemAtivo.titulo}`);
    setInitialTaskDesc([
      itemAtivo.descricao || '',
      itemAtivo.publico ? `Público: ${itemAtivo.publico}` : '',
      itemAtivo.oferta ? `Oferta: ${itemAtivo.oferta}` : '',
      `Planejamento: ${window.location.origin}/cliente/${clienteId}/servicos/${servicoId}/planejamento/${itemAtivo.id}`,
      itemAtivo.linkFigma ? `Design: ${itemAtivo.linkFigma}` : '',
    ].filter(Boolean).join('\n\n'));
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
                  <span className="text-[12px] font-black uppercase tracking-wider text-[#8F8271] flex items-center gap-1">
                    <Layout className="w-3.5 h-3.5 text-[#C7A15F]" />
                    Central de Projetos & Planejamento
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[12px] font-black uppercase tracking-wider bg-[#247A4A]/10 text-[#247A4A] border border-[#247A4A]/30">
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
                  const etapas = tarefas.filter((t) => item.tarefaIds?.includes(t.id));
                  const etapasConcluidas = etapas.filter((e) => e.status === 'CONCLUIDA').length;
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
                          <span className="px-2.5 py-1 rounded-full text-[12px] font-black uppercase tracking-wider bg-[#FAF7F2] border border-[#D8CBB8] text-[#1E1A16]">
                            {getNomeItemSingular()} #{idx + 1}
                          </span>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[12px] font-bold uppercase tracking-wider border ${
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
                          <div className="flex items-center justify-between text-[12.5px] font-bold">
                            <span className="text-[#1E1A16]">
                              {etapasConcluidas}/{totalEtapas} tarefas concluídas
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
          {syncError && <div role="alert" className="p-3 border border-[#B83B32]/30 bg-[#B83B32]/10 rounded-xl text-sm text-[#B83B32]">Alterações guardadas neste navegador, mas a sincronização falhou. <button type="button" className="underline font-semibold" onClick={() => salvarItensNoStorage(itens)}>Tentar novamente</button></div>}
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
                  <span className="text-[12px] font-black uppercase tracking-wider text-[#8F8271]">
                    Planejamento • {nomeFormatadoServico}
                  </span>
                  <select
                    value={itemAtivo.status}
                    onChange={(e) => atualizarItemAtivo({ status: e.target.value as any })}
                    className="text-[12px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#D8CBB8] text-[#1E1A16] outline-none cursor-pointer"
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
                onClick={() => setIsChamadoModalOpen(true)}
                title="Registrar um problema relatado pelo cliente após a entrega"
                className="px-4 py-2.5 rounded-2xl bg-[#B83B32]/10 hover:bg-[#B83B32]/20 border border-[#B83B32]/30 text-xs font-bold text-[#B83B32] flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Registrar Chamado</span>
              </button>

              <button
                onClick={handleExportarItemParaGP}
                className="px-4 py-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-white border border-[#D8CBB8] hover:border-[#1E1A16] text-xs font-bold text-[#1E1A16] flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Zap className="w-4 h-4 text-[#C7A15F]" />
                <span>Criar tarefa no GP</span>
              </button>

              <button
                onClick={() => navigate(`/cliente/${clienteId}/servicos/${servicoId}/planejamento`)}
                className="px-5 py-2.5 rounded-2xl bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Voltar às entregas</span>
              </button>
            </div>
          </div>

          {/* ABA ITEM 4: LINKS & PROTÓTIPO */}
          {itemAtivo && (
            <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-2xl p-4 space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-[#625746] flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-[#C7A15F]" />
                  Arquivos e entrega
                </h3>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12.5px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                    <LinkIcon className="w-3.5 h-3.5 text-[#C7A15F]" />
                    Design / Protótipo
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
                  <label className="text-[12.5px] font-bold text-[#625746] uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Globe className="w-3.5 h-3.5 text-[#C7A15F]" />
                    Versão final / Publicação
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

          <nav aria-label="Áreas da entrega" className="flex flex-wrap gap-2 border-b border-[#D8CBB8] pb-3">
            {([
              ['briefing', 'Briefing'], ['conteudo', 'Conteúdo'], ['producao', 'Produção'],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" aria-current={abaItem === id ? 'page' : undefined} onClick={() => setAbaItem(id)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${abaItem === id ? 'bg-[#181512] text-[#FFFDF8]' : 'text-[#625746] hover:bg-[#EEE7DC]'}`}>{label}</button>
            ))}
            <button type="button" onClick={() => setAbaItem('quadro')} aria-current={abaItem === 'quadro' ? 'page' : undefined} className={`ml-auto px-4 py-2 text-xs rounded-xl flex items-center gap-2 ${abaItem === 'quadro' ? 'bg-[#EEE7DC] text-[#1E1A16]' : 'text-[#625746]'}`}><PenTool size={15} />Quadro de ideias</button>
          </nav>

          {abaItem === 'briefing' && <section className={cardPlanejamento}>
            <div><h3 className="text-lg font-bold text-[#1E1A16]">O que vamos entregar?</h3><p className="text-xs text-[#847663] mt-1">Alinhe o objetivo e as orientações antes de começar a produção.</p></div>
            <div><label htmlFor="entrega-objetivo" className={rotuloPlanejamento}>Objetivo e orientações</label><textarea id="entrega-objetivo" rows={5} className={campoPlanejamento} value={itemAtivo.descricao || ''} onChange={(e) => atualizarItemAtivo({ descricao: e.target.value })} placeholder="O que esta entrega precisa resolver? Inclua orientações e restrições do cliente." /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label htmlFor="entrega-publico" className={rotuloPlanejamento}>Público</label><textarea id="entrega-publico" rows={3} className={campoPlanejamento} value={itemAtivo.publico || ''} onChange={(e) => atualizarItemAtivo({ publico: e.target.value })} placeholder="Para quem estamos criando?" /></div>
              <div><label htmlFor="entrega-oferta" className={rotuloPlanejamento}>Oferta e mensagem principal</label><textarea id="entrega-oferta" rows={3} className={campoPlanejamento} value={itemAtivo.oferta || ''} onChange={(e) => atualizarItemAtivo({ oferta: e.target.value })} placeholder="O que comunicar e qual ação esperamos?" /></div>
            </div>
            <div className="max-w-xs"><label htmlFor="entrega-prazo" className={rotuloPlanejamento}>Prazo da entrega</label><input id="entrega-prazo" type="date" className={campoPlanejamento} value={itemAtivo.prazo?.slice(0, 10) || ''} onChange={(e) => atualizarItemAtivo({ prazo: e.target.value })} /></div>
            <div><label htmlFor="entrega-referencias" className={rotuloPlanejamento}>Referências</label><textarea id="entrega-referencias" rows={3} className={campoPlanejamento} value={itemAtivo.referencias || ''} onChange={(e) => atualizarItemAtivo({ referencias: e.target.value })} placeholder="Links, exemplos e materiais de apoio." /></div>
          </section>}

          {/* ABA ITEM 1: ESTRUTURA & SEÇÕES */}
          {abaItem === 'conteudo' && (
            <div className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-[#1E1A16] uppercase tracking-wider flex items-center gap-2">
                    <Layout className="w-4 h-4 text-[#C7A15F]" />
                    Estrutura e conteúdo
                  </h3>
                  <p className="text-xs text-[#8F8271]">
                    Organize cada parte da entrega com objetivo, texto e chamada para ação.
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
                        titulo: `${nomeBloco} ${itemAtivo.estrutura.length + 1}`,
                        descricao: '',
                      };
                      atualizarItemAtivo({ estrutura: [...itemAtivo.estrutura, nova] });
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar {nomeBloco.toLowerCase()}
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
                          aria-label={`Título da ${nomeBloco.toLowerCase()} ${sIdx + 1}`}
                          className={campoPlanejamento}
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
                          aria-label={`Objetivo da ${nomeBloco.toLowerCase()} ${sIdx + 1}`}
                          className={campoPlanejamento}
                        />
                        <label className="block text-xs font-semibold text-[#625746] pt-3" htmlFor={`texto-${sec.id}`}>Texto / Roteiro</label>
                        <textarea id={`texto-${sec.id}`} rows={4} value={sec.texto || ''} placeholder="Escreva o conteúdo desta parte…" className={campoPlanejamento} onChange={(e) => atualizarItemAtivo({ estrutura: itemAtivo.estrutura.map((parte) => parte.id === sec.id ? { ...parte, texto: e.target.value } : parte) })} />
                        <label className="block text-xs font-semibold text-[#625746] pt-2" htmlFor={`cta-${sec.id}`}>Chamada para ação (opcional)</label>
                        <input id={`cta-${sec.id}`} value={sec.cta || ''} placeholder="Ex.: Agendar uma conversa" className={campoPlanejamento} onChange={(e) => atualizarItemAtivo({ estrutura: itemAtivo.estrutura.map((parte) => parte.id === sec.id ? { ...parte, cta: e.target.value } : parte) })} />
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
          {abaItem === 'conteudo' && (
            <details className="bg-[#FFFDF8] border border-[#D8CBB8] rounded-2xl p-5 space-y-4">
              <summary className="text-sm font-semibold text-[#625746] cursor-pointer">Texto geral e rascunhos {itemAtivo.copyTexto ? '· Conteúdo salvo' : '(opcional)'}</summary>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-[#1E1A16] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C7A15F]" />
                    Texto geral e rascunhos
                  </h3>
                  <p className="text-xs text-[#8F8271]">
                    Textos já existentes ficam preservados aqui. Use os blocos acima para organizar a versão de cada parte.
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
            </details>
          )}

          {abaItem === 'producao' && <section className={cardPlanejamento}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-[#1E1A16]">Produção no GP</h3><p className="text-xs text-[#847663] mt-1">Responsáveis, prazos e andamento nas tarefas desta entrega.</p></div><button type="button" onClick={handleExportarItemParaGP} className="px-4 py-2 bg-[#C7A15F] text-[#1D160B] rounded-xl text-xs font-semibold">Criar tarefa</button></div>
            {tarefasDaEntrega.length === 0 && <p className="p-6 text-sm text-[#625746] bg-[#FAF7F2] rounded-xl">Nenhuma tarefa vinculada. Crie uma tarefa ou vincule uma já existente neste serviço.</p>}
            <div className="space-y-2">{tarefasDaEntrega.map((t) => <div key={t.id} className="flex items-center gap-2"><button type="button" onClick={() => setSelectedTaskId(t.id)} className="w-full text-left flex flex-wrap items-center justify-between gap-3 p-4 border border-[#D8CBB8] rounded-xl hover:bg-[#FAF7F2]">
              <div className="min-w-0"><span className="block text-sm font-semibold text-[#1E1A16] break-words">{t.titulo}</span><span className="text-xs text-[#847663]">{t.responsavel?.nome || 'Sem responsável'} · {t.prazo ? new Date(t.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}</span></div><span className="text-xs text-[#625746]">{t.status.replace(/_/g, ' ')}</span>
            </button><button type="button" aria-label={`Desvincular ${t.titulo}`} title="Desvincular desta entrega" className="p-2 text-[#847663] hover:text-[#B83B32]" onClick={() => atualizarItemAtivo({ tarefaIds: itemAtivo.tarefaIds?.filter((id) => id !== t.id) })}><X size={16} /></button></div>)}</div>
            <div><label htmlFor="vincular-tarefa" className={rotuloPlanejamento}>Vincular tarefa existente do serviço</label><select id="vincular-tarefa" className={campoPlanejamento} value="" onChange={(e) => { if (e.target.value) atualizarItemAtivo({ tarefaIds: [...(itemAtivo.tarefaIds || []), e.target.value] }); }}><option value="">Selecione uma tarefa</option>{tarefas.filter((t) => !itemAtivo.tarefaIds?.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}</select></div>
            {itemAtivo.etapas.length > 0 && <details className="border-t border-[#D8CBB8] pt-4"><summary className="text-xs font-semibold text-[#625746] cursor-pointer">Checklist anterior · {itemAtivo.etapas.filter((e) => e.concluido).length}/{itemAtivo.etapas.length} concluídos</summary><p className="text-xs text-[#847663] my-3">Registro preservado do planejamento anterior. O andamento atual é acompanhado nas tarefas do GP.</p><ul className="space-y-2">{itemAtivo.etapas.map((e) => <li key={e.id} className="flex gap-2 text-xs text-[#625746]"><span>{e.concluido ? '✓' : '○'}</span>{e.titulo}</li>)}</ul>{itemAtivo.etapas.some((e) => !e.concluido) && <button type="button" className="mt-4 px-3 py-2 border border-[#D8CBB8] rounded-lg text-xs text-[#625746]" onClick={() => { handleExportarItemParaGP(); setInitialTaskChecklist(itemAtivo.etapas.filter((e) => !e.concluido).map((e) => e.titulo)); }}>Criar tarefa com as pendências</button>}</details>}
          </section>}

          {/* ABA ITEM 5: QUADRO COLABORATIVO (EXCALIDRAW NATIVO) */}
          {abaItem === 'quadro' && (
            <QuadroColaborativo itemId={itemAtivo.id} itemTitulo={itemAtivo.titulo} />
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
            <label className="text-[12.5px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
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
            <label className="text-[12.5px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
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
            <label className="text-[12.5px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
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

      {/* Modal Registrar Chamado (Suporte pós-entrega) */}
      {itemAtivo && (
        <Modal
          isOpen={isChamadoModalOpen}
          onClose={() => {
            setIsChamadoModalOpen(false);
            setChamadoTitulo('');
            setChamadoDescricao('');
            setChamadoCategoria('BUG');
            setChamadoUrgencia('MEDIA');
            setChamadoAnexos([]);
          }}
          title={`Registrar Chamado — ${itemAtivo.titulo}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-[#8F8271]">
              Descreva o problema relatado pelo cliente. Um chamado será registrado e uma demanda
              urgente será criada automaticamente no Vivox GP para a equipe resolver.
            </p>
            <div>
              <label className="text-[12.5px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
                Título / Assunto
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Erro ao acessar o e-mail corporativo"
                value={chamadoTitulo}
                onChange={(e) => setChamadoTitulo(e.target.value)}
                className="w-full text-xs bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl p-3 outline-none focus:border-[#C7A15F]"
              />
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
                Descrição do Problema
              </label>
              <textarea
                rows={5}
                required
                placeholder="Ex: Cliente relatou que o formulário de contato não está enviando e-mails..."
                value={chamadoDescricao}
                onChange={(e) => setChamadoDescricao(e.target.value)}
                className="w-full text-xs bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl p-3 outline-none focus:border-[#C7A15F] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12.5px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
                  Categoria
                </label>
                <select
                  value={chamadoCategoria}
                  onChange={(e) => setChamadoCategoria(e.target.value as CategoriaChamado)}
                  className="w-full text-xs font-semibold py-2.5 px-3 bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F]"
                >
                  <option value="BUG">Bug / Erro</option>
                  <option value="AJUSTE">Ajuste / Melhoria</option>
                  <option value="DUVIDA">Dúvida</option>
                  <option value="ACESSO">Acesso / Login</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
              <div>
                <label className="text-[12.5px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
                  Urgência
                </label>
                <select
                  value={chamadoUrgencia}
                  onChange={(e) => setChamadoUrgencia(e.target.value as UrgenciaChamado)}
                  className="w-full text-xs font-semibold py-2.5 px-3 bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl outline-none focus:border-[#C7A15F]"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-[#625746] uppercase tracking-wider block mb-1">
                Anexos (opcional)
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.log,.txt,.pdf"
                onChange={(e) => setChamadoAnexos(Array.from(e.target.files || []))}
                className="w-full text-xs bg-[#FAF7F2] border border-[#D8CBB8] rounded-xl p-2.5 outline-none focus:border-[#C7A15F] file:mr-3 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-[#E5D9C8] file:text-[#1E1A16] file:text-xs file:font-bold"
              />
              {chamadoAnexos.length > 0 && (
                <p className="text-[12.5px] text-[#8F8271] mt-1">{chamadoAnexos.length} arquivo(s) selecionado(s)</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsChamadoModalOpen(false);
                  setChamadoTitulo('');
                  setChamadoDescricao('');
                  setChamadoCategoria('BUG');
                  setChamadoUrgencia('MEDIA');
                  setChamadoAnexos([]);
                }}
                className="px-4 py-2 text-xs font-bold text-[#625746] hover:text-[#1E1A16]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loadingChamado || !chamadoTitulo.trim() || !chamadoDescricao.trim()}
                onClick={handleAbrirChamado}
                className="px-5 py-2 bg-[#B83B32] hover:bg-[#9c322a] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {loadingChamado ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                Registrar Chamado
              </button>
            </div>
          </div>
        </Modal>
      )}

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
          initialTitle={initialTaskTitle}
          initialDescription={initialTaskDesc}
          initialChecklist={initialTaskChecklist}
          initialStatus="A_FAZER"
          initialClienteId={clienteId}
          initialServicoId={servico.id}
          onClose={() => {
            setIsCreateTaskModalOpen(false);
            setInitialTaskTitle('');
            setInitialTaskDesc('');
          }}
          onTaskCreated={(criada) => {
            if (itemAtivo) atualizarItemAtivo({ tarefaIds: [...(itemAtivo.tarefaIds || []), criada.id] });
            setTarefas((atuais) => [...atuais, criada]);
            setAbaItem('producao');
          }}
        />
      )}
    </div>
  );
}
