import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  ArrowRight,
  Search,
  Building2,
  User,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client';
import type { Cliente } from '../types';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';

export function AnalyticsIndex() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
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

  const filtered = clientes.filter(
    (c) =>
      c.nomeFantasia.toLowerCase().includes(search.toLowerCase()) ||
      c.segmento.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight flex items-center gap-2.5">
            <BarChart2 className="w-6 h-6 text-[#B89455]" />
            Vivox Analytics
          </h1>
          <p className="text-xs text-[#625746] mt-1">
            Selecione um cliente para acessar o dashboard de métricas, relatórios de Instagram, Google Analytics e oportunidades.
          </p>
        </div>

        <div className="w-full md:w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#847663]" />
            <Input
              placeholder="Buscar por cliente ou segmento..."
              className="pl-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* LISTAGEM DE CLIENTES */}
      {loading ? (
        <div className="py-16 text-center text-[#625746]">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#B89455] border-r-transparent mr-2 align-middle"></div>
          Carregando clientes...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cliente) => {
            const temOpenPanel = Boolean(cliente.openpanelProjectId);

            return (
              <div
                key={cliente.id}
                onClick={() => navigate(`/analytics/${cliente.id}`)}
                className="bg-[#FFFDF8] p-5 rounded-[11px] border border-[#D8CBB8] shadow-xs hover:shadow-sm hover:border-[#B89455] cursor-pointer transition-all group flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-12 h-12 bg-[#FAF2E4] border border-[#E8D4B4] rounded-[11px] flex items-center justify-center text-[#8A6828] font-bold text-lg shrink-0">
                      {cliente.nomeFantasia.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {temOpenPanel && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4]">
                          OpenPanel
                        </span>
                      )}
                      <Badge
                        variant={
                          cliente.status?.toUpperCase() === 'ATIVO'
                            ? 'success'
                            : cliente.status?.toUpperCase() === 'PROSPECT'
                            ? 'warning'
                            : 'default'
                        }
                        className="text-[10px]"
                      >
                        {cliente.status}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="font-bold text-[#1E1A16] group-hover:text-[#8A6828] transition-colors text-base tracking-tight">
                    {cliente.nomeFantasia}
                  </h3>
                  <p className="text-xs text-[#625746] mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#847663]" />
                    {cliente.segmento}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EEE7DC] flex items-center justify-between">
                  <span className="text-[11px] text-[#847663] flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {cliente.responsavel?.nome || 'Equipe Vivox'}
                  </span>
                  <div className="flex items-center text-xs font-bold text-[#8A6828] group-hover:translate-x-1 transition-transform">
                    Acessar Métricas
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-[#847663] bg-[#FFFDF8] rounded-[11px] border border-dashed border-[#D8CBB8] space-y-2">
              <BarChart2 className="w-8 h-8 text-[#847663] mx-auto opacity-60" />
              <p className="text-sm font-bold text-[#1E1A16]">Nenhum cliente encontrado</p>
              <p className="text-xs text-[#625746]">Tente buscar por outro nome ou segmento.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
