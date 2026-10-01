import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ServicoContratado, Tarefa, AtivoHospedagem } from '../types';
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
  AlertTriangle,
  Server,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  OPCOES_PRAZO_MESES,
  calcularVencimentoHospedagem,
  getSituacaoHospedagem,
  formatarDataBR,
  getHojeLocal,
} from '../utils/hospedagemCalculo';
import './planning-workspace.css';
import { useLiquidGlass } from '../hooks/useLiquidGlass';

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
  const [savingAuto, setSavingAuto] = useState(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingSaveCountRef = useRef(0);
  const [workspaceEl, setWorkspaceEl] = useState<HTMLDivElement | null>(null);
  useLiquidGlass(workspaceEl, !loading && !error && Boolean(servico));

  // Item selecionado via rota de URL
  const selectedItemId = paramItemId || null;

  // Main workflow and optional ideas board.
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ANDAMENTO' | 'CONCLUIDO'>('TODOS');
  const [abaItem, setAbaItem] = useState<'briefing' | 'conteudo' | 'producao' | 'publicacao' | 'quadro'>('briefing');

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
      pendingSaveCountRef.current++;
      setSavingAuto(true);
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
        } finally {
          pendingSaveCountRef.current--;
          if (pendingSaveCountRef.current <= 0) {
            pendingSaveCountRef.current = 0;
            setSavingAuto(false);
          }
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
  const campoPlanejamento = 'pw-field text-sm';
  const cardPlanejamento = 'pw-card pw-glass-panel p-5 space-y-4';
  const rotuloPlanejamento = 'pw-label';
  const tituloGrupo = 'text-xs font-black uppercase tracking-wider text-[#8F8271]';
  const cabecalhoAba = (titulo: string, subtitulo: string, icone?: React.ReactNode, acao?: React.ReactNode) => (
    <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#524b4017]">
      <div>
        <h3 className="font-archivo text-lg font-bold text-[#1E1A16] flex items-center gap-2">{icone}{titulo}</h3>
        <p className="text-xs text-[#625746] mt-0.5">{subtitulo}</p>
      </div>
      {acao}
    </div>
  );


  const atualizarItemAtivo = (campos: Partial<ItemPlanejado>) => {
    if (!itemAtivo) return;
    const atualizados = itens.map((i) => (i.id === itemAtivo.id ? { ...i, ...campos } : i));
    salvarItensNoStorage(atualizados);
  };

  // --- HOSPEDAGEM AUTOMÁTICA DA LANDING PAGE ---
  const isLandingPage = (tipoStr || '').toUpperCase() === 'LANDING_PAGE';
  const [hospedagemVinculada, setHospedagemVinculada] = useState<AtivoHospedagem | null>(null);
  const [loadingHospedagem, setLoadingHospedagem] = useState(false);
  const [erroCarregamentoHospedagem, setErroCarregamentoHospedagem] = useState<string | null>(null);
  const [hospedagemDataInicio, setHospedagemDataInicio] = useState<string>(() => getHojeLocal());
  const [hospedagemPrazoMeses, setHospedagemPrazoMeses] = useState<number>(12);
  const [hospedagemUrl, setHospedagemUrl] = useState<string>('');
  const [salvandoHospedagem, setSalvandoHospedagem] = useState(false);
  const [erroHospedagem, setErroHospedagem] = useState<string | null>(null);
  const [sucessoHospedagem, setSucessoHospedagem] = useState(false);
  const activeLookupKeyRef = useRef<string | null>(null);
  const loadedKeyRef = useRef<string | null>(null);
  const lastSyncedItemIdRef = useRef<string | null>(null);

  const consultarHospedagemVinculada = async (force: boolean = false) => {
    if (!clienteId || !servicoId || !selectedItemId) {
      setHospedagemVinculada(null);
      loadedKeyRef.current = null;
      activeLookupKeyRef.current = null;
      setLoadingHospedagem(false);
      return;
    }

    const currentKey = `${clienteId}:${servicoId}:${selectedItemId}`;
    if (!force && loadedKeyRef.current === currentKey) {
      return;
    }

    activeLookupKeyRef.current = currentKey;
    setLoadingHospedagem(true);
    setErroCarregamentoHospedagem(null);
    setErroHospedagem(null);

    try {
      const res = await api.get<AtivoHospedagem[]>(`/hospedagens/cliente/${clienteId}`);
      // Proteção de Identidade / Cancelamento: se o item selecionado mudou durante a requisição, ignora
      if (activeLookupKeyRef.current !== currentKey) {
        return;
      }

      const lista = Array.isArray(res.data) ? res.data : [];
      // Requisito estrito: vincula apenas onde servico e item correspondem ambos
      const vinculado = lista.find(
        (a) => a.servicoContratadoId === servicoId && a.itemPlanejadoId === selectedItemId
      ) || null;

      setHospedagemVinculada(vinculado);
      loadedKeyRef.current = currentKey;

      const urlDoItem = itens.find((i) => i.id === selectedItemId)?.linkFinal || itemAtivo?.linkFinal || '';

      if (vinculado) {
        // Revisão legado: nunca usa dataRenovacaoVps como dataInicioHospedagem.
        // Legado vinculado sem dataInicio deve usar string vazia '' (não getHojeLocal) para não alterar vencimento antigo ao atualizar.
        const inicio = vinculado.dataInicioHospedagem
          ? vinculado.dataInicioHospedagem.slice(0, 10)
          : '';
        setHospedagemDataInicio(inicio);
        setHospedagemPrazoMeses(vinculado.prazoHospedagemMeses || 12);
        setHospedagemUrl(vinculado.url || urlDoItem);
      } else {
        setHospedagemDataInicio(getHojeLocal());
        setHospedagemPrazoMeses(12);
        setHospedagemUrl(urlDoItem);
      }
    } catch (err) {
      if (activeLookupKeyRef.current !== currentKey) return;
      console.error('Erro ao consultar hospedagens vinculadas:', err);
      setErroCarregamentoHospedagem('Erro ao consultar hospedagens vinculadas. Recarregue para permitir salvar com segurança.');
    } finally {
      if (activeLookupKeyRef.current === currentKey) {
        setLoadingHospedagem(false);
      }
    }
  };

  useEffect(() => {
    setErroHospedagem(null);
    setSucessoHospedagem(false);
    consultarHospedagemVinculada();
  }, [clienteId, servicoId, selectedItemId]);

  // Efeito guardado para sincronizar URL com linkFinal do item ativo sem interferir no ciclo de GET ou refetch
  useEffect(() => {
    if (!itemAtivo) return;
    if (lastSyncedItemIdRef.current !== itemAtivo.id) {
      lastSyncedItemIdRef.current = itemAtivo.id;
      if (itemAtivo.linkFinal && !hospedagemUrl) {
        setHospedagemUrl(itemAtivo.linkFinal);
      }
    } else if (itemAtivo.linkFinal && (!hospedagemUrl || hospedagemUrl.trim() === '')) {
      setHospedagemUrl(itemAtivo.linkFinal);
    }
  }, [itemAtivo?.id, itemAtivo?.linkFinal]);

  const handleSalvarHospedagem = async () => {
    if (!clienteId || !servicoId || !itemAtivo) return;

    if (loadingHospedagem || erroCarregamentoHospedagem) {
      setErroHospedagem('Aguarde a consulta de hospedagens ou clique em "Tentar novamente" para evitar duplicatas.');
      return;
    }

    const urlParaSalvar = (hospedagemUrl || itemAtivo.linkFinal || '').trim();
    if (!urlParaSalvar) {
      setErroHospedagem('A URL da Landing Page é obrigatória para salvar a hospedagem.');
      return;
    }

    // Novo cadastro requer data de início; edição de legado permite vazio sem alterar vencimento existente
    const isNovo = !hospedagemVinculada?.id;
    if (isNovo && !hospedagemDataInicio) {
      setErroHospedagem('Informe a data de início da hospedagem para cadastrar.');
      return;
    }

    setSalvandoHospedagem(true);
    setErroHospedagem(null);
    setSucessoHospedagem(false);

    // Validação backend prévia: itemPlanejadoId deve existir no flowNodes persistido desse serviço
    // Aguarda saveQueue.current e confirma persistência em /planejamento-servico
    try {
      await saveQueue.current;
      const planRes = await api.get(`/planejamento-servico/servico/${servicoId}`).catch(() => ({ data: null }));
      if (planRes.data?.id) {
        await api.patch(`/planejamento-servico/${planRes.data.id}`, { flowNodes: itens });
      } else {
        await api.post('/planejamento-servico', { servicoContratadoId: servicoId, flowNodes: itens });
      }
      setSyncError(false);
    } catch (syncErr) {
      console.error('Erro ao sincronizar planejamento antes de salvar hospedagem:', syncErr);
      setErroHospedagem('Não foi possível persistir o item no planejamento do servidor. Tente novamente antes de cadastrar a hospedagem.');
      setSalvandoHospedagem(false);
      return;
    }

    const ciclos: Record<number, 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'BIENAL'> = {
      1: 'MENSAL',
      3: 'TRIMESTRAL',
      6: 'SEMESTRAL',
      12: 'ANUAL',
      24: 'BIENAL',
    };

    const temInicio = !!hospedagemDataInicio;
    const payload = {
      clienteId,
      titulo: itemAtivo.titulo || 'Landing Page',
      url: urlParaSalvar,
      servicoContratadoId: servicoId,
      itemPlanejadoId: itemAtivo.id,
      dataInicioHospedagem: temInicio ? hospedagemDataInicio : undefined,
      prazoHospedagemMeses: temInicio && hospedagemPrazoMeses ? Number(hospedagemPrazoMeses) : undefined,
      cicloVps: temInicio ? (ciclos[Number(hospedagemPrazoMeses)] || undefined) : undefined,
    };

    try {
      let salvo: AtivoHospedagem;
      if (hospedagemVinculada?.id) {
        const res = await api.patch<AtivoHospedagem>(`/hospedagens/${hospedagemVinculada.id}`, payload);
        salvo = res.data;
      } else {
        const res = await api.post<AtivoHospedagem>('/hospedagens', payload);
        salvo = res.data;
      }

      setHospedagemVinculada(salvo);
      if (salvo.dataInicioHospedagem) {
        setHospedagemDataInicio(salvo.dataInicioHospedagem.slice(0, 10));
      }
      if (salvo.prazoHospedagemMeses) {
        setHospedagemPrazoMeses(salvo.prazoHospedagemMeses);
      }
      if (salvo.url) {
        setHospedagemUrl(salvo.url);
        if (itemAtivo.linkFinal !== salvo.url) {
          atualizarItemAtivo({ linkFinal: salvo.url });
        }
      }

      setSucessoHospedagem(true);
      setTimeout(() => setSucessoHospedagem(false), 4000);
    } catch (err: any) {
      console.error('Erro ao salvar hospedagem:', err);
      // Se receber 409 (conflito / já cadastrada), reconsulta para pegar o id e atualizar localmente
      if (err.response?.status === 409) {
        try {
          const refetchRes = await api.get<AtivoHospedagem[]>(`/hospedagens/cliente/${clienteId}`);
          const listaRefetch = Array.isArray(refetchRes.data) ? refetchRes.data : [];
          const vinculadoRefetch = listaRefetch.find(
            (a) => a.servicoContratadoId === servicoId && a.itemPlanejadoId === itemAtivo.id
          );
          if (vinculadoRefetch) {
            setHospedagemVinculada(vinculadoRefetch);
            setErroHospedagem('Este item já possui hospedagem vinculada no sistema. O cadastro foi recuperado; clique em "Atualizar Hospedagem".');
            return;
          }
        } catch {}
      }

      const msg = err.response?.data?.message || 'Erro ao salvar informações de hospedagem.';
      setErroHospedagem(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSalvandoHospedagem(false);
    }
  };

  const previewVencimentoHospedagem = calcularVencimentoHospedagem(hospedagemDataInicio, Number(hospedagemPrazoMeses));
  const dataVencimentoHospedagemEfetiva = previewVencimentoHospedagem || (hospedagemVinculada?.dataRenovacaoVps ? hospedagemVinculada.dataRenovacaoVps.slice(0, 10) : null);
  const situacaoHospedagem = getSituacaoHospedagem(dataVencimentoHospedagemEfetiva);

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
    <div ref={setWorkspaceEl} className="planning-workspace w-full p-4 sm:p-6 pb-20 space-y-6">
      <div className="pw-lg-scene" aria-hidden="true" />
      <svg id="pw-lg-filters" width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true"><defs /></svg>

      {/* ======================================================== */}
      {/* 1. SE NENHUM ITEM ESTIVER SELECIONADO: LISTA DE ITENS   */}
      {/* ======================================================== */}
      {!selectedItemId && (
        <>
          {/* Cabeçalho do Serviço */}
          <div className="pw-card pw-glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/cliente/${clienteId}?tab=services`)}
                title="Voltar ao Mapa de Serviços do cliente"
                className="pw-glass-pill w-10 h-10 rounded-2xl flex items-center justify-center text-[#1E1A16] transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[12px] font-black uppercase tracking-wider text-[#8F8271] flex items-center gap-1">
                  <Layout className="w-3.5 h-3.5 text-[#C7A15F]" />
                  Planejamento · {servico.cliente?.nomeFantasia || 'Cliente'}
                </span>
                <h1 className="text-2xl lg:text-3xl font-black text-[#1E1A16] tracking-tight leading-tight mt-0.5">
                  {getNomeItemPlural()}
                </h1>
                <p className="text-xs text-[#625746] mt-1 font-medium">
                  Defina briefing, conteúdo e publicação de cada entrega. O acompanhamento das tarefas fica no Vivox GP.
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => navigate(`/gp?clienteId=${clienteId}&servicoId=${servico.id}`)}
                className="pw-glass-control px-4 py-2.5 rounded-2xl text-xs font-bold text-[#1E1A16] flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Kanban className="w-4 h-4 text-[#C7A15F]" />
                <span>Ver no Vivox GP</span>
                <ExternalLink className="w-3 h-3 text-[#8F8271]" />
              </button>

              <button
                onClick={() => setIsNovoItemModalOpen(true)}
                className="pw-glass-control pw-glass-primary px-5 py-2.5 rounded-2xl bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Novo {getNomeItemSingular()}</span>
              </button>
            </div>
          </div>

          {/* Lista de entregas */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-black text-[#1E1A16] uppercase tracking-wider">
                {itens.length} {itens.length === 1 ? 'entrega' : 'entregas'}
              </h3>
              {itens.length > 1 && (
                <div role="group" aria-label="Filtrar por status" className="flex items-center gap-1.5 flex-wrap">
                  {([
                    ['TODOS', 'Todos'],
                    ['ANDAMENTO', 'Em andamento'],
                    ['CONCLUIDO', 'Concluídos'],
                  ] as const).map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      type="button"
                      aria-pressed={filtroStatus === valor}
                      onClick={() => setFiltroStatus(valor)}
                      className={`pw-glass-tab px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                        filtroStatus === valor ? 'is-active text-[#1e1b17]' : 'text-[#5e574c]'
                      }`}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
              )}
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
                  if (filtroStatus === 'CONCLUIDO' && item.status !== 'CONCLUIDO') return null;
                  if (filtroStatus === 'ANDAMENTO' && item.status === 'CONCLUIDO') return null;
                  const totalTarefas = tarefas.filter((t) => item.tarefaIds?.includes(t.id)).length;

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/cliente/${clienteId}/servicos/${servicoId}/planejamento/${item.id}`)}
                      className="pw-glass-card rounded-3xl p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className="pw-glass-pill px-2.5 py-1 rounded-full text-[12px] font-black uppercase tracking-wider text-[#1E1A16]">
                            {getNomeItemSingular()} #{idx + 1}
                          </span>

                          <div className="flex items-center gap-2">
                            <span
                              className={`pw-glass-pill px-2.5 py-0.5 rounded-full text-[12px] font-bold uppercase tracking-wider border ${
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
                              aria-label={`Excluir ${item.titulo}`}
                              className="text-[#8F8271] hover:text-[#B83B32] p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-black text-base text-[#1E1A16] group-hover:text-[#C7A15F] transition-colors line-clamp-1">
                            {item.titulo}
                          </h4>
                          <p className="text-xs text-[#625746] mt-1 line-clamp-2 leading-relaxed">
                            {item.descricao || 'Sem descrição cadastrada.'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-[#D8CBB8] flex items-center justify-between gap-2 text-xs text-[#8F8271]">
                        <div className="flex flex-col gap-0.5 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Prazo: {item.prazo ? new Date(item.prazo).toLocaleDateString('pt-BR') : 'A definir'}
                          </span>
                          <span>
                            {totalTarefas === 0 ? 'Sem tarefas ainda' : `${totalTarefas} ${totalTarefas === 1 ? 'tarefa' : 'tarefas'}`}
                          </span>
                        </div>

                        <span className="font-bold text-[#1E1A16] flex items-center gap-1 group-hover:text-[#C7A15F] transition-colors">
                          Abrir <ChevronRight className="w-3.5 h-3.5" />
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
          {/* Cabeçalho: breadcrumb + salvo, título + status, resumo */}
          <div className="pw-card pw-glass-panel p-4 md:p-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#5e574c] min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(`/cliente/${clienteId}/servicos/${servicoId}/planejamento`)}
                  title={`Voltar para ${getNomeItemPlural()}`}
                  className="pw-glass-pill px-2.5 py-1 rounded-full text-[#1e1b17] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{getNomeItemPlural()}</span>
                </button>
                <span className="text-[#524b40]/30">/</span>
                <span className="text-[#7a6440] font-semibold truncate">
                  {itemAtivo.titulo || 'Item sem título'}
                </span>
              </div>

              {/* Indicador de Salvamento Automático & Sincronização */}
              <div className="flex items-center gap-2 shrink-0">
                {syncError ? (
                  <div
                    role="alert"
                    className="pw-glass-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fbece9] text-[#b42318] text-xs font-semibold border border-[#b42318]/20"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Sincronização pendente</span>
                    <button
                      type="button"
                      onClick={() => salvarItensNoStorage(itens)}
                      className="underline ml-1 cursor-pointer font-bold"
                    >
                      Tentar
                    </button>
                  </div>
                ) : savingAuto ? (
                  <span className="pw-glass-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[#5e574c] text-xs border border-[#524b4029]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ccb691]" />
                    <span>Salvando...</span>
                  </span>
                ) : (
                  <span className="pw-glass-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eaf2e7] text-[#3d6b35] text-xs font-medium border border-[#3d6b35]/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Salvo</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={itemAtivo.titulo}
                  onChange={(e) => atualizarItemAtivo({ titulo: e.target.value })}
                  placeholder="Título da entrega..."
                  aria-label="Título da entrega"
                  className="pw-title-field font-archivo text-xl md:text-2xl font-bold text-[#1e1b17] bg-transparent border-b border-transparent hover:border-[#524b4029] focus:border-[#ccb691] outline-none transition-colors w-full"
                />
              </div>

              <select
                value={itemAtivo.status}
                onChange={(e) => atualizarItemAtivo({ status: e.target.value as any })}
                aria-label="Status da entrega"
                className="pw-status-field pw-glass-control text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-full text-[#1e1b17] outline-none cursor-pointer transition-colors shrink-0"
              >
                <option value="BRIEFING">Briefing</option>
                <option value="PLANEJAMENTO">Planejamento</option>
                <option value="EM_PRODUCAO">Em Produção</option>
                <option value="EM_REVISAO">Em Revisão</option>
                <option value="CONCLUIDO">Concluído</option>
              </select>
            </div>

            <p className="text-xs text-[#5e574c] flex items-center gap-1.5 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-[#7a6440]" />
              Prazo: <strong className="text-[#1e1b17]">{itemAtivo.prazo ? formatarDataBR(itemAtivo.prazo.slice(0, 10)) : 'A definir'}</strong>
              <span className="text-[#524b40]/30">·</span>
              <span>{servico?.cliente?.nomeFantasia || 'Cliente'} · {nomeFormatadoServico}</span>
            </p>
          </div>

          {/* Abas IMEDIATAMENTE abaixo do cabeçalho */}
          <nav aria-label="Áreas da entrega" className="flex items-center gap-2 border-b border-[#524b4029] pb-3 overflow-x-auto">
            <button
              type="button"
              aria-current={abaItem === 'briefing' ? 'page' : undefined}
              onClick={() => setAbaItem('briefing')}
              className={`pw-glass-tab px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                abaItem === 'briefing'
                  ? 'is-active text-[#1e1b17]'
                  : 'text-[#5e574c]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Briefing
            </button>

            <button
              type="button"
              aria-current={abaItem === 'conteudo' ? 'page' : undefined}
              onClick={() => setAbaItem('conteudo')}
              className={`pw-glass-tab px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                abaItem === 'conteudo'
                  ? 'is-active text-[#1e1b17]'
                  : 'text-[#5e574c]'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              Conteúdo
            </button>

            <button
              type="button"
              aria-current={abaItem === 'producao' ? 'page' : undefined}
              onClick={() => setAbaItem('producao')}
              className={`pw-glass-tab px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                abaItem === 'producao'
                  ? 'is-active text-[#1e1b17]'
                  : 'text-[#5e574c]'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Produção
            </button>

            <button
              type="button"
              aria-current={abaItem === 'publicacao' ? 'page' : undefined}
              onClick={() => setAbaItem('publicacao')}
              className={`pw-glass-tab px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                abaItem === 'publicacao'
                  ? 'is-active text-[#1e1b17]'
                  : 'text-[#5e574c]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Publicação
              {hospedagemVinculada && (
                <span className="w-2 h-2 rounded-full bg-[#3d6b35]"></span>
              )}
            </button>

            <button
              type="button"
              aria-current={abaItem === 'quadro' ? 'page' : undefined}
              onClick={() => setAbaItem('quadro')}
              className={`pw-glass-tab ml-auto px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                abaItem === 'quadro'
                  ? 'is-active text-[#1e1b17]'
                  : 'text-[#5e574c]'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Ideias (opcional)</span>
            </button>
          </nav>

          {abaItem === 'briefing' && <section className={cardPlanejamento}>
            {cabecalhoAba('Briefing', 'Alinhe o que será entregue, para quem e até quando, antes de começar a produção.', <FileText className="w-4 h-4 text-[#7a6440]" />)}
            <div className="space-y-3">
              <p className={tituloGrupo}>Objetivo</p>
              <div><label htmlFor="entrega-objetivo" className={rotuloPlanejamento}>Objetivo e orientações</label><textarea id="entrega-objetivo" rows={5} className={campoPlanejamento} value={itemAtivo.descricao || ''} onChange={(e) => atualizarItemAtivo({ descricao: e.target.value })} placeholder="O que esta entrega precisa resolver? Inclua orientações e restrições do cliente." /></div>
            </div>
            <div className="space-y-3">
              <p className={tituloGrupo}>Público e mensagem</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label htmlFor="entrega-publico" className={rotuloPlanejamento}>Público</label><textarea id="entrega-publico" rows={3} className={campoPlanejamento} value={itemAtivo.publico || ''} onChange={(e) => atualizarItemAtivo({ publico: e.target.value })} placeholder="Para quem estamos criando?" /></div>
                <div><label htmlFor="entrega-oferta" className={rotuloPlanejamento}>Oferta e mensagem principal</label><textarea id="entrega-oferta" rows={3} className={campoPlanejamento} value={itemAtivo.oferta || ''} onChange={(e) => atualizarItemAtivo({ oferta: e.target.value })} placeholder="O que comunicar e qual ação esperamos?" /></div>
              </div>
            </div>
            <div className="space-y-3">
              <p className={tituloGrupo}>Prazo e referências</p>
              <div className="grid md:grid-cols-[14rem_1fr] gap-4">
                <div><label htmlFor="entrega-prazo" className={rotuloPlanejamento}>Prazo da entrega</label><input id="entrega-prazo" type="date" className={campoPlanejamento} value={itemAtivo.prazo?.slice(0, 10) || ''} onChange={(e) => atualizarItemAtivo({ prazo: e.target.value })} /></div>
                <div><label htmlFor="entrega-referencias" className={rotuloPlanejamento}>Referências</label><textarea id="entrega-referencias" rows={3} className={campoPlanejamento} value={itemAtivo.referencias || ''} onChange={(e) => atualizarItemAtivo({ referencias: e.target.value })} placeholder="Links, exemplos e materiais de apoio." /></div>
              </div>
            </div>
          </section>}

          {/* ABA ITEM 1: ESTRUTURA & SEÇÕES */}
          {abaItem === 'conteudo' && (
            <div className="pw-card pw-glass-panel rounded-3xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#524b4017]">
                <div>
                  <h3 className="font-archivo text-lg font-bold text-[#1E1A16] flex items-center gap-2">
                    <Layout className="w-4 h-4 text-[#7a6440]" />
                    Conteúdo
                  </h3>
                  <p className="text-xs text-[#625746] mt-0.5">
                    Divida a entrega em partes e escreva o objetivo, o texto e a chamada para ação de cada uma.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleGerarEstruturaIa}
                    disabled={loadingIaEstrutura}
                    className="pw-glass-control px-3.5 py-1.5 rounded-full bg-[#C7A15F]/20 hover:bg-[#C7A15F]/30 text-[#8F6F2D] border border-[#C7A15F]/40 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
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
                    className="pw-glass-control pw-glass-primary px-3.5 py-1.5 rounded-full bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
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
                    className="pw-glass-card rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <span className="pw-glass-pill pw-glass-primary w-7 h-7 rounded-xl bg-[#181512] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
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
            <details className="pw-card pw-glass-panel rounded-2xl p-5 space-y-4">
              <summary className="text-sm font-semibold text-[#625746] cursor-pointer">Texto geral e rascunhos (opcional){itemAtivo.copyTexto ? ' · preenchido' : ''}</summary>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-[#625746]">
                  Espaço livre para um texto corrido da entrega inteira. Para a versão final de cada parte, use os campos acima.
                </p>

                <button
                  onClick={handleGerarCopyIa}
                  disabled={loadingIaCopy}
                  className="pw-glass-control px-3.5 py-1.5 rounded-full bg-[#C7A15F]/20 hover:bg-[#C7A15F]/30 text-[#8F6F2D] border border-[#C7A15F]/40 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
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

          {/* ABA 3: PRODUÇÃO */}
          {abaItem === 'producao' && (
            <section className={cardPlanejamento}>
              {cabecalhoAba(
                'Produção',
                'Tarefas do Vivox GP ligadas a esta entrega. Aqui você cria e vincula; o andamento é acompanhado no GP.',
                <Kanban className="w-4 h-4 text-[#7a6440]" />,
                <button
                  type="button"
                  onClick={handleExportarItemParaGP}
                  className="pw-glass-control pw-glass-gold px-4 py-2 bg-[#ccb691] hover:bg-[#bda47d] text-[#1e1b17] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Criar tarefa no GP</span>
                </button>
              )}

              {tarefasDaEntrega.length === 0 && (
                <p className="p-6 text-sm text-[#5e574c] bg-[#faf7f2] rounded-xl">
                  Nenhuma tarefa vinculada ainda. Crie uma nova ou vincule uma já existente neste serviço.
                </p>
              )}

              <div className="space-y-2">
                {tarefasDaEntrega.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTaskId(t.id)}
                      className="pw-glass-card w-full text-left flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold text-[#1e1b17] break-words">{t.titulo}</span>
                        <span className="text-xs text-[#5e574c]">{t.responsavel?.nome || 'Sem responsável'} · {t.prazo ? new Date(t.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                      </div>
                      <span className="pw-glass-pill text-xs font-bold text-[#7a6440] uppercase px-2.5 py-0.5 rounded-full">{t.status.replace(/_/g, ' ')}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Desvincular ${t.titulo}`}
                      title="Desvincular desta entrega"
                      className="p-2 text-[#5e574c] hover:text-[#b42318] transition-colors cursor-pointer"
                      onClick={() => atualizarItemAtivo({ tarefaIds: itemAtivo.tarefaIds?.filter((id) => id !== t.id) })}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="vincular-tarefa" className={rotuloPlanejamento}>Vincular tarefa já existente</label>
                <select
                  id="vincular-tarefa"
                  className={campoPlanejamento}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) atualizarItemAtivo({ tarefaIds: [...(itemAtivo.tarefaIds || []), e.target.value] });
                  }}
                >
                  <option value="">Selecione uma tarefa</option>
                  {tarefas.filter((t) => !itemAtivo.tarefaIds?.includes(t.id)).map((t) => (
                    <option key={t.id} value={t.id}>{t.titulo}</option>
                  ))}
                </select>
              </div>

              {itemAtivo.etapas.length > 0 && (
                <details className="border-t border-[#524b4017] pt-4">
                  <summary className="text-xs font-semibold text-[#5e574c] cursor-pointer">
                    Checklist antigo (histórico)
                  </summary>
                  <p className="text-xs text-[#5e574c] my-3">Registro preservado de versões anteriores do planejamento. O andamento atual fica nas tarefas do GP.</p>
                  <ul className="space-y-2">
                    {itemAtivo.etapas.map((e) => (
                      <li key={e.id} className="flex gap-2 text-xs text-[#5e574c]">
                        <span>{e.concluido ? '✓' : '○'}</span>
                        {e.titulo}
                      </li>
                    ))}
                  </ul>
                  {itemAtivo.etapas.some((e) => !e.concluido) && (
                    <button
                      type="button"
                      className="mt-4 px-3 py-2 border border-[#524b4029] rounded-lg text-xs font-semibold text-[#1e1b17] hover:bg-[#faf7f2] transition-colors"
                      onClick={() => {
                        handleExportarItemParaGP();
                        setInitialTaskChecklist(itemAtivo.etapas.filter((e) => !e.concluido).map((e) => e.titulo));
                      }}
                    >
                      Criar tarefa com as pendências
                    </button>
                  )}
                </details>
              )}
            </section>
          )}

          {/* ABA 4: PUBLICAÇÃO (LINKS, HOSPEDAGEM E SUPORTE) */}
          {abaItem === 'publicacao' && (
            <div className="space-y-5">
              <div className="px-1">
                <h3 className="font-archivo text-lg font-bold text-[#1E1A16] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#7a6440]" />
                  Publicação
                </h3>
                <p className="text-xs text-[#625746] mt-0.5">
                  Links finais, hospedagem{isLandingPage ? '' : ' (apenas para Landing Pages)'} e suporte depois que a entrega for ao ar.
                </p>
              </div>
              {/* 1. Links & Entrega Final (URL Consolidada) */}
              <div className={cardPlanejamento}>
                <div className="pb-3 border-b border-[#524b4017]">
                  <h3 className="font-archivo text-base font-bold text-[#1e1b17] flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-[#7a6440]" />
                    Links da entrega
                  </h3>
                  <p className="text-xs text-[#5e574c] mt-0.5">
                    Protótipo de design e endereço publicado.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={rotuloPlanejamento}>
                      <LinkIcon className="w-3.5 h-3.5 text-[#7a6440] inline mr-1" />
                      Design / Protótipo
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://www.figma.com/file/..."
                        value={itemAtivo.linkFigma || ''}
                        onChange={(e) => atualizarItemAtivo({ linkFigma: e.target.value })}
                        className={campoPlanejamento}
                      />
                      {itemAtivo.linkFigma && (
                        <a
                          href={itemAtivo.linkFigma}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-[#1e1b17] text-white rounded-[10px] hover:bg-[#342f28] transition-colors shrink-0"
                          title="Abrir protótipo"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={rotuloPlanejamento}>
                      <Globe className="w-3.5 h-3.5 text-[#7a6440] inline mr-1" />
                      URL Publicada / Versão Final
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://sua-pagina.com.br..."
                        value={hospedagemUrl || itemAtivo.linkFinal || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHospedagemUrl(val);
                          atualizarItemAtivo({ linkFinal: val });
                        }}
                        className={campoPlanejamento}
                      />
                      {(hospedagemUrl || itemAtivo.linkFinal) && (
                        <a
                          href={hospedagemUrl || itemAtivo.linkFinal}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-[#1e1b17] text-white rounded-[10px] hover:bg-[#342f28] transition-colors shrink-0"
                          title="Acessar página publicada"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5e574c] mt-1">
                      Este endereço será usado na entrega e na hospedagem.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Hospedagem Automática da Landing Page (Apenas para Landing Pages) */}
              {isLandingPage && (
                <div className={cardPlanejamento}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#524b4017]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-[#7a6440]" />
                        <h3 className="font-archivo text-base font-bold text-[#1e1b17]">Hospedagem da Landing Page</h3>
                        {hospedagemVinculada ? (
                          <span className="pw-glass-pill px-2 py-0.5 rounded text-[11px] font-bold bg-[#eaf2e7] text-[#3d6b35] border border-[#3d6b35]/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Vinculada
                          </span>
                        ) : (
                          <span className="pw-glass-pill px-2 py-0.5 rounded text-[11px] font-bold bg-[#fcefe2] text-[#b54708] border border-[#b54708]/20 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Não vinculada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5e574c]">
                        Configure início e prazo para cálculo automático do vencimento da hospedagem e monitoramento no Radar.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {situacaoHospedagem.situacao === 'EM_DIA' && (
                        <span className="pw-glass-pill px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#eaf2e7] text-[#3d6b35] border border-[#3d6b35]/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {situacaoHospedagem.rotulo}
                        </span>
                      )}
                      {situacaoHospedagem.situacao === 'PROXIMO' && (
                        <span className="pw-glass-pill px-2.5 py-1 rounded-lg text-xs font-bold bg-[#fcefe2] text-[#b54708] border border-[#b54708]/20 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {situacaoHospedagem.rotulo}
                        </span>
                      )}
                      {situacaoHospedagem.situacao === 'VENCIDA' && (
                        <span className="pw-glass-pill px-2.5 py-1 rounded-lg text-xs font-bold bg-[#fbece9] text-[#b42318] border border-[#b42318]/20 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {situacaoHospedagem.rotulo}
                        </span>
                      )}
                      {situacaoHospedagem.situacao === 'SEM_DATA' && (
                        <span className="pw-glass-pill px-2.5 py-1 rounded-lg text-xs font-medium bg-[#ede7dd] text-[#5e574c] border border-[#524b4029]">
                          Sem data
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grid de Configuração da Hospedagem */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={rotuloPlanejamento}>
                        <Calendar className="w-3.5 h-3.5 text-[#7a6440] inline mr-1" />
                        Início da Hospedagem {hospedagemVinculada ? '' : '*'}
                      </label>
                      <input
                        type="date"
                        value={hospedagemDataInicio}
                        onChange={(e) => setHospedagemDataInicio(e.target.value)}
                        className={campoPlanejamento}
                      />
                      <p className="text-[11px] text-[#5e574c] mt-1">
                        {hospedagemVinculada && !hospedagemDataInicio
                          ? 'Preencha para calcular novo vencimento.'
                          : 'Data de início da publicação.'}
                      </p>
                    </div>

                    <div>
                      <label className={rotuloPlanejamento}>
                        <Clock className="w-3.5 h-3.5 text-[#7a6440] inline mr-1" />
                        Prazo Contratado *
                      </label>
                      <select
                        value={hospedagemPrazoMeses}
                        onChange={(e) => setHospedagemPrazoMeses(Number(e.target.value))}
                        className={`${campoPlanejamento} font-medium`}
                      >
                        {OPCOES_PRAZO_MESES.map((op) => (
                          <option key={op.meses} value={op.meses}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#5e574c] mt-1">
                        Ciclo de renovação em meses.
                      </p>
                    </div>

                    <div>
                      <label className={rotuloPlanejamento}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#7a6440] inline mr-1" />
                        {previewVencimentoHospedagem ? 'Vencimento Previsto' : 'Vencimento Atual'}
                      </label>
                      <div className="pw-glass-card rounded-[10px] p-2.5 space-y-0.5 min-h-[40px]">
                        <span className="text-sm font-bold text-[#1e1b17] block">
                          {formatarDataBR(dataVencimentoHospedagemEfetiva)}
                        </span>
                        <span className="text-[10.5px] text-[#5e574c] block">
                          {hospedagemDataInicio
                            ? 'Ajustado automaticamente pelo prazo contratado'
                            : 'Vencimento atual da hospedagem'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Alertas */}
                  {erroCarregamentoHospedagem && (
                    <div className="p-3 bg-[#fbece9] border border-[#b42318]/20 text-[#b42318] rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{erroCarregamentoHospedagem}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => consultarHospedagemVinculada(true)}
                        className="pw-glass-pill px-2.5 py-1 bg-white border border-[#524b4029] hover:bg-[#faf7f2] text-[#1e1b17] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                  {erroHospedagem && (
                    <div className="p-3 bg-[#fbece9] border border-[#b42318]/20 text-[#b42318] rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{erroHospedagem}</span>
                    </div>
                  )}

                  {sucessoHospedagem && (
                    <div className="p-3 bg-[#eaf2e7] border border-[#3d6b35]/20 text-[#3d6b35] rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Hospedagem salva com sucesso e sincronizada com o Radar de Hospedagens!</span>
                    </div>
                  )}

                  {/* Botão Salvar Hospedagem Explícito */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-[#5e574c]">
                      Alterações de hospedagem são aplicadas ao salvar.
                    </p>
                    <button
                      type="button"
                      onClick={handleSalvarHospedagem}
                      disabled={salvandoHospedagem || loadingHospedagem || Boolean(erroCarregamentoHospedagem)}
                      className="pw-glass-control pw-glass-gold px-5 py-2.5 rounded-xl bg-[#ccb691] hover:bg-[#bda47d] text-[#1e1b17] text-xs font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    >
                      {salvandoHospedagem ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Salvando hospedagem...</span>
                        </>
                      ) : loadingHospedagem ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Consultando dados...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{hospedagemVinculada ? 'Atualizar Hospedagem' : 'Salvar Hospedagem'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Chamados e Suporte Pós-Entrega */}
              <div className={cardPlanejamento}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-archivo text-base font-bold text-[#1e1b17] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#b54708]" />
                      Suporte pós-entrega
                    </h3>
                    <p className="text-xs text-[#5e574c] mt-0.5">
                      Registre problemas ou ajustes pedidos pelo cliente após a entrega; eles viram demanda no GP.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChamadoModalOpen(true)}
                    className="pw-glass-control px-4 py-2.5 rounded-xl bg-[#fbece9] hover:bg-[#f6d7d2] border border-[#b42318]/30 text-xs font-bold text-[#b42318] flex items-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Registrar Chamado</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA ITEM 5: QUADRO COLABORATIVO (EXCALIDRAW NATIVO) */}
          {abaItem === 'quadro' && (
            <div className="space-y-4">
              <div className="px-1">
                <h3 className="font-archivo text-lg font-bold text-[#1E1A16] flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-[#7a6440]" />
                  Quadro de ideias
                </h3>
                <p className="text-xs text-[#625746] mt-0.5">
                  Espaço livre para rascunhar fluxos, wireframes e ideias. Opcional, fora do fluxo principal.
                </p>
              </div>
              <QuadroColaborativo itemId={itemAtivo.id} itemTitulo={itemAtivo.titulo} />
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Item / Peça */}
      <Modal
        isOpen={isNovoItemModalOpen}
        onClose={() => setIsNovoItemModalOpen(false)}
        title={`Cadastrar Novo(a) ${getNomeItemSingular()}`}
        className="pw-glass-modal"
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
              className="pw-glass-pill px-4 py-2 text-xs font-bold text-[#625746] hover:text-[#1E1A16] rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="pw-glass-control pw-glass-primary px-5 py-2 bg-[#181512] hover:bg-[#2B261F] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
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
          className="pw-glass-modal"
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
                className="pw-glass-pill px-4 py-2 text-xs font-bold text-[#625746] hover:text-[#1E1A16] rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loadingChamado || !chamadoTitulo.trim() || !chamadoDescricao.trim()}
                onClick={handleAbrirChamado}
                className="pw-glass-control pw-glass-error px-5 py-2 bg-[#B83B32] hover:bg-[#9c322a] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
