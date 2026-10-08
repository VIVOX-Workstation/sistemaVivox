import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  ClipboardList, 
  Calendar as CalendarIcon,
  ChevronDown
} from 'lucide-react';
import { 
  acompanhamentoApi, 
  type AcompanhamentoResponse, 
  type MesComDados, 
  type Publicacao,
  type AcompanhamentoCliente 
} from '../api/acompanhamento';
import { ResumoAcompanhamentoCards } from '../components/acompanhamento/ResumoAcompanhamentoCards';
import { SeletorMes } from '../components/acompanhamento/SeletorMes';
import { TabelaAcompanhamento } from '../components/acompanhamento/TabelaAcompanhamento';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { useLiquidGlass } from '../hooks/useLiquidGlass';
import './planning-workspace.css';

export function Acompanhamento() {
  const { clienteId: urlClienteId } = useParams<{ clienteId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hoje = new Date();
  const initialAno = searchParams.get('ano') ? parseInt(searchParams.get('ano')!, 10) : hoje.getFullYear();
  const initialMes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!, 10) : hoje.getMonth() + 1;

  const [ano, setAno] = useState<number>(initialAno);
  const [mes, setMes] = useState<number>(initialMes);

  // Lista de clientes para o seletor
  const [clientes, setClientes] = useState<AcompanhamentoCliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(urlClienteId || null);

  // Busca no dropdown de clientes
  const [buscaCliente, setBuscaCliente] = useState('');
  const [dropdownClienteAberto, setDropdownClienteAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dados do acompanhamento
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dados, setDados] = useState<AcompanhamentoResponse | null>(null);
  const [mesesComDados, setMesesComDados] = useState<MesComDados[]>([]);

  // Status de salvamento por linha da tabela
  const [rowStatus, setRowStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});

  const workspaceRef = useRef<HTMLDivElement>(null);
  useLiquidGlass(workspaceRef, !loading);

  // Carrega lista inicial de clientes
  useEffect(() => {
    const fetchClientes = async () => {
      setLoadingClientes(true);
      try {
        const res = await acompanhamentoApi.getClientes();
        setClientes(res || []);
        // Se não houver cliente na URL, mas houver clientes, seleciona o primeiro opcionalmente ou aguarda seleção
        if (!urlClienteId && res.length > 0 && !clienteSelecionadoId) {
          setClienteSelecionadoId(res[0].id);
          navigate(`/acompanhamento/${res[0].id}?ano=${ano}&mes=${mes}`, { replace: true });
        }
      } catch (err) {
        console.error('Erro ao carregar lista de clientes:', err);
      } finally {
        setLoadingClientes(false);
      }
    };
    fetchClientes();
  }, []);

  // Fecha dropdown de clientes ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownClienteAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincroniza se o cliente na URL mudar
  useEffect(() => {
    if (urlClienteId && urlClienteId !== clienteSelecionadoId) {
      setClienteSelecionadoId(urlClienteId);
    }
  }, [urlClienteId]);

  // Carrega dados quando cliente, ano ou mês mudam
  const carregarDados = async (cId: string, a: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const [resAcomp, resMeses] = await Promise.all([
        acompanhamentoApi.getAcompanhamento(cId, a, m),
        acompanhamentoApi.getMesesComDados(cId),
      ]);
      setDados(resAcomp);
      setMesesComDados(resMeses || []);
    } catch (err: any) {
      console.error('Erro ao carregar acompanhamento:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados de acompanhamento do cliente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clienteSelecionadoId) {
      carregarDados(clienteSelecionadoId, ano, mes);
    }
  }, [clienteSelecionadoId, ano, mes]);

  const handleMudarCliente = (novoId: string) => {
    setClienteSelecionadoId(novoId);
    setDropdownClienteAberto(false);
    setBuscaCliente('');
    navigate(`/acompanhamento/${novoId}?ano=${ano}&mes=${mes}`);
  };

  const handleMudarMes = (novoAno: number, novoMes: number) => {
    setAno(novoAno);
    setMes(novoMes);
    if (clienteSelecionadoId) {
      navigate(`/acompanhamento/${clienteSelecionadoId}?ano=${novoAno}&mes=${novoMes}`, { replace: true });
    }
  };

  const handleUpdatePublicacao = async (id: string, campo: keyof Publicacao, valor: any) => {
    // Atualização otimista local
    setDados((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        publicacoes: prev.publicacoes.map((p) =>
          p.id === id ? { ...p, [campo]: valor } : p
        ),
      };
    });

    setRowStatus((prev) => ({ ...prev, [id]: 'saving' }));

    try {
      const atualizado = await acompanhamentoApi.atualizarPublicacao(id, { [campo]: valor });
      setDados((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          publicacoes: prev.publicacoes.map((p) =>
            p.id === id ? { ...p, ...atualizado } : p
          ),
        };
      });
      setRowStatus((prev) => ({ ...prev, [id]: 'saved' }));
      setTimeout(() => {
        setRowStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 2000);

      // Recarrega o resumo para atualizar totais
      if (clienteSelecionadoId) {
        acompanhamentoApi.getAcompanhamento(clienteSelecionadoId, ano, mes).then((res) => {
          setDados((prev) => prev ? { ...prev, resumo: res.resumo } : res);
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar publicação:', err);
      setRowStatus((prev) => ({ ...prev, [id]: 'error' }));
    }
  };

  const handleDeletePublicacao = async (id: string) => {
    try {
      await acompanhamentoApi.excluirPublicacao(id);
      setDados((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          publicacoes: prev.publicacoes.filter((p) => p.id !== id),
        };
      });
      if (clienteSelecionadoId) {
        carregarDados(clienteSelecionadoId, ano, mes);
      }
    } catch (err: any) {
      console.error('Erro ao excluir publicação:', err);
      alert(err.response?.data?.message || 'Erro ao excluir publicação.');
    }
  };

  const handleCriarPublicacao = async () => {
    if (!clienteSelecionadoId) return;

    // Data padrão: hoje se for o mês atual, senão dia 1
    const agora = new Date();
    let dataPadrao: Date;
    if (ano === agora.getFullYear() && mes === agora.getMonth() + 1) {
      dataPadrao = agora;
    } else {
      dataPadrao = new Date(ano, mes - 1, 1, 12, 0, 0);
    }

    try {
      const nova = await acompanhamentoApi.criarPublicacao(clienteSelecionadoId, {
        dataPublicacao: dataPadrao.toISOString(),
        tipo: 'POST',
        assunto: '',
      });

      setDados((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          publicacoes: [...prev.publicacoes, nova].sort(
            (a, b) => new Date(a.dataPublicacao).getTime() - new Date(b.dataPublicacao).getTime()
          ),
        };
      });

      // Atualiza os meses com dados caso seja o primeiro item
      acompanhamentoApi.getMesesComDados(clienteSelecionadoId).then(setMesesComDados);
      acompanhamentoApi.getAcompanhamento(clienteSelecionadoId, ano, mes).then((res) => {
        setDados((prev) => prev ? { ...prev, resumo: res.resumo } : res);
      });
    } catch (err: any) {
      console.error('Erro ao criar publicação:', err);
      alert(err.response?.data?.message || 'Não foi possível adicionar nova publicação.');
    }
  };

  const clienteAtual = clientes.find((c) => c.id === clienteSelecionadoId) || dados?.cliente;
  const clientesFiltrados = clientes.filter((c) =>
    c.nomeFantasia.toLowerCase().includes(buscaCliente.toLowerCase())
  );

  return (
    <div ref={workspaceRef} className="planning-workspace min-h-screen w-full select-none flex flex-col text-[#1E1A16]">
      <div className="pw-lg-scene" aria-hidden="true" />

      {/* CABEÇALHO */}
      <div className="relative z-10 space-y-6">
        <div className="pw-glass-panel p-5 sm:p-6 rounded-3xl border border-white/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="pw-section-label flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Acompanhamento Mensal</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1A16] font-archivo">
              Planilha de Publicações
            </h1>
            <p className="text-xs text-[#5E574C]">
              Registro e conferência mensal de postagens, formatos e métricas da conta.
            </p>
          </div>

          {/* Seletor de Cliente em Dropdown com Busca */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownClienteAberto(!dropdownClienteAberto)}
              className="pw-glass-control px-4 py-2.5 rounded-2xl flex items-center gap-3 cursor-pointer shadow-xs min-w-[240px] justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center shrink-0 overflow-hidden">
                  {clienteAtual?.logoUrl ? (
                    <img
                      src={resolveMediaUrl(clienteAtual.logoUrl)}
                      alt={clienteAtual.nomeFantasia}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-4 h-4 text-[#8A6828]" />
                  )}
                </div>
                <div className="truncate text-left">
                  <span className="text-[10px] font-bold text-[#8F8271] uppercase tracking-wider block">
                    Cliente selecionado
                  </span>
                  <span className="font-extrabold text-xs text-[#1E1A16] truncate block">
                    {clienteAtual?.nomeFantasia || 'Selecione um cliente'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-[#8F8271] shrink-0" />
            </button>

            {/* Menu Suspenso de Clientes */}
            {dropdownClienteAberto && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#FFFDF8] border border-white/80 shadow-2xl p-2 z-50 animate-scale-in">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-[#8F8271] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/80 border border-[#524B40]/15 focus:outline-none focus:border-[#C7A15F]"
                    autoFocus
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {clientesFiltrados.length === 0 ? (
                    <p className="text-xs text-[#8F8271] text-center py-3">Nenhum cliente encontrado.</p>
                  ) : (
                    clientesFiltrados.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleMudarCliente(c.id)}
                        className={`w-full p-2 rounded-xl flex items-center gap-2.5 text-left text-xs font-bold transition-colors cursor-pointer ${
                          c.id === clienteSelecionadoId
                            ? 'bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4]'
                            : 'hover:bg-white text-[#1E1A16]'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {c.logoUrl ? (
                            <img src={resolveMediaUrl(c.logoUrl)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-[#8A6828]">
                              {c.nomeFantasia.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="truncate">{c.nomeFantasia}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO DE MÊS E ATALHOS */}
        <SeletorMes
          ano={ano}
          mes={mes}
          onChangeMes={handleMudarMes}
          mesesComDados={mesesComDados}
        />

        {/* CONTEÚDO PRINCIPAL */}
        {loading ? (
          // Skeleton Loading
          <div className="space-y-4 animate-pulse" aria-busy="true">
            <div className="h-20 rounded-2xl bg-white/40" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-white/40" />
              ))}
            </div>
            <div className="h-64 rounded-3xl bg-white/40" />
          </div>
        ) : error ? (
          // Estado de Erro
          <div className="pw-glass-panel p-8 rounded-3xl border border-red-200 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1E1A16]">Erro ao carregar publicações</h2>
              <p className="text-xs text-[#5E574C] mt-1">{error}</p>
            </div>
            {clienteSelecionadoId && (
              <button
                type="button"
                onClick={() => carregarDados(clienteSelecionadoId, ano, mes)}
                className="pw-glass-control pw-glass-gold px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            )}
          </div>
        ) : !clienteSelecionadoId ? (
          // Estado sem cliente selecionado
          <div className="pw-glass-panel p-12 rounded-3xl border border-white/60 text-center max-w-md mx-auto space-y-3">
            <Building2 className="w-10 h-10 text-[#C7A15F] mx-auto opacity-70" />
            <h2 className="text-base font-bold text-[#1E1A16]">Selecione um cliente</h2>
            <p className="text-xs text-[#5E574C]">
              Escolha um cliente no seletor acima para visualizar e editar sua planilha de acompanhamento.
            </p>
          </div>
        ) : dados ? (
          <div className="space-y-6">
            {/* 1. Resumo em frase + Cards de métricas */}
            <ResumoAcompanhamentoCards
              resumo={dados.resumo}
              ano={ano}
              mes={mes}
            />

            {/* 2. Barra de Ações da Tabela */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-archivo text-xs font-bold uppercase tracking-wider text-[#7A6440]">
                  Publicações do Mês ({dados.publicacoes.length})
                </span>
              </div>
              <button
                type="button"
                onClick={handleCriarPublicacao}
                className="pw-glass-control pw-glass-gold px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
              >
                <Plus className="w-4 h-4" />
                <span>Nova publicação</span>
              </button>
            </div>

            {/* 3. Tabela Estilo Planilha com Edição Inline */}
            <TabelaAcompanhamento
              publicacoes={dados.publicacoes}
              readOnly={false}
              onUpdatePublicacao={handleUpdatePublicacao}
              onDeletePublicacao={handleDeletePublicacao}
              rowStatus={rowStatus}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Acompanhamento;
