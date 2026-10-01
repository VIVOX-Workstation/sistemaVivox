import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Users,
  ArrowUpRight,
  UserCheck,
  CalendarDays,
  RefreshCw,
  AlertTriangle,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { resolveMediaUrl } from '../utils/mediaUrl';
import './planning-workspace.css';

type Filtro = 'all' | 'ATIVO' | 'PROSPECT' | 'PAUSADO' | 'ENCERRADO';

const STATUS_LABEL: Record<string, string> = {
  ATIVO: 'Ativo',
  PROSPECT: 'Prospect',
  PAUSADO: 'Pausado',
  ENCERRADO: 'Encerrado',
};

const STATUS_STYLE: Record<string, string> = {
  ATIVO: 'text-[#247A4A] bg-[#EEF8F2] border-[#C9E8D5]',
  PROSPECT: 'text-[#B45309] bg-[#FFF6E0] border-[#F3D9A0]',
  PAUSADO: 'text-[#5E574C] bg-white/50 border-[#D8CBB8]',
  ENCERRADO: 'text-[#B83B32] bg-[#FDF2F2] border-[#E8B4B0]',
};

const STATUS_RANK: Record<string, number> = { ATIVO: 0, PROSPECT: 1, PAUSADO: 2, ENCERRADO: 3 };

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : dateFmt.format(d);
}

function ClientListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Carregando clientes">
      <div className="pw-glass-panel h-14" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="pw-glass-card h-40" />
        ))}
      </div>
    </div>
  );
}

export function ClientList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Filtro>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  const loadClientes = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
      setLoaded(true);
    } catch (e) {
      console.error('Erro ao carregar clientes', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const stats = useMemo(
    () => ({
      total: clientes.length,
      ATIVO: clientes.filter((c) => c.status === 'ATIVO').length,
      PROSPECT: clientes.filter((c) => c.status === 'PROSPECT').length,
      PAUSADO: clientes.filter((c) => c.status === 'PAUSADO').length,
      ENCERRADO: clientes.filter((c) => c.status === 'ENCERRADO').length,
    }),
    [clientes],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clientes
      .filter((c) => {
        if (term) {
          const match =
            c.nomeFantasia.toLowerCase().includes(term) ||
            (c.razaoSocial && c.razaoSocial.toLowerCase().includes(term)) ||
            (c.segmento && c.segmento.toLowerCase().includes(term)) ||
            (c.responsavel?.nome && c.responsavel.nome.toLowerCase().includes(term));
          if (!match) return false;
        }
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const d = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
        return d !== 0 ? d : a.nomeFantasia.localeCompare(b.nomeFantasia, 'pt-BR');
      });
  }, [clientes, search, statusFilter]);

  const pills: { id: Filtro; label: string; count: number }[] = [
    { id: 'all', label: 'Todos', count: stats.total },
    { id: 'ATIVO', label: 'Ativos', count: stats.ATIVO },
    { id: 'PROSPECT', label: 'Prospects', count: stats.PROSPECT },
    { id: 'PAUSADO', label: 'Pausados', count: stats.PAUSADO },
    { id: 'ENCERRADO', label: 'Encerrados', count: stats.ENCERRADO },
  ];

  const filtrosAtivos = statusFilter !== 'all' || search.trim() !== '';
  const limparFiltros = () => {
    setSearch('');
    setStatusFilter('all');
  };

  return (
    <div className="planning-workspace w-full space-y-6">
      <div className="pw-lg-scene" aria-hidden="true" />

      {/* CABEÇALHO */}
      <div className="flex items-center justify-between gap-4 flex-wrap px-1">
        <div className="space-y-0.5 min-w-0">
          <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight flex items-center gap-2">
            Clientes
            {loaded && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#C7A15F]/20 text-[#8A6828] border border-[#C7A15F]/35">
                {stats.total}
              </span>
            )}
          </h1>
          <p className="text-xs text-[#5E574C]">Gerencie sua carteira e acesse o perfil de cada cliente.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/cliente/novo')}
          className="pw-glass-control pw-glass-primary rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Novo Cliente
        </button>
      </div>

      {loading && !loaded ? (
        <ClientListSkeleton />
      ) : error && !loaded ? (
        <div className="pw-glass-panel p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-6 h-6 text-[#B83B32]" />
          <p className="text-sm font-semibold text-[#1E1A16]">Não foi possível carregar os clientes.</p>
          <button
            type="button"
            onClick={loadClientes}
            className="pw-glass-control pw-glass-primary rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tentar de novo
          </button>
        </div>
      ) : (
        <>
          {error && (
            <p className="text-xs text-[#B83B32] px-1">Falha ao atualizar; exibindo os últimos dados carregados.</p>
          )}

          {/* Busca e filtros */}
          <div className="pw-glass-panel p-4 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative lg:w-72">
              <Search className="w-3.5 h-3.5 text-[#8F8271] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, segmento ou responsável..."
                aria-label="Buscar clientes"
                className="pw-glass-control rounded-xl w-full h-9 pl-9 pr-8 text-xs text-[#1E1A16] outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8F8271] hover:text-[#1E1A16] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {pills.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setStatusFilter(p.id)}
                  aria-pressed={statusFilter === p.id}
                  className={`pw-glass-pill px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    statusFilter === p.id ? 'pw-glass-primary' : 'text-[#1E1A16]'
                  }`}
                >
                  {p.label} ({p.count})
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-[#5E574C] lg:ml-auto">
              Exibindo <strong className="text-[#1E1A16]">{filtered.length}</strong> de {stats.total} clientes
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="pw-glass-panel p-10 flex flex-col items-center gap-2 text-center">
              <Users className="w-8 h-8 text-[#C7A15F] opacity-70" />
              <p className="text-sm font-bold text-[#1E1A16]">
                {stats.total === 0 ? 'Nenhum cliente cadastrado ainda' : 'Nenhum cliente encontrado'}
              </p>
              <p className="text-xs text-[#5E574C]">
                {stats.total === 0
                  ? 'Cadastre seu primeiro cliente para começar.'
                  : 'Tente ajustar os filtros ou pesquisar por outro nome.'}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                {filtrosAtivos && (
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="pw-glass-control rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1E1A16] cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/cliente/novo')}
                  className="pw-glass-control pw-glass-primary rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo Cliente
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filtered.map((cliente) => {
                const desde = formatDate(cliente.createdAt || cliente.dataInicioContrato);
                return (
                  <div
                    key={cliente.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/cliente/${cliente.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/cliente/${cliente.id}`);
                    }}
                    className="pw-glass-card group relative overflow-hidden p-5 flex flex-col gap-3 cursor-pointer min-w-0"
                  >
                    {/* Banner (capa) do cliente, proporção de capa do Facebook */}
                    <div className="-mx-5 -mt-5 mb-1 aspect-[820/312] max-h-40 w-[calc(100%+2.5rem)] overflow-hidden relative bg-gradient-to-r from-[#181512] via-[#2B2319] to-[#1E1A16]">
                      {cliente.bannerUrl && (
                        <img
                          src={resolveMediaUrl(cliente.bannerUrl)}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#14120E]/40 via-transparent to-transparent" />
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/60 border border-[#E5D9C8] flex items-center justify-center overflow-hidden">
                        {cliente.logoUrl ? (
                          <img
                            src={resolveMediaUrl(cliente.logoUrl)}
                            alt={cliente.nomeFantasia}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-black text-[#8A6828]">
                            {cliente.nomeFantasia.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-[#1E1A16] leading-tight truncate">
                          {cliente.nomeFantasia}
                        </h3>
                        <p className="text-xs text-[#5E574C] truncate mt-0.5">
                          {cliente.segmento || 'Segmento não informado'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          STATUS_STYLE[cliente.status] ?? STATUS_STYLE.PAUSADO
                        }`}
                      >
                        {STATUS_LABEL[cliente.status] ?? cliente.status}
                      </span>
                    </div>

                    {cliente._count && (
                      <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#5E574C]">
                        <span className="pw-glass-pill rounded-full px-2.5 py-0.5">
                          {cliente._count.servicosContratados} {cliente._count.servicosContratados === 1 ? 'serviço' : 'serviços'}
                        </span>
                        <span className="pw-glass-pill rounded-full px-2.5 py-0.5">
                          {cliente._count.ativosHospedagem} {cliente._count.ativosHospedagem === 1 ? 'hospedagem' : 'hospedagens'}
                        </span>
                      </div>
                    )}

                    <div className="pt-3 mt-auto border-t border-[#E5D9C8]/70 flex items-center justify-between gap-2 text-xs">
                      <span className="text-[#5E574C] font-semibold flex items-center gap-1 min-w-0">
                        <UserCheck className="w-3 h-3 text-[#C7A15F] shrink-0" />
                        <span className="truncate">{cliente.responsavel?.nome || 'Equipe'}</span>
                      </span>
                      {desde && (
                        <span className="text-[#8F8271] font-medium flex items-center gap-1 shrink-0">
                          <CalendarDays className="w-3 h-3" /> {desde}
                        </span>
                      )}
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#7A6440] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
