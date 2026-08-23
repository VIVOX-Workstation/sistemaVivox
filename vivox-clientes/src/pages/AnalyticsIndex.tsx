import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Search,
  Building2,
  ArrowUpRight,
  UserCheck,
  TrendingUp,
  Activity,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';

export function AnalyticsIndex() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'openpanel' | 'ativos'>('all');
  const [openSearch, setOpenSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clientes');
      setClientes(res.data);
    } catch (e) {
      console.error('Erro ao carregar clientes:', e);
    } finally {
      setLoading(false);
    }
  };

  // Métricas Consolidadas
  const totalClientes = clientes.length;
  const comOpenPanel = clientes.filter((c) => Boolean(c.openpanelProjectId)).length;
  const ativos = clientes.filter((c) => c.status === 'ATIVO').length;

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      if (search.trim()) {
        const term = search.toLowerCase();
        const match =
          c.nomeFantasia.toLowerCase().includes(term) ||
          (c.segmento && c.segmento.toLowerCase().includes(term)) ||
          (c.responsavel?.nome && c.responsavel.nome.toLowerCase().includes(term));
        if (!match) return false;
      }

      if (filterType === 'openpanel' && !c.openpanelProjectId) return false;
      if (filterType === 'ativos' && c.status !== 'ATIVO') return false;

      return true;
    });
  }, [clientes, search, filterType]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-transparent p-6 md:p-10 flex flex-col select-none">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
        {/* ========================================================================= */}
        {/* TOPO: LOGO ANALYTICS + BOTÃO PILL + GRANDES NÚMEROS DE MÉTRICAS          */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-6 flex-wrap pb-4">
          {/* Título Estilo Editorial */}
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight uppercase">
              ANALYTICS
            </h1>

            {/* Botão Pill Dark 'Métricas em Tempo Real' */}
            <div className="px-5 py-2 rounded-full bg-[#181512] text-white text-xs font-bold flex items-center gap-2 shadow-sm border border-[#C7A15F]/20">
              <span className="w-2 h-2 rounded-full bg-[#24C16E] animate-pulse" />
              <span>Realtime & IA</span>
            </div>
          </div>

          {/* Grandes Números de Estatísticas com Micro-Badges */}
          <div className="flex items-center gap-8 md:gap-12 flex-wrap">
            {/* Stat 1: Contas Monitoradas */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight">
                {totalClientes}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8F8271]">Monitorados</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#C7A15F]/20 text-[#8A6828] border border-[#C7A15F]/40">
                  ↑{comOpenPanel}
                </span>
              </div>
            </div>

            {/* Stat 2: OpenPanel Conectado */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight">
                {comOpenPanel}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8F8271]">OpenPanel</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#247A4A]/20 text-[#247A4A] border border-[#247A4A]/30">
                  ● Ativo
                </span>
              </div>
            </div>

            {/* Stat 3: Clientes Ativos */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight">
                {ativos}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8F8271]">Ativos</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FFA800]/20 text-[#B45309] border border-[#FFA800]/40">
                  ⚡ 100%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BARRA DE BUSCA & FILTROS EM PÍLULAS                                       */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-[#D8CBB8]/60">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Botão / Input de Busca */}
            <div className="relative">
              {openSearch ? (
                <div className="flex items-center bg-[#FFFDF8] border border-[#D8CBB8] rounded-full px-3 py-1.5 shadow-2xs w-64 transition-all">
                  <Search className="w-3.5 h-3.5 text-[#8F8271] mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar conta por nome ou segmento..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent text-xs text-[#1E1A16] placeholder-[#8F8271] outline-none"
                  />
                  <button
                    onClick={() => {
                      setSearch('');
                      setOpenSearch(false);
                    }}
                    className="text-[10px] text-[#8F8271] hover:text-[#1E1A16] font-bold ml-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setOpenSearch(true)}
                  className="w-8 h-8 rounded-full bg-[#FFFDF8] border border-[#D8CBB8] hover:border-[#1E1A16] flex items-center justify-center text-[#1E1A16] shadow-2xs hover:scale-105 transition-all cursor-pointer"
                  title="Pesquisar contas de métricas"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Pílula: Todos */}
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#181512] text-white shadow-sm border border-[#181512]'
                  : 'bg-[#FFFDF8] text-[#625746] hover:bg-white hover:text-[#1E1A16] border border-[#D8CBB8]'
              }`}
            >
              Todos ({totalClientes})
            </button>

            {/* Pílula: Com OpenPanel */}
            <button
              onClick={() => setFilterType('openpanel')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterType === 'openpanel'
                  ? 'bg-[#181512] text-white shadow-sm border border-[#181512]'
                  : 'bg-[#FFFDF8] text-[#625746] hover:bg-white hover:text-[#1E1A16] border border-[#D8CBB8]'
              }`}
            >
              ⚡ Com OpenPanel ({comOpenPanel})
            </button>

            {/* Pílula: Clientes Ativos */}
            <button
              onClick={() => setFilterType('ativos')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterType === 'ativos'
                  ? 'bg-[#181512] text-white shadow-sm border border-[#181512]'
                  : 'bg-[#FFFDF8] text-[#625746] hover:bg-white hover:text-[#1E1A16] border border-[#D8CBB8]'
              }`}
            >
              🟢 Clientes Ativos ({ativos})
            </button>
          </div>

          <span className="text-xs font-semibold text-[#8F8271]">
            Exibindo <strong className="text-[#1E1A16]">{filtered.length}</strong> de {totalClientes} contas
          </span>
        </div>

        {/* ========================================================================= */}
        {/* GRID DE CARDS NEO-ORGANIC DO ANALYTICS                                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          {filtered.map((cliente) => {
            const temOpenPanel = Boolean(cliente.openpanelProjectId);

            return (
              <div
                key={cliente.id}
                onClick={() => navigate(`/analytics/${cliente.id}`)}
                className="group bg-[#FFFDF8] border border-[#D8CBB8] hover:border-[#1E1A16] rounded-[28px] p-5 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] relative"
              >
                {/* Linha Topo: Avatar/Logo + Tags + Botão Seta ↗ */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E5D9C8] flex items-center justify-center overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                    {cliente.logoUrl ? (
                      <img
                        src={cliente.logoUrl}
                        alt={cliente.nomeFantasia}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BarChart2 className="w-6 h-6 text-[#C7A15F]" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {temOpenPanel ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#C7A15F]/20 text-[#8A6828] border border-[#C7A15F]/35">
                        OpenPanel
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8F8271]/15 text-[#625746] border border-[#8F8271]/30">
                        Padrão
                      </span>
                    )}

                    {/* Botão Seta Circular ↗ */}
                    <div className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#D8CBB8] group-hover:bg-[#181512] group-hover:text-white text-[#1E1A16] flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-2xs">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Informações Centrais */}
                <div className="my-2">
                  <h3 className="text-lg font-black text-[#1E1A16] group-hover:text-[#8A6828] transition-colors leading-tight line-clamp-1">
                    {cliente.nomeFantasia}
                  </h3>
                  <p className="text-xs text-[#8F8271] font-medium line-clamp-1 mt-0.5">
                    {cliente.segmento || 'Segmento não informado'}
                  </p>
                </div>

                {/* Rodapé: Responsável & Status */}
                <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#8F8271] text-[11px] font-semibold flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-[#C7A15F] shrink-0" />
                    <span className="truncate max-w-[120px]">{cliente.responsavel?.nome || 'Equipe'}</span>
                  </span>

                  <span className="text-[11px] font-bold text-[#8A6828] group-hover:underline flex items-center gap-1">
                    <span>Acessar</span>
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center text-[#8F8271] bg-[#FFFDF8] rounded-[28px] border border-[#D8CBB8] border-dashed">
              <BarChart2 className="w-8 h-8 text-[#C7A15F] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-[#1E1A16]">Nenhuma conta encontrada</p>
              <p className="text-xs text-[#8F8271] mt-1">Tente ajustar os filtros ou pesquisar por outro nome.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
