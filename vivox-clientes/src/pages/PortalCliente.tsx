import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { 
  LogOut, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Share2, 
  FileText, 
  BookOpen, 
  Globe, 
  Smartphone, 
  Camera, 
  Video, 
  TrendingUp, 
  Palette, 
  Layers, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Send,
  Building2,
  Check,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { portalApi, type MapaServicosResponse, type ServicoMapaItem } from '../api/portal';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { useLiquidGlass } from '../hooks/useLiquidGlass';
import './planning-workspace.css';

function getServicoIcon(tipoServico: string) {
  switch (tipoServico) {
    case 'GERENCIAMENTO_REDES':
      return <Share2 className="w-5 h-5 text-[#8A6828]" />;
    case 'FOLDER':
      return <FileText className="w-5 h-5 text-[#8A6828]" />;
    case 'REVISTA':
      return <BookOpen className="w-5 h-5 text-[#8A6828]" />;
    case 'LANDING_PAGE':
      return <Globe className="w-5 h-5 text-[#8A6828]" />;
    case 'APP':
      return <Smartphone className="w-5 h-5 text-[#8A6828]" />;
    case 'FOTOGRAFIA':
      return <Camera className="w-5 h-5 text-[#8A6828]" />;
    case 'VIDEO':
      return <Video className="w-5 h-5 text-[#8A6828]" />;
    case 'TRAFEGO_PAGO':
      return <TrendingUp className="w-5 h-5 text-[#8A6828]" />;
    case 'IDENTIDADE_VISUAL':
      return <Palette className="w-5 h-5 text-[#8A6828]" />;
    default:
      return <Sparkles className="w-5 h-5 text-[#8A6828]" />;
  }
}

const STATUS_SERVICO_LABEL: Record<string, string> = {
  ATIVO: 'Ativo',
  CONCLUIDO: 'Concluído',
  PAUSADO: 'Pausado',
};

export function PortalCliente() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MapaServicosResponse | null>(null);

  // Modal de Interesse
  const [modalOpen, setModalOpen] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<ServicoMapaItem | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  useLiquidGlass(workspaceRef, !loading);

  const carregarMapaServicos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await portalApi.getMapaServicos();
      setData(res);
    } catch (err: any) {
      console.error('Erro ao carregar mapa de serviços:', err);
      setError(err.response?.data?.message || 'Não foi possível carregar seu mapa de serviços.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMapaServicos();
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate('/portal/entrar', { replace: true });
  };

  const handleAbrirInteresse = (servico: ServicoMapaItem) => {
    setServicoSelecionado(servico);
    setMensagem('');
    setErroModal(null);
    setModalOpen(true);
  };

  const handleEnviarInteresse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoSelecionado) return;

    setEnviando(true);
    setErroModal(null);

    try {
      await portalApi.registrarInteresse({
        tipoServico: servicoSelecionado.tipoServico,
        mensagem: mensagem.trim() || undefined,
      });

      // Atualiza o estado local para marcar interesseRegistrado
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          servicos: prev.servicos.map((s) =>
            s.tipoServico === servicoSelecionado.tipoServico
              ? { ...s, interesseRegistrado: true }
              : s
          ),
        };
      });

      setModalOpen(false);
      setFeedbackSucesso(`Interesse em "${servicoSelecionado.label}" enviado com sucesso!`);
      setTimeout(() => setFeedbackSucesso(null), 4000);
    } catch (err: any) {
      console.error('Erro ao registrar interesse:', err);
      setErroModal(err.response?.data?.message || 'Erro ao registrar interesse. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const formatarData = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  // Separação dos serviços
  const servicosContratados = data?.servicos.filter((s) => s.contratado) || [];
  const servicosDisponiveis = data?.servicos.filter((s) => !s.contratado) || [];

  return (
    <div ref={workspaceRef} className="planning-workspace w-full select-none flex flex-col text-[#1E1A16]" style={{ minHeight: '100dvh' }}>
      {/* Camada visual auxiliar de cena líquida */}
      <div className="pw-lg-scene" aria-hidden="true" />

      {/* Topo do Portal */}
      <header className="relative z-10 w-full mb-8">
        <div className="pw-glass-panel p-4 sm:p-5 rounded-3xl border border-white/60 flex items-center justify-between gap-4 flex-wrap shadow-sm">
          {/* Logo e Nome do Cliente */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {data?.cliente.logoUrl ? (
                <img
                  src={resolveMediaUrl(data.cliente.logoUrl)}
                  alt={data.cliente.nomeFantasia}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-6 h-6 text-[#8A6828]" />
              )}
            </div>
            <div className="truncate">
              <span className="text-[11px] font-bold text-[#7A6440] uppercase tracking-wider block">
                Portal do Cliente
              </span>
              <h1 className="font-archivo text-lg sm:text-xl font-extrabold text-[#1E1A16] truncate">
                {data?.cliente.nomeFantasia || 'Carregando...'}
              </h1>
            </div>
          </div>

          {/* Ações Topo e Navegação */}
          <div className="flex items-center gap-3 flex-wrap">
            <nav className="flex items-center gap-1.5 bg-white/60 p-1 rounded-2xl border border-[#524B40]/10 shadow-2xs">
              <NavLink
                to="/portal"
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-[#181512] text-[#C7A15F] shadow-xs'
                      : 'text-[#625746] hover:text-[#1E1A16] hover:bg-white/80'
                  }`
                }
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Serviços</span>
              </NavLink>

              <NavLink
                to="/portal/acompanhamento"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-[#181512] text-[#C7A15F] shadow-xs'
                      : 'text-[#625746] hover:text-[#1E1A16] hover:bg-white/80'
                  }`
                }
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Acompanhamento</span>
              </NavLink>
            </nav>

            <button
              type="button"
              onClick={handleSignOut}
              className="pw-glass-control px-4 py-2 rounded-xl text-xs font-bold text-[#1E1A16] hover:bg-white hover:text-red-700 flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
              title="Encerrar sessão no portal"
            >
              <LogOut className="w-4 h-4 text-[#8A6828]" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Alerta de Feedback Sucesso */}
      {feedbackSucesso && (
        <div className="relative z-10 mb-6 p-4 rounded-2xl bg-[#E6F4EA] border border-[#CEEAD6] text-[#247A4A] text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#247A4A] shrink-0" />
            <span>{feedbackSucesso}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSucesso(null)}
            className="p-1 hover:bg-[#CEEAD6]/50 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 space-y-10">
        {loading ? (
          // Skeleton Loading
          <div className="space-y-8 animate-pulse" aria-busy="true">
            <div className="space-y-3">
              <div className="h-6 w-48 bg-[#CCB691]/20 rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 rounded-3xl bg-white/40 border border-white/60 p-5 space-y-3" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-6 w-56 bg-[#CCB691]/20 rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 rounded-3xl bg-white/40 border border-white/60 p-5 space-y-3" />
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          // Erro de carregamento
          <div className="pw-glass-panel p-8 rounded-3xl border border-red-200 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1E1A16]">Erro ao carregar serviços</h2>
              <p className="text-xs text-[#5E574C] mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={carregarMapaServicos}
              className="pw-glass-control pw-glass-gold px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar novamente</span>
            </button>
          </div>
        ) : (
          <>
            {/* SEÇÃO 1: Seus Serviços Contratados */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-archivo text-base sm:text-lg font-extrabold text-[#1E1A16] flex items-center gap-2">
                    <span>Seus Serviços</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF2E4] border border-[#E8D4B4] text-[#8A6828] font-bold">
                      {servicosContratados.length}
                    </span>
                  </h2>
                  <p className="text-xs text-[#5E574C]">
                    Soluções ativas e em execução pela nossa equipe para a sua marca.
                  </p>
                </div>
              </div>

              {servicosContratados.length === 0 ? (
                <div className="pw-glass-panel p-8 rounded-3xl border border-white/60 text-center space-y-2">
                  <p className="text-xs font-bold text-[#5E574C]">Nenhum serviço ativo no momento.</p>
                  <p className="text-[11px] text-[#847663]">
                    Explore abaixo os serviços disponíveis para desbloquear com nossa equipe!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {servicosContratados.map((servico) => (
                    <div
                      key={servico.tipoServico}
                      className="pw-glass-panel p-5 rounded-3xl border border-[#C7A15F]/35 bg-white/70 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-[#C7A15F]/60"
                    >
                      {/* Topo do card: ícone e selo status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center shrink-0 shadow-2xs">
                          {getServicoIcon(servico.tipoServico)}
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E6F4EA] text-[#247A4A] border border-[#CEEAD6] flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#247A4A]" />
                          <span>{(servico.status && STATUS_SERVICO_LABEL[servico.status]) || 'Ativo'}</span>
                        </span>
                      </div>

                      {/* Título e descrição */}
                      <div className="space-y-1.5 flex-1">
                        <h3 className="font-archivo text-base font-extrabold text-[#1E1A16] leading-snug">
                          {servico.label}
                        </h3>
                        <p className="text-xs text-[#5E574C] leading-relaxed">
                          {servico.descricao}
                        </p>
                      </div>

                      {/* Rodapé: data de contratação */}
                      <div className="pt-3 border-t border-[#524B40]/10 flex items-center justify-between text-[11px] text-[#7A6440] font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8A6828]" />
                          {servico.dataContratacao
                            ? `Contratado em ${formatarData(servico.dataContratacao)}`
                            : 'Em vigência'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SEÇÃO 2: Disponíveis para Desbloquear */}
            <section className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-archivo text-base sm:text-lg font-extrabold text-[#1E1A16] flex items-center gap-2">
                    <span>Disponíveis para Desbloquear</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600 font-bold">
                      {servicosDisponiveis.length}
                    </span>
                  </h2>
                  <p className="text-xs text-[#5E574C]">
                    Potencialize os resultados da sua marca ativando novas soluções sob medida.
                  </p>
                </div>
              </div>

              {servicosDisponiveis.length === 0 ? (
                <div className="pw-glass-panel p-8 rounded-3xl border border-white/60 text-center space-y-2">
                  <p className="text-xs font-bold text-[#247A4A]">
                    Parabéns! Sua empresa já contratou todos os serviços disponíveis no catálogo.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {servicosDisponiveis.map((servico) => (
                    <div
                      key={servico.tipoServico}
                      className="pw-glass-panel p-5 rounded-3xl border border-[#524B40]/12 bg-white/45 opacity-90 hover:opacity-100 transition-all flex flex-col justify-between space-y-4 hover:border-[#C7A15F]/40 shadow-2xs"
                    >
                      {/* Topo do card: ícone e cadeado */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/60 border border-[#524B40]/10 flex items-center justify-center shrink-0">
                          {getServicoIcon(servico.tipoServico)}
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100/80 text-stone-600 border border-stone-200 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-stone-500" />
                          <span>Disponível</span>
                        </span>
                      </div>

                      {/* Título e descrição */}
                      <div className="space-y-1.5 flex-1">
                        <h3 className="font-archivo text-base font-extrabold text-[#1E1A16] leading-snug">
                          {servico.label}
                        </h3>
                        <p className="text-xs text-[#5E574C] leading-relaxed">
                          {servico.descricao}
                        </p>
                      </div>

                      {/* Rodapé: Interesse enviado ou Botão Tenho Interesse */}
                      <div className="pt-3 border-t border-[#524B40]/10 space-y-2">
                        {servico.interesseRegistrado ? (
                          <>
                            <div className="p-2.5 rounded-xl bg-[#FAF2E4] border border-[#E8D4B4] text-[#8A6828] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs text-center">
                              <CheckCircle2 className="w-4 h-4 text-[#8A6828] shrink-0" />
                              <span>Interesse enviado - nossa equipe vai entrar em contato</span>
                            </div>
                            <button
                              type="button"
                              disabled
                              className="w-full pw-glass-control opacity-50 cursor-not-allowed px-4 py-2 text-xs font-bold rounded-xl text-[#8F8271]"
                            >
                              Interesse Registrado
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAbrirInteresse(servico)}
                            className="w-full pw-glass-control pw-glass-gold px-4 py-2.5 text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] shadow-2xs"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Tenho interesse</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Mini Modal: Tenho Interesse */}
      {modalOpen && servicoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#181512]/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => !enviando && setModalOpen(false)}
          />

          <div className="pw-glass-modal relative z-50 w-full max-w-lg rounded-3xl bg-[#FFFDF8]/98 p-6 shadow-2xl border border-white/60 flex flex-col text-[#1E1A16] animate-scale-in">
            {/* Header Mini Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#524B40]/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center text-[#8A6828]">
                  <Sparkles className="w-4 h-4 text-[#8A6828]" />
                </div>
                <div>
                  <h3 className="font-archivo text-sm font-extrabold text-[#1E1A16]">
                    Manifestar Interesse
                  </h3>
                  <p className="text-xs text-[#5E574C] font-semibold truncate max-w-[280px] sm:max-w-sm">
                    {servicoSelecionado.label}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={enviando}
                className="pw-glass-control p-1.5 rounded-full text-[#5E574C] hover:text-[#1E1A16] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEnviarInteresse} className="pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E1A16] mb-1">
                  Mensagem opcional para nossa equipe:
                </label>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value.slice(0, 500))}
                  maxLength={500}
                  rows={4}
                  placeholder="Ex: Gostaria de saber mais sobre prazos, escopo e investimentos para a minha empresa..."
                  className="w-full p-3 rounded-2xl bg-white border border-[#524B40]/15 text-xs text-[#1E1A16] placeholder-[#8F8271] focus:border-[#C7A15F] focus:outline-none transition-all resize-none shadow-2xs"
                />
                <div className="flex justify-end text-[10px] text-[#8F8271] mt-1 font-mono">
                  {mensagem.length}/500 caracteres
                </div>
              </div>

              {erroModal && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{erroModal}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#524B40]/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={enviando}
                  className="pw-glass-control px-4 py-2 rounded-xl text-xs font-bold text-[#5E574C] hover:text-[#1E1A16] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="pw-glass-control pw-glass-gold px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {enviando ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirmar Interesse</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortalCliente;
