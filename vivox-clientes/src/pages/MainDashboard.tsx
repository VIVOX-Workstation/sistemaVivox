import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Globe,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BarChart2,
  Plus,
  ArrowRight,
  Briefcase,
  Layers,
  Sparkles,
  ExternalLink,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { CanvasAnimation } from '../components/CanvasAnimation';

interface DashboardData {
  clientes: {
    total: number;
    ativos: number;
    prospects: number;
    pausados: number;
  };
  servicos: {
    ativos: number;
    producoesEmAndamento: number;
    oportunidadesAbertas: number;
  };
  landingPages: {
    total: number;
    criticos7Dias: number;
    atencao30Dias: number;
    emDia: number;
    proximosVencimentos: Array<{
      id: string;
      clienteId: string;
      cliente: { id: string; nomeFantasia: string };
      titulo: string;
      url: string;
      dominio?: string;
      dataExpiracaoDominio?: string;
      diasRestantes: number | null;
      nivelUrgencia: 'CRITICO' | 'ATENCAO' | 'EM_DIA' | 'SEM_DATA';
    }>;
  };
  ultimosClientes: Array<{
    id: string;
    nomeFantasia: string;
    segmento: string;
    status: string;
    ga4PropertyId?: string;
    gscSiteUrl?: string;
    logoUrl?: string;
    createdAt: string;
    responsavel?: { nome: string };
    _count: {
      servicosContratados: number;
      ativosHospedagem: number;
    };
  }>;
}

export function MainDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/dashboard-executivo');
      setData(res.data);
    } catch (err) {
      console.error('Erro ao carregar Dashboard Executivo:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatarDataBR = (dataStr?: string) => {
    if (!dataStr) return '-';
    const d = new Date(dataStr);
    return d.toLocaleDateString('pt-BR');
  };

  const getPrimeiroNome = (nomeCompleto?: string) => {
    if (!nomeCompleto) return 'Equipe';
    return nomeCompleto.split(' ')[0];
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* CABEÇALHO BOAS-VINDAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFDF8] p-6 rounded-[11px] border border-[#D8CBB8] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#247A4A] inline-block"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A6828]">
              Painel Executivo da Agência
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight">
            Olá, {getPrimeiroNome(user?.nome)} 👋
          </h1>
          <p className="text-xs text-[#625746]">
            Aqui está a visão consolidada de clientes, Landing Pages, renovações de domínio e métricas de desempenho.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/cliente/novo')}
            className="px-3.5 py-2 rounded-lg bg-[#B89455] hover:bg-[#9E7A3F] text-[#1D160B] text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="h-9 px-3 rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] hover:bg-[#EEE7DC] text-[#1E1A16] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B89455] ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* CARDS DE KPIS CONSOLIDADOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Clientes */}
        <div
          onClick={() => navigate('/clientes')}
          className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#847663] text-xs font-semibold">
            <span>Clientes da Carteira</span>
            <Users className="w-4 h-4 text-[#B89455]" />
          </div>
          <h3 className="text-2xl font-bold text-[#1E1A16] mt-2">{data?.clientes.total || 0}</h3>
          <div className="flex items-center gap-2 text-[10px] text-[#625746] mt-1 pt-2 border-t border-[#EEE7DC]">
            <span className="text-[#247A4A] font-bold">{data?.clientes.ativos || 0} ativos</span>
            <span>•</span>
            <span>{data?.clientes.prospects || 0} prospects</span>
          </div>
        </div>

        {/* Landing Pages */}
        <div
          onClick={() => navigate('/analytics')}
          className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#847663] text-xs font-semibold">
            <span>Landing Pages Ativas</span>
            <Globe className="w-4 h-4 text-[#B89455]" />
          </div>
          <h3 className="text-2xl font-bold text-[#1E1A16] mt-2">{data?.landingPages.total || 0}</h3>
          <p className="text-[10px] text-[#625746] mt-1 pt-2 border-t border-[#EEE7DC]">
            Páginas e sites monitorados
          </p>
        </div>

        {/* Alertas de Domínio */}
        <div
          onClick={() => navigate('/analytics')}
          className={`p-4 rounded-[11px] border shadow-2xs cursor-pointer transition-all flex flex-col justify-between ${
            (data?.landingPages.criticos7Dias || 0) > 0
              ? 'bg-[#FDF2F2] border-[#B83B32]'
              : 'bg-[#FFFDF8] border-[#D8CBB8] hover:border-[#B89455]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={(data?.landingPages.criticos7Dias || 0) > 0 ? 'text-[#B83B32]' : 'text-[#847663]'}>
              Domínios em Alerta
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                (data?.landingPages.criticos7Dias || 0) > 0 ? 'text-[#B83B32]' : 'text-[#8A6828]'
              }`}
            />
          </div>
          <h3
            className={`text-2xl font-bold mt-2 ${
              (data?.landingPages.criticos7Dias || 0) > 0 ? 'text-[#B83B32]' : 'text-[#1E1A16]'
            }`}
          >
            {(data?.landingPages.criticos7Dias || 0) + (data?.landingPages.atencao30Dias || 0)}
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-[#625746] mt-1 pt-2 border-t border-[#EEE7DC]">
            <span className="text-[#B83B32] font-bold">{data?.landingPages.criticos7Dias || 0} críticos (&le;7d)</span>
            <span>•</span>
            <span className="text-[#8A6828] font-bold">{data?.landingPages.atencao30Dias || 0} atenção (&le;30d)</span>
          </div>
        </div>

        {/* Serviços em Andamento */}
        <div
          onClick={() => navigate('/clientes')}
          className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#847663] text-xs font-semibold">
            <span>Serviços Contratados</span>
            <Briefcase className="w-4 h-4 text-[#B89455]" />
          </div>
          <h3 className="text-2xl font-bold text-[#1E1A16] mt-2">{data?.servicos.ativos || 0}</h3>
          <p className="text-[10px] text-[#625746] mt-1 pt-2 border-t border-[#EEE7DC]">
            {data?.servicos.producoesEmAndamento || 0} produções ativas
          </p>
        </div>
      </div>

      {/* RADAR DE DOMÍNIOS PRÓXIMOS DE VENCER */}
      {data?.landingPages.proximosVencimentos && data.landingPages.proximosVencimentos.length > 0 && (
        <div className="bg-[#FAF6F0] border border-[#E5D9C8] rounded-[11px] p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8A6828]" />
              <h3 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
                Próximas Renovações de Domínio das Landing Pages
              </h3>
            </div>
            <span className="text-[11px] text-[#625746]">
              Acompanhamento para não interromper tráfego pago
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {data.landingPages.proximosVencimentos.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/cliente/${item.clienteId}`)}
                className="bg-[#FFFDF8] p-3.5 rounded-lg border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] cursor-pointer transition-all flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#1E1A16]">{item.cliente?.nomeFantasia}</h4>
                    <p className="text-[11px] text-[#625746] font-medium truncate max-w-[180px]">{item.titulo}</p>
                  </div>
                  {item.nivelUrgencia === 'CRITICO' ? (
                    <span className="text-[10px] text-[#B83B32] bg-[#FDF2F2] border border-[#FCDAD7] px-2 py-0.5 rounded font-bold">
                      {typeof item.diasRestantes === 'number' && item.diasRestantes < 0
                        ? `Vencido há ${Math.abs(item.diasRestantes)}d`
                        : `Vence em ${item.diasRestantes}d`}
                    </span>
                  ) : item.nivelUrgencia === 'ATENCAO' ? (
                    <span className="text-[10px] text-[#8A6828] bg-[#FAF2E4] border border-[#E8D4B4] px-2 py-0.5 rounded font-bold">
                      Vence em {item.diasRestantes}d
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#247A4A] bg-[#E6F4EA] border border-[#CEEAD6] px-2 py-0.5 rounded font-semibold">
                      Em dia ({item.diasRestantes}d)
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#EEE7DC]">
                  <span className="font-mono text-[#8A6828] truncate max-w-[160px]">{item.dominio || item.url}</span>
                  <span className="text-[#847663]">Expira: {formatarDataBR(item.dataExpiracaoDominio)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO PRINCIPAL: CLIENTES RECENTES & ACESSOS RÁPIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Clientes Recentes (2 colunas) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#D8CBB8]/70 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#B89455]" />
              <h2 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
                Clientes Recentes na Carteira
              </h2>
            </div>
            <button
              onClick={() => navigate('/clientes')}
              className="text-xs font-bold text-[#8A6828] hover:underline flex items-center gap-1"
            >
              Ver todos os clientes <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data?.ultimosClientes.map((cliente) => {
              const temGoogle = Boolean(cliente.ga4PropertyId || cliente.gscSiteUrl);

              return (
                <div
                  key={cliente.id}
                  onClick={() => navigate(`/cliente/${cliente.id}`)}
                  className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] cursor-pointer transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-[#FAF2E4] border border-[#E8D4B4] rounded-[11px] flex items-center justify-center text-[#8A6828] font-bold text-sm shrink-0">
                        {cliente.nomeFantasia.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1E1A16] text-xs group-hover:text-[#8A6828] transition-colors truncate max-w-[140px]">
                          {cliente.nomeFantasia}
                        </h4>
                        <p className="text-[11px] text-[#625746] truncate max-w-[140px]">{cliente.segmento}</p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        cliente.status?.toUpperCase() === 'ATIVO'
                          ? 'success'
                          : cliente.status?.toUpperCase() === 'PROSPECT'
                          ? 'warning'
                          : 'default'
                      }
                      className="text-[9px] px-2 py-0.5"
                    >
                      {cliente.status}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-[#EEE7DC] flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-[#847663]">
                      <span>{cliente._count.ativosHospedagem} LPs</span>
                      <span>•</span>
                      <span>{cliente._count.servicosContratados} serviços</span>
                    </div>

                    {temGoogle && (
                      <span className="text-[9px] font-bold text-[#8A6828] bg-[#FAF2E4] border border-[#E8D4B4] px-1.5 py-0.5 rounded">
                        GA4 / SEO
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Lateral: Acessos Rápidos & Módulos Vivox */}
        <div className="space-y-4">
          <div className="border-b border-[#D8CBB8]/70 pb-2">
            <h2 className="text-xs font-bold text-[#1E1A16] uppercase tracking-wider">
              Ações & Módulos Rápidos
            </h2>
          </div>

          <div className="space-y-3">
            {/* Card Vivox Clientes */}
            <div
              onClick={() => navigate('/clientes')}
              className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E1A16] group-hover:text-[#8A6828] transition-colors">
                    Vivox Clientes
                  </h4>
                  <p className="text-[11px] text-[#625746]">Gestão completa da carteira e contratos</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#847663] group-hover:text-[#8A6828] transition-colors" />
            </div>

            {/* Card Vivox Analytics */}
            <div
              onClick={() => navigate('/analytics')}
              className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-2xs hover:border-[#B89455] cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4] flex items-center justify-center font-bold">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E1A16] group-hover:text-[#8A6828] transition-colors">
                    Vivox Analytics
                  </h4>
                  <p className="text-[11px] text-[#625746]">GA4, Search Console e relatórios mensais</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#847663] group-hover:text-[#8A6828] transition-colors" />
            </div>

            {/* Widget Status do Sistema */}
            <div className="bg-[#14120E] p-4 rounded-[11px] border border-[#2B261F] shadow-2xs flex flex-col items-center justify-center relative overflow-hidden group">
              <CanvasAnimation animationId="sphere-scan" title="Sistema Online" className="w-full h-40" />
            </div>

            {/* Banner Dica Estratégica */}
            <div className="bg-[#FAF6F0] p-4 rounded-[11px] border border-[#E5D9C8] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8A6828]">
                <Sparkles className="w-3.5 h-3.5" />
                Dica Estratégica
              </div>
              <p className="text-xs text-[#625746] leading-relaxed">
                Mantenha os IDs de GA4 e domínios atualizados no perfil de cada cliente para gerar relatórios automáticos de apresentação em segundos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
