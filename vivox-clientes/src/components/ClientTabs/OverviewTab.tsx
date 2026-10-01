import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cliente, ServicoContratado, Tarefa, AtivoHospedagem, Contato } from '../../types';
import type { Chamado } from '../../api/chamados';
import { api } from '../../api/client';
import { chamadosApi } from '../../api/chamados';
import {
  Plus,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  FolderKanban,
  Server,
  Ticket,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Sparkles,
  ExternalLink,
  Kanban,
  UserCheck,
  Eye,
  EyeOff,
  Layers,
  ArrowRight,
  CheckSquare,
  FileText
} from 'lucide-react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Panel, EmptyChart, CHART_COLORS, CHART_HEIGHT } from '../dashboard/DashboardShared';
import { calcularDiasRestantes, formatarDataBR } from '../../utils/hospedagemCalculo';
import '../../pages/planning-workspace.css';

interface Props {
  cliente: Cliente;
  onChange: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
  onEditClient?: () => void;
  onOpenChamado?: () => void;
  onManageContatos?: () => void;
}

const STATUS_SERVICO_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  ATIVO: { bg: 'bg-[#247A4A]/10', text: 'text-[#247A4A]', border: 'border-[#247A4A]/30', label: 'Ativo' },
  CONCLUIDO: { bg: 'bg-[#C7A15F]/15', text: 'text-[#8A6828]', border: 'border-[#C7A15F]/30', label: 'Concluído' },
  PAUSADO: { bg: 'bg-[#8F8271]/15', text: 'text-[#625746]', border: 'border-[#8F8271]/30', label: 'Pausado' },
  CANCELADO: { bg: 'bg-[#B83B32]/10', text: 'text-[#B83B32]', border: 'border-[#B83B32]/30', label: 'Cancelado' },
};

const STATUS_TAREFA_ORDER = ['BACKLOG', 'A_FAZER', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDA'];
const STATUS_TAREFA_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  A_FAZER: 'A Fazer',
  EM_ANDAMENTO: 'Em Andamento',
  EM_REVISAO: 'Em Revisão',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

interface ItemAtencao {
  id: string;
  tipo: 'TAREFA_ATRASADA' | 'CHAMADO_ABERTO' | 'VENCIMENTO_HOSPEDAGEM';
  titulo: string;
  detalhe: string;
  urgencia: 'CRITICO' | 'ATENCAO';
  badgeTexto: string;
  acaoLabel: string;
  onAcao: () => void;
}

export function OverviewTab({
  cliente,
  onChange,
  onNavigateTab,
  onEditClient,
  onOpenChamado,
  onManageContatos,
}: Props) {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState<ServicoContratado[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [hospedagens, setHospedagens] = useState<AtivoHospedagem[]>([]);
  const [loading, setLoading] = useState(true);

  // Observações rápidas
  const [observacoes, setObservacoes] = useState(cliente.observacoes || '');
  const [salvandoObs, setSalvandoObs] = useState(false);
  const [obsSalva, setObsSalva] = useState(false);

  // Accordion de dados cadastrais
  const [secoesAbertas, setSecoesAbertas] = useState({
    empresa: true,
    contatos: false,
    acessos: false,
  });

  // Visibilidade de senhas
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [copiadoCampo, setCopiadoCampo] = useState<string | null>(null);

  useEffect(() => {
    setObservacoes(cliente.observacoes || '');
  }, [cliente.observacoes]);

  useEffect(() => {
    loadDados();
  }, [cliente.id]);

  const loadDados = async () => {
    setLoading(true);
    try {
      const [resServicos, resTarefas, resChamados, resHospedagens] = await Promise.allSettled([
        api.get<ServicoContratado[]>(`/servicos/cliente/${cliente.id}`),
        api.get<Tarefa[]>('/tarefas', { params: { clienteId: cliente.id } }),
        chamadosApi.getChamados({ clienteId: cliente.id }),
        api.get<AtivoHospedagem[]>(`/hospedagens/cliente/${cliente.id}`),
      ]);

      if (resServicos.status === 'fulfilled') {
        setServicos(resServicos.value.data || []);
      }
      if (resTarefas.status === 'fulfilled') {
        const tasks = resTarefas.value.data || [];
        setTarefas(tasks);
      }
      if (resChamados.status === 'fulfilled') {
        setChamados(resChamados.value || []);
      }
      if (resHospedagens.status === 'fulfilled') {
        setHospedagens(resHospedagens.value.data || []);
      }
    } catch (e) {
      console.warn('Erro ao carregar dados consolidados da visão geral:', e);
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

  const copiarTexto = (texto: string, campo: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoCampo(campo);
    setTimeout(() => setCopiadoCampo(null), 2000);
  };

  const toggleSecao = (secao: keyof typeof secoesAbertas) => {
    setSecoesAbertas((prev) => ({ ...prev, [secao]: !prev[secao] }));
  };

  // --- CÁLCULOS E MÉTRICAS ---
  const servicosAtivos = useMemo(
    () => servicos.filter((s) => s.status === 'ATIVO'),
    [servicos]
  );

  const tarefasAbertas = useMemo(
    () => tarefas.filter((t) => t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA'),
    [tarefas]
  );

  const tarefasAtrasadas = useMemo(() => {
    return tarefasAbertas.filter((t) => {
      if (!t.prazo) return false;
      const dias = calcularDiasRestantes(t.prazo);
      return dias !== null && dias < 0;
    });
  }, [tarefasAbertas]);

  const chamadosAbertos = useMemo(
    () => chamados.filter((c) => c.status === 'ABERTO' || c.status === 'EM_ANDAMENTO'),
    [chamados]
  );

  // Próximo vencimento de hospedagem
  const { menorDiasHospedagem, proximoVencimentoHospedagem } = useMemo(() => {
    let menor: number | null = null;
    let dataProx: string | null = null;

    hospedagens.forEach((h) => {
      const diasVps =
        typeof h.diasParaVps === 'number' ? h.diasParaVps : calcularDiasRestantes(h.dataRenovacaoVps);
      const diasDom =
        typeof h.diasParaDominio === 'number'
          ? h.diasParaDominio
          : calcularDiasRestantes(h.dataExpiracaoDominio);

      let dLocal: number | null = null;
      let dataLocal: string | null = null;

      if (diasVps !== null && (diasDom === null || diasVps <= diasDom)) {
        dLocal = diasVps;
        dataLocal = h.dataRenovacaoVps || null;
      } else if (diasDom !== null) {
        dLocal = diasDom;
        dataLocal = h.dataExpiracaoDominio || null;
      }
      if (typeof h.menorDias === 'number') {
        dLocal = h.menorDias;
      }

      if (dLocal !== null) {
        if (menor === null || dLocal < menor) {
          menor = dLocal;
          dataProx = dataLocal;
        }
      }
    });

    return { menorDiasHospedagem: menor, proximoVencimentoHospedagem: dataProx };
  }, [hospedagens]);

  // --- COMPILAÇÃO DA SEÇÃO "PRECISA DE ATENÇÃO" ---
  const itensAtencao = useMemo(() => {
    const lista: ItemAtencao[] = [];

    // 1. Tarefas Atrasadas
    tarefasAtrasadas.forEach((t) => {
      const dias = calcularDiasRestantes(t.prazo);
      const diasAbs = dias !== null ? Math.abs(dias) : 1;
      lista.push({
        id: `task-${t.id}`,
        tipo: 'TAREFA_ATRASADA',
        titulo: t.titulo,
        detalhe: `Venceu há ${diasAbs} ${diasAbs === 1 ? 'dia' : 'dias'} (${formatarDataBR(t.prazo)})`,
        urgencia: 'CRITICO',
        badgeTexto: 'Tarefa Atrasada',
        acaoLabel: 'Ver no GP',
        onAcao: () => navigate(`/gp?clienteId=${cliente.id}`),
      });
    });

    // 2. Chamados Abertos
    chamadosAbertos.forEach((c) => {
      const isCritico = c.urgencia === 'ALTA';
      lista.push({
        id: `chamado-${c.id}`,
        tipo: 'CHAMADO_ABERTO',
        titulo: c.titulo || 'Chamado de suporte sem título',
        detalhe: `Status: ${c.status === 'ABERTO' ? 'Aguardando atendimento' : 'Em andamento'} · Urgência: ${c.urgencia || 'Média'}`,
        urgencia: isCritico ? 'CRITICO' : 'ATENCAO',
        badgeTexto: c.urgencia === 'ALTA' ? 'Chamado Urgente' : 'Chamado Aberto',
        acaoLabel: 'Ver Chamado',
        onAcao: () => (onOpenChamado ? onOpenChamado() : navigate('/gp')),
      });
    });

    // 3. Hospedagens Vencendo em Breve (<= 30 dias)
    hospedagens.forEach((h) => {
      const diasVps =
        typeof h.diasParaVps === 'number' ? h.diasParaVps : calcularDiasRestantes(h.dataRenovacaoVps);
      const diasDom =
        typeof h.diasParaDominio === 'number'
          ? h.diasParaDominio
          : calcularDiasRestantes(h.dataExpiracaoDominio);

      let d: number | null = null;
      let tipoAlvo: 'VPS' | 'Domínio' = 'VPS';
      if (diasVps !== null && (diasDom === null || diasVps <= diasDom)) {
        d = diasVps;
        tipoAlvo = 'VPS';
      } else if (diasDom !== null) {
        d = diasDom;
        tipoAlvo = 'Domínio';
      }
      if (typeof h.menorDias === 'number') d = h.menorDias;

      if (d !== null && d <= 30) {
        const vencido = d < 0;
        const hoje = d === 0;
        const msg = vencido
          ? `Venceu há ${Math.abs(d)} dia(s)`
          : hoje
          ? 'Vence hoje!'
          : `Vence em ${d} dia(s)`;

        lista.push({
          id: `hosp-${h.id}`,
          tipo: 'VENCIMENTO_HOSPEDAGEM',
          titulo: `${h.titulo || 'Ativo de Hospedagem'} (${tipoAlvo})`,
          detalhe: `${h.url || h.dominio || 'Sem URL'} · ${msg}`,
          urgencia: d <= 7 ? 'CRITICO' : 'ATENCAO',
          badgeTexto: d <= 7 ? 'Renovação Crítica' : 'Renovação Próxima',
          acaoLabel: 'Ver no Radar',
          onAcao: () => navigate('/hospedagens'),
        });
      }
    });

    // Ordenação: críticos primeiro
    return lista.sort((a, b) => (a.urgencia === 'CRITICO' ? -1 : 1));
  }, [tarefasAtrasadas, chamadosAbertos, hospedagens, cliente.id, navigate, onOpenChamado]);

  // --- DADOS PARA O GRÁFICO DE TAREFAS POR ETAPA ---
  const dadosGraficoTarefas = useMemo(() => {
    const contagem: Record<string, number> = {
      BACKLOG: 0,
      A_FAZER: 0,
      EM_ANDAMENTO: 0,
      EM_REVISAO: 0,
      CONCLUIDA: 0,
    };

    tarefas.forEach((t) => {
      if (contagem[t.status] !== undefined) {
        contagem[t.status] += 1;
      }
    });

    return STATUS_TAREFA_ORDER.map((st) => ({
      status: st,
      label: STATUS_TAREFA_LABELS[st] || st,
      total: contagem[st] || 0,
    }));
  }, [tarefas]);

  // Próximas entregas ordenadas
  const proximosPrazos = useMemo(() => {
    return tarefas
      .filter((t) => t.prazo && t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA')
      .sort((a, b) => new Date(a.prazo!).getTime() - new Date(b.prazo!).getTime())
      .slice(0, 5);
  }, [tarefas]);

  return (
    <div className="space-y-6 select-none w-full">
      {/* ========================================================================= */}
      {/* 1. KPI STRIP (RESUMO EXECUTIVO)                                           */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="pw-glass-card h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Serviços Contratados */}
          <div
            onClick={() => onNavigateTab?.('services')}
            className="pw-glass-card p-4 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#8F8271]">Serviços Ativos</span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF2E4] text-[#8A6828] flex items-center justify-center border border-[#E8D4B4]">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1E1A16] tracking-tight">
                  {servicosAtivos.length}
                </span>
                <span className="text-xs font-bold text-[#8F8271]">
                  de {servicos.length} contratado{servicos.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-[11.5px] text-[#7A6440] font-medium mt-0.5 flex items-center gap-1">
                <span>Ver mapa de serviços</span>
                <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </div>

          {/* KPI 2: Hospedagens e Domínios */}
          <div
            onClick={() => navigate('/hospedagens')}
            className="pw-glass-card p-4 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#8F8271]">Hospedagens & Domínios</span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF2E4] text-[#8A6828] flex items-center justify-center border border-[#E8D4B4]">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1E1A16] tracking-tight">
                  {hospedagens.length}
                </span>
                <span className="text-xs font-bold text-[#8F8271]">
                  ativo{hospedagens.length === 1 ? '' : 's'} cadastrado{hospedagens.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-[11.5px] font-medium mt-0.5 truncate">
                {menorDiasHospedagem === null ? (
                  <span className="text-[#8F8271]">Sem renovações cadastradas</span>
                ) : menorDiasHospedagem < 0 ? (
                  <span className="text-[#B83B32] font-bold">Vencido há {Math.abs(menorDiasHospedagem)} dias</span>
                ) : menorDiasHospedagem <= 7 ? (
                  <span className="text-[#B83B32] font-bold">Crítico: vence em {menorDiasHospedagem} dias</span>
                ) : menorDiasHospedagem <= 30 ? (
                  <span className="text-[#8A6828] font-bold">Atenção: vence em {menorDiasHospedagem} dias</span>
                ) : (
                  <span className="text-[#247A4A] font-bold">Em dia: vence em {menorDiasHospedagem} dias</span>
                )}
              </p>
            </div>
          </div>

          {/* KPI 3: Tarefas e Demandas */}
          <div
            onClick={() => navigate(`/gp?clienteId=${cliente.id}`)}
            className="pw-glass-card p-4 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#8F8271]">Tarefas em Aberto</span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF2E4] text-[#8A6828] flex items-center justify-center border border-[#E8D4B4]">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1E1A16] tracking-tight">
                  {tarefasAbertas.length}
                </span>
                <span className="text-xs font-bold text-[#8F8271]">
                  de {tarefas.length} tarefa{tarefas.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-[11.5px] font-medium mt-0.5">
                {tarefasAtrasadas.length > 0 ? (
                  <span className="text-[#B83B32] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {tarefasAtrasadas.length} atrasada{tarefasAtrasadas.length === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="text-[#247A4A] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Nenhuma atrasada
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* KPI 4: Chamados de Suporte */}
          <div
            onClick={() => (onOpenChamado ? onOpenChamado() : navigate('/gp'))}
            className="pw-glass-card p-4 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#8F8271]">Central de Chamados</span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF2E4] text-[#8A6828] flex items-center justify-center border border-[#E8D4B4]">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1E1A16] tracking-tight">
                  {chamadosAbertos.length}
                </span>
                <span className="text-xs font-bold text-[#8F8271]">
                  em atendimento
                </span>
              </div>
              <p className="text-[11.5px] font-medium mt-0.5">
                {chamadosAbertos.length > 0 ? (
                  <span className="text-[#8A6828] font-bold">Demanda atenção imediata</span>
                ) : (
                  <span className="text-[#247A4A] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Nenhum chamado pendente
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEÇÃO: PRECISA DE ATENÇÃO (AÇÕES IMEDIATAS)                            */}
      {/* ========================================================================= */}
      <div className="pw-glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 pb-1 border-b border-[#E8D4B4]/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B83B32] animate-pulse" />
            <h3 className="text-sm font-bold text-[#1E1A16] uppercase tracking-wider">
              Precisa de Atenção
            </h3>
            {itensAtencao.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#B83B32]/10 text-[#B83B32] border border-[#B83B32]/30">
                {itensAtencao.length} pendência{itensAtencao.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <span className="text-xs text-[#8F8271]">
            Tarefas atrasadas, chamados e renovações iminentes
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 py-2 animate-pulse">
            <div className="h-16 rounded-2xl bg-white/40" />
            <div className="h-16 rounded-2xl bg-white/40" />
          </div>
        ) : itensAtencao.length === 0 ? (
          <div className="py-6 px-4 rounded-2xl bg-[#E6F4EA]/40 border border-[#CEEAD6] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#247A4A]/10 text-[#247A4A] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1E1A16]">
                Tudo em dia com este cliente!
              </h4>
              <p className="text-[12px] text-[#5E574C] mt-0.5">
                Não há tarefas atrasadas, chamados abertos ou renovações críticas previstas para os próximos 30 dias.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {itensAtencao.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all border ${
                  item.urgencia === 'CRITICO'
                    ? 'bg-[#FDF2F2]/60 border-[#FCDAD7] hover:bg-[#FDF2F2]'
                    : 'bg-[#FAF2E4]/60 border-[#E8D4B4] hover:bg-[#FAF2E4]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10.5px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        item.urgencia === 'CRITICO'
                          ? 'bg-[#B83B32] text-white'
                          : 'bg-[#C7A15F] text-[#181512]'
                      }`}
                    >
                      {item.badgeTexto}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1E1A16] truncate" title={item.titulo}>
                    {item.titulo}
                  </h4>
                  <p className="text-[11.5px] text-[#5E574C] truncate mt-0.5">
                    {item.detalhe}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={item.onAcao}
                  className="pw-glass-control px-3 py-1.5 rounded-xl text-xs font-bold text-[#1E1A16] hover:bg-white flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                >
                  <span>{item.acaoLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#7A6440]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SERVIÇOS CONTRATADOS (COM ATALHO PARA O PLANEJAMENTO)                  */}
      {/* ========================================================================= */}
      <div className="pw-glass-panel p-6 space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-1 border-b border-[#E8D4B4]/50">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C7A15F]" />
              <h3 className="text-sm font-bold text-[#1E1A16] uppercase tracking-wider">
                Serviços Contratados
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4]">
                {servicos.length}
              </span>
            </div>
            <p className="text-xs text-[#8F8271] mt-0.5">
              Escopos contratados com atalho direto ao planejamento da peça e quadro de produção
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab?.('services')}
              className="pw-glass-control pw-glass-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C7A15F]" />
              <span>Contratar Serviço</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="pw-glass-card h-40 rounded-2xl" />
            ))}
          </div>
        ) : servicos.length === 0 ? (
          <div
            onClick={() => onNavigateTab?.('services')}
            className="py-12 text-center rounded-2xl border border-dashed border-[#D8CBB8] cursor-pointer hover:bg-white/40 transition-all flex flex-col items-center gap-2"
          >
            <FolderKanban className="w-8 h-8 text-[#8F8271]" />
            <p className="text-xs font-bold text-[#1E1A16]">Nenhum serviço contratado ainda</p>
            <p className="text-[12px] text-[#8F8271]">
              Clique para adicionar o primeiro serviço contratado para {cliente.nomeFantasia}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicos.map((servico) => {
              const statusStyle = STATUS_SERVICO_STYLE[servico.status] || STATUS_SERVICO_STYLE.ATIVO;
              const nomeServico =
                (servico as any)?.nomePersonalizado ||
                (servico.tipoServico || '').replace(/_/g, ' ');

              return (
                <div
                  key={servico.id}
                  className="pw-glass-card p-4 rounded-2xl flex flex-col justify-between transition-all hover:shadow-md border border-[#E8D4B4]/60 space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {statusStyle.label}
                      </span>
                      {servico.dataContratacao && (
                        <span className="text-[11px] font-semibold text-[#8F8271] flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {formatarDataBR(servico.dataContratacao)}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-[#1E1A16] leading-snug capitalize">
                      {nomeServico}
                    </h4>

                    {servico.descricaoEscopo ? (
                      <p className="text-[12px] text-[#5E574C] mt-1.5 line-clamp-2 leading-relaxed">
                        {servico.descricaoEscopo}
                      </p>
                    ) : (
                      <p className="text-[12px] text-[#8F8271] italic mt-1.5">
                        Sem escopo detalhado definido
                      </p>
                    )}
                  </div>

                  {/* Ações do Serviço */}
                  <div className="pt-2 border-t border-[#E8D4B4]/40 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/cliente/${cliente.id}/servicos/${servico.id}/planejamento`)
                      }
                      title="Abrir Planejamento de Criação deste serviço"
                      className="pw-glass-control pw-glass-primary flex-1 py-1.5 px-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.02]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C7A15F]" />
                      <span>Planejamento</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/gp?clienteId=${cliente.id}&servicoId=${servico.id}`)
                      }
                      title="Ver tarefas no Vivox GP"
                      className="pw-glass-control py-1.5 px-2.5 text-xs font-bold text-[#1E1A16] hover:bg-white flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Kanban className="w-3.5 h-3.5 text-[#8A6828]" />
                      <span>GP</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. ANÁLISE DE ENTREGAS: GRÁFICO DE TAREFAS + PRÓXIMOS PRAZOS             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna 1: Gráfico com @mui/x-charts */}
        <div className="lg:col-span-7">
          <Panel title="Tarefas por Etapa de Produção" className="h-full">
            {tarefas.length > 0 ? (
              <BarChart
                height={CHART_HEIGHT}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: dadosGraficoTarefas.map((d) => d.label),
                  },
                ]}
                series={[
                  {
                    data: dadosGraficoTarefas.map((d) => d.total),
                    label: 'Demandas',
                    color: CHART_COLORS.gold,
                  },
                ]}
                margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
              />
            ) : (
              <EmptyChart message="Nenhuma demanda registrada para este cliente no Vivox GP." />
            )}
          </Panel>
        </div>

        {/* Coluna 2: Próximos Prazos Agendados */}
        <div className="lg:col-span-5">
          <Panel title="Próximas Entregas Agendadas" className="h-full flex flex-col justify-between">
            {proximosPrazos.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#8F8271]">
                Nenhuma entrega agendada no momento.
              </div>
            ) : (
              <div className="space-y-2 pt-1 flex-1">
                {proximosPrazos.map((t) => {
                  const dias = calcularDiasRestantes(t.prazo);
                  const isAtrasado = dias !== null && dias < 0;

                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/gp?clienteId=${cliente.id}`)}
                      className="p-2.5 rounded-xl bg-white/50 hover:bg-white transition-all cursor-pointer flex items-center justify-between gap-3 border border-[#E8D4B4]/40"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#1E1A16] truncate" title={t.titulo}>
                          {t.titulo}
                        </h4>
                        <p className="text-[11px] text-[#8F8271] truncate">
                          {STATUS_TAREFA_LABELS[t.status] || t.status}
                          {t.responsavel?.nome ? ` · ${t.responsavel.nome}` : ''}
                        </p>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 ${
                          isAtrasado
                            ? 'bg-[#FDF2F2] text-[#B83B32] border border-[#FCDAD7]'
                            : 'bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4]'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {formatarDataBR(t.prazo)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 border-t border-[#E8D4B4]/40 mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/gp?clienteId=${cliente.id}`)}
                className="text-xs font-bold text-[#7A6440] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Abrir Vivox GP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Panel>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DADOS CADASTRAIS AGRUPADOS & RECOLHÍVEIS (ACCORDION)                    */}
      {/* ========================================================================= */}
      <div className="pw-glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#E8D4B4]/50">
          <div>
            <h3 className="text-sm font-bold text-[#1E1A16] uppercase tracking-wider">
              Dados Cadastrais & Acessos
            </h3>
            <p className="text-xs text-[#8F8271]">
              Informações organizadas em seções recolhíveis para consulta rápida
            </p>
          </div>

          {onEditClient && (
            <button
              type="button"
              onClick={onEditClient}
              className="pw-glass-control px-3 py-1.5 text-xs font-bold text-[#1E1A16] hover:bg-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#8A6828]" />
              <span>Editar Dados</span>
            </button>
          )}
        </div>

        {/* 5.1 Bloco 1: Informações da Empresa */}
        <div className="rounded-2xl border border-[#E8D4B4]/60 bg-white/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSecao('empresa')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#8A6828]" />
              <span className="text-xs font-black text-[#1E1A16] uppercase tracking-wider">
                Dados Corporativos
              </span>
            </div>
            {secoesAbertas.empresa ? (
              <ChevronUp className="w-4 h-4 text-[#8F8271]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8F8271]" />
            )}
          </button>

          {secoesAbertas.empresa && (
            <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 border-t border-[#E8D4B4]/30">
              <div className="p-2.5 rounded-xl bg-white/60">
                <span className="text-[11px] font-bold text-[#8F8271] uppercase block">Razão Social</span>
                <span className="text-xs font-bold text-[#1E1A16] truncate block mt-0.5">
                  {cliente.razaoSocial || cliente.nomeFantasia}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#8F8271] uppercase">CNPJ / CPF</span>
                  {cliente.cnpjCpf && (
                    <button
                      type="button"
                      onClick={() => copiarTexto(cliente.cnpjCpf || '', 'cnpj')}
                      title="Copiar CNPJ"
                      className="text-[#7A6440] hover:text-[#1E1A16] cursor-pointer"
                    >
                      {copiadoCampo === 'cnpj' ? <Check className="w-3.5 h-3.5 text-[#247A4A]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <span className="font-mono text-xs font-bold text-[#1E1A16] block mt-0.5">
                  {cliente.cnpjCpf || 'Não informado'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/60">
                <span className="text-[11px] font-bold text-[#8F8271] uppercase block">Segmento</span>
                <span className="text-xs font-bold text-[#1E1A16] truncate block mt-0.5">
                  {cliente.segmento || 'Não informado'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/60">
                <span className="text-[11px] font-bold text-[#8F8271] uppercase block">Início do Contrato</span>
                <span className="text-xs font-bold text-[#1E1A16] block mt-0.5">
                  {formatarDataBR(cliente.dataInicioContrato)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/60">
                <span className="text-[11px] font-bold text-[#8F8271] uppercase block">Responsável Interno</span>
                <span className="text-xs font-bold text-[#1E1A16] truncate block mt-0.5">
                  {cliente.responsavel?.nome || 'Não definido'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/60">
                <span className="text-[11px] font-bold text-[#8F8271] uppercase block">Status da Conta</span>
                <span className="text-xs font-bold text-[#247A4A] block mt-0.5">
                  {cliente.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 5.2 Bloco 2: Contatos & Localização */}
        <div className="rounded-2xl border border-[#E8D4B4]/60 bg-white/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSecao('contatos')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#8A6828]" />
              <span className="text-xs font-black text-[#1E1A16] uppercase tracking-wider">
                Canais de Contato & Localização
              </span>
            </div>
            {secoesAbertas.contatos ? (
              <ChevronUp className="w-4 h-4 text-[#8F8271]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8F8271]" />
            )}
          </button>

          {secoesAbertas.contatos && (
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#E8D4B4]/30">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl bg-white/60">
                  <span className="text-[11px] font-bold text-[#8F8271] uppercase block">E-mail Principal</span>
                  {cliente.email ? (
                    <a
                      href={`mailto:${cliente.email}`}
                      className="text-xs font-bold text-[#7A6440] hover:underline truncate block mt-0.5"
                    >
                      {cliente.email}
                    </a>
                  ) : (
                    <span className="text-xs text-[#8F8271] italic block mt-0.5">Não cadastrado</span>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-white/60">
                  <span className="text-[11px] font-bold text-[#8F8271] uppercase block">Telefone Principal</span>
                  {cliente.telefone ? (
                    <a
                      href={`tel:${cliente.telefone.replace(/\D/g, '')}`}
                      className="text-xs font-bold text-[#7A6440] hover:underline truncate block mt-0.5"
                    >
                      {cliente.telefone}
                    </a>
                  ) : (
                    <span className="text-xs text-[#8F8271] italic block mt-0.5">Não cadastrado</span>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-white/60">
                  <span className="text-[11px] font-bold text-[#8F8271] uppercase block">Localização</span>
                  <span className="text-xs font-bold text-[#1E1A16] truncate block mt-0.5">
                    {cliente.localizacao || 'Não informada'}
                  </span>
                </div>
              </div>

              {/* Lista de Contatos Adicionais */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1E1A16]">
                    Contatos Diretos ({cliente.contatos?.length || 0})
                  </span>
                  {onManageContatos && (
                    <button
                      type="button"
                      onClick={onManageContatos}
                      className="text-[11.5px] font-bold text-[#7A6440] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Gerenciar Contatos
                    </button>
                  )}
                </div>

                {cliente.contatos && cliente.contatos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cliente.contatos.map((contato) => (
                      <div
                        key={contato.id}
                        className="p-2.5 rounded-xl bg-white/70 border border-[#E8D4B4]/40 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-[#1E1A16] truncate">{contato.nome}</h5>
                          <p className="text-[11px] text-[#8F8271] truncate">{contato.cargo || 'Contato'}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#7A6440]">
                            {contato.email && <span className="truncate">{contato.email}</span>}
                            {contato.telefone && <span>{contato.telefone}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8F8271] italic">
                    Nenhum contato específico cadastrado.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5.3 Bloco 3: Integrações & Acessos */}
        <div className="rounded-2xl border border-[#E8D4B4]/60 bg-white/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSecao('acessos')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#8A6828]" />
              <span className="text-xs font-black text-[#1E1A16] uppercase tracking-wider">
                Integrações, IDs & Acessos
              </span>
            </div>
            {secoesAbertas.acessos ? (
              <ChevronUp className="w-4 h-4 text-[#8F8271]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8F8271]" />
            )}
          </button>

          {secoesAbertas.acessos && (
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#E8D4B4]/30">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl bg-white/60">
                  <span className="text-[11px] font-bold text-[#8F8271] uppercase block">Google Analytics 4 ID</span>
                  <span className="font-mono text-xs font-bold text-[#1E1A16] truncate block mt-0.5">
                    {cliente.ga4PropertyId || 'Não configurado'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/60">
                  <span className="text-[11px] font-bold text-[#8F8271] uppercase block">Search Console URL</span>
                  {cliente.gscSiteUrl ? (
                    <a
                      href={cliente.gscSiteUrl.startsWith('http') ? cliente.gscSiteUrl : `https://${cliente.gscSiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#7A6440] hover:underline flex items-center gap-1 truncate mt-0.5"
                    >
                      <span className="truncate">{cliente.gscSiteUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-[#8F8271] italic block mt-0.5">Não configurado</span>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-white/60">
                  <span className="text-[11px] font-bold text-[#8F8271] uppercase block">OpenPanel Project ID</span>
                  <span className="font-mono text-xs font-bold text-[#1E1A16] truncate block mt-0.5">
                    {cliente.openpanelProjectId || 'Não configurado'}
                  </span>
                </div>
              </div>

              {/* Logins e Senhas / Vault */}
              <div className="p-3.5 rounded-xl bg-white/70 border border-[#E8D4B4]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E1A16] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8A6828]" />
                    Credenciais e Logins Armazenados
                  </span>
                  {cliente.loginsSenhas && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMostrarSenhas(!mostrarSenhas)}
                        className="text-xs font-bold text-[#7A6440] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        {mostrarSenhas ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{mostrarSenhas ? 'Ocultar' : 'Revelar'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => copiarTexto(cliente.loginsSenhas || '', 'senhas')}
                        className="pw-glass-control px-2 py-1 text-[11px] font-bold text-[#1E1A16] flex items-center gap-1 cursor-pointer"
                      >
                        {copiadoCampo === 'senhas' ? <Check className="w-3 h-3 text-[#247A4A]" /> : <Copy className="w-3 h-3" />}
                        <span>Copiar</span>
                      </button>
                    </div>
                  )}
                </div>

                {cliente.loginsSenhas ? (
                  mostrarSenhas ? (
                    <pre className="text-xs text-[#1E1A16] font-mono bg-white p-2.5 rounded-lg border border-[#E8D4B4]/50 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                      {cliente.loginsSenhas}
                    </pre>
                  ) : (
                    <p className="text-xs text-[#8F8271] italic">
                      •••••••••••••••••••••••••••••••• (Clique em "Revelar" para visualizar os dados confidenciais)
                    </p>
                  )
                ) : (
                  <p className="text-xs text-[#8F8271] italic">
                    Nenhum login, senha ou link de vault cadastrado para este cliente.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. DIRETRIZES ESTRATÉGICAS DA CONTA                                       */}
      {/* ========================================================================= */}
      <div className="pw-glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E8D4B4]/50 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8A6828]" />
            <h3 className="text-sm font-bold text-[#1E1A16] uppercase tracking-wider">
              Diretrizes Estratégicas da Marca
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {obsSalva && (
              <span className="text-xs font-bold text-[#247A4A] flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Diretrizes salvas!
              </span>
            )}
            <button
              type="button"
              onClick={handleSalvarObservacoes}
              disabled={salvandoObs}
              className="pw-glass-control pw-glass-primary px-4 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {salvandoObs ? 'Salvando...' : 'Salvar Diretrizes'}
            </button>
          </div>
        </div>

        <textarea
          rows={4}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Insira diretrizes de tom de voz, regras da marca, particularidades do cliente e observações estratégicas para o time..."
          className="w-full bg-white/70 rounded-2xl p-4 text-xs text-[#1E1A16] leading-relaxed outline-none border border-[#E8D4B4]/60 focus:border-[#C7A15F] transition-all resize-y shadow-inner"
        />
      </div>
    </div>
  );
}
