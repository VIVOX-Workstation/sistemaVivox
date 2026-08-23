import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Building2, 
  ArrowUpRight, 
  Globe, 
  UserCheck
} from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';

export function ClientList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ATIVO' | 'PROSPECT' | 'PAUSADO' | 'ENCERRADO'>('all');
  const [openSearch, setOpenSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error("Erro ao carregar clientes", error);
    } finally {
      setLoading(false);
    }
  };

  // Métricas Consolidadas
  const totalClientes = clientes.length;
  const ativos = clientes.filter((c) => c.status === 'ATIVO').length;
  const prospects = clientes.filter((c) => c.status === 'PROSPECT').length;
  const pausados = clientes.filter((c) => c.status === 'PAUSADO').length;

  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      if (search.trim()) {
        const term = search.toLowerCase();
        const match =
          c.nomeFantasia.toLowerCase().includes(term) ||
          (c.razaoSocial && c.razaoSocial.toLowerCase().includes(term)) ||
          (c.segmento && c.segmento.toLowerCase().includes(term)) ||
          (c.responsavel?.nome && c.responsavel.nome.toLowerCase().includes(term));
        if (!match) return false;
      }
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  }, [clientes, search, statusFilter]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-transparent p-6 md:p-10 flex flex-col select-none">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
        {/* ========================================================================= */}
        {/* TOPO: LOGO CLIENTES + BOTÃO PILL + GRANDES NÚMEROS DE MÉTRICAS           */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-6 flex-wrap pb-4">
          {/* Título Estilo Editorial */}
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight uppercase">
              CLIENTES
            </h1>

            {/* Botão Pill Dark '+ Novo Cliente' */}
            <button
              onClick={() => navigate('/cliente/novo')}
              className="px-5 py-2 rounded-full bg-[#181512] hover:bg-[#2A241E] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95 border border-[#C7A15F]/20"
            >
              <span className="w-4 h-4 rounded-full bg-[#C7A15F]/30 text-[#C7A15F] flex items-center justify-center text-xs font-black">
                +
              </span>
              <span>Novo Cliente</span>
            </button>
          </div>

          {/* Grandes Números de Estatísticas com Micro-Badges */}
          <div className="flex items-center gap-8 md:gap-12 flex-wrap">
            {/* Stat 1: Total Cadastrados */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight">
                {totalClientes}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8F8271]">Cadastrados</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#C7A15F]/20 text-[#8A6828] border border-[#C7A15F]/40">
                  ↑{ativos}
                </span>
              </div>
            </div>

            {/* Stat 2: Clientes Ativos */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight">
                {ativos}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8F8271]">Ativos</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#247A4A]/20 text-[#247A4A] border border-[#247A4A]/30">
                  ● ON
                </span>
              </div>
            </div>

            {/* Stat 3: Prospects */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-black text-[#1E1A16] tracking-tight">
                {prospects}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8F8271]">Prospects</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FFA800]/20 text-[#B45309] border border-[#FFA800]/40">
                  ⚡ Pipeline
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
                    placeholder="Buscar cliente, segmento, responsável..."
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
                  title="Pesquisar clientes"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Pílula: Todos */}
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#181512] text-white shadow-sm border border-[#181512]'
                  : 'bg-[#FFFDF8] text-[#625746] hover:bg-white hover:text-[#1E1A16] border border-[#D8CBB8]'
              }`}
            >
              Todos ({totalClientes})
            </button>

            {/* Pílula: Ativos */}
            <button
              onClick={() => setStatusFilter('ATIVO')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ATIVO'
                  ? 'bg-[#181512] text-white shadow-sm border border-[#181512]'
                  : 'bg-[#FFFDF8] text-[#625746] hover:bg-white hover:text-[#1E1A16] border border-[#D8CBB8]'
              }`}
            >
              🟢 Ativos ({ativos})
            </button>

            {/* Pílula: Prospects */}
            <button
              onClick={() => setStatusFilter('PROSPECT')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'PROSPECT'
                  ? 'bg-[#181512] text-white shadow-sm border border-[#181512]'
                  : 'bg-[#FFFDF8] text-[#625746] hover:bg-white hover:text-[#1E1A16] border border-[#D8CBB8]'
              }`}
            >
              ⚡ Prospects ({prospects})
            </button>

            {/* Pílula: Pausados */}
            <button
              onClick={() => setStatusFilter('PAUSADO')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'PAUSADO'
                  ? 'bg-[#181512] text-white shadow-sm border border-[#181512]'
                  : 'bg-[#FFFDF8] text-[#625746] hover:bg-white hover:text-[#1E1A16] border border-[#D8CBB8]'
              }`}
            >
              ⏸️ Pausados ({pausados})
            </button>
          </div>

          <span className="text-xs font-semibold text-[#8F8271]">
            Exibindo <strong className="text-[#1E1A16]">{filteredClientes.length}</strong> de {totalClientes} clientes
          </span>
        </div>

        {/* ========================================================================= */}
        {/* GRID DE CARDS NEO-ORGANIC DOS CLIENTES                                    */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          {/* Cards dos Clientes no Formato Neo-Organic com Banner Ampliado */}
          {filteredClientes.map((cliente) => (
            <Link
              key={cliente.id}
              to={`/cliente/${cliente.id}`}
              className="group bg-[#FFFDF8] rounded-[28px] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden relative"
            >
              {/* Banner de Capa com Status & Seta ↗ no Topo */}
              <div className="w-full h-32 md:h-36 relative overflow-hidden">
                {cliente.bannerUrl ? (
                  <img
                    src={cliente.bannerUrl}
                    alt={`Banner de ${cliente.nomeFantasia}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#181512] via-[#2B2319] to-[#1E1A16] relative">
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#C7A15F_1px,transparent_1px)] [background-size:12px_12px]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                {/* Status Pill & Seta ↗ Fixos e Seguros no Canto Superior Direito do Banner */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md border shadow-xs ${
                      cliente.status === 'ATIVO'
                        ? 'bg-[#247A4A]/85 text-white border-[#247A4A]'
                        : cliente.status === 'PROSPECT'
                        ? 'bg-[#FFA800]/85 text-white border-[#FFA800]'
                        : cliente.status === 'PAUSADO'
                        ? 'bg-black/60 text-[#D8CBB8] border-white/20'
                        : 'bg-[#B83B32]/85 text-white border-[#B83B32]'
                    }`}
                  >
                    {cliente.status}
                  </span>

                  <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-[#181512] group-hover:text-[#C7A15F] text-white flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-xs border border-white/20">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Conteúdo do Card com Espaço Confortável */}
              <div className="relative z-10 p-5 pt-0 pb-6 flex-1 flex flex-col justify-between">
                {/* Linha Topo: Avatar Sobreposto */}
                <div className="-mt-9 mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#FAF2E4] border-4 border-[#FFFDF8] flex items-center justify-center overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0 relative z-20">
                    {cliente.logoUrl ? (
                      <img
                        src={cliente.logoUrl}
                        alt={cliente.nomeFantasia}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-black text-[#8A6828]">
                        {cliente.nomeFantasia.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Informações Centrais */}
                <div className="mt-1">
                  <h3 className="text-lg font-black text-[#1E1A16] group-hover:text-[#8A6828] transition-colors leading-tight line-clamp-1">
                    {cliente.nomeFantasia}
                  </h3>
                  <p className="text-xs text-[#8F8271] font-medium line-clamp-1 mt-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#C7A15F]" />
                    {cliente.segmento || 'Segmento não informado'}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {filteredClientes.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center text-[#8F8271] bg-[#FFFDF8] rounded-[28px] border border-[#D8CBB8] border-dashed">
              <Building2 className="w-8 h-8 text-[#C7A15F] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-[#1E1A16]">Nenhum cliente encontrado</p>
              <p className="text-xs text-[#8F8271] mt-1">Tente ajustar o termo de pesquisa ou os filtros acima.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
