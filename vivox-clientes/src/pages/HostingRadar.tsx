import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RadarHospedagemResult, AtivoHospedagem } from '../types';
import { api } from '../api/client';
import {
  Globe,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  ExternalLink,
  Building2,
  RefreshCw,
  Layout,
} from 'lucide-react';
import { Input } from '../components/Input';
import { Select } from '../components/Select';

export function HostingRadar() {
  const [radar, setRadar] = useState<RadarHospedagemResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUrgencia, setFilterUrgencia] = useState<string>('TODOS');
  const navigate = useNavigate();

  useEffect(() => {
    loadRadar();
  }, []);

  const loadRadar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hospedagens/radar');
      setRadar(res.data);
    } catch (err) {
      console.error('Erro ao carregar radar de renovações:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!radar?.proximasRenovacoes) return [];
    return radar.proximasRenovacoes.filter((item) => {
      const matchSearch =
        item.titulo.toLowerCase().includes(search.toLowerCase()) ||
        item.url.toLowerCase().includes(search.toLowerCase()) ||
        (item.dominio && item.dominio.toLowerCase().includes(search.toLowerCase())) ||
        (item.cliente?.nomeFantasia && item.cliente.nomeFantasia.toLowerCase().includes(search.toLowerCase()));

      const matchUrgencia =
        filterUrgencia === 'TODOS' ? true : item.nivelUrgencia === filterUrgencia;

      return matchSearch && matchUrgencia;
    });
  }, [radar?.proximasRenovacoes, search, filterUrgencia]);

  const formatarDataBR = (dataStr?: string) => {
    if (!dataStr) return '-';
    const d = new Date(dataStr);
    return d.toLocaleDateString('pt-BR');
  };

  const renderBadgeUrgencia = (ativo: AtivoHospedagem) => {
    const menorDias = ativo.menorDias;
    const nivelUrgencia = ativo.nivelUrgencia;

    if (nivelUrgencia === 'CRITICO' && typeof menorDias === 'number') {
      return (
        <span className="text-[10px] text-[#B83B32] bg-[#FDF2F2] border border-[#FCDAD7] px-2.5 py-0.5 rounded font-bold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {menorDias < 0 ? `Vencido há ${Math.abs(menorDias)}d` : `Vence em ${menorDias}d`}
        </span>
      );
    }

    if (nivelUrgencia === 'ATENCAO' && typeof menorDias === 'number') {
      return (
        <span className="text-[10px] text-[#8A6828] bg-[#FAF2E4] border border-[#E8D4B4] px-2.5 py-0.5 rounded font-bold flex items-center gap-1">
          <Clock className="w-3 h-3" /> Vence em {menorDias}d
        </span>
      );
    }

    if (nivelUrgencia === 'EM_DIA' && typeof menorDias === 'number') {
      return (
        <span className="text-[10px] text-[#247A4A] bg-[#E6F4EA] border border-[#CEEAD6] px-2.5 py-0.5 rounded font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Em dia ({menorDias}d)
        </span>
      );
    }

    return <span className="text-[10px] text-[#847663] bg-[#EEE7DC] px-2 py-0.5 rounded font-medium">Sem data</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-[#B89455]" />
            Radar de Landing Pages & Renovações
          </h1>
          <p className="text-xs text-[#625746] mt-0.5">
            Acompanhe as datas de expiração e renovação dos domínios das Landing Pages dos clientes.
          </p>
        </div>

        <button
          onClick={loadRadar}
          className="h-8 px-3 rounded-lg border border-[#D8CBB8] bg-[#FFFDF8] hover:bg-[#EEE7DC] text-[#1E1A16] text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#B89455] ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* CARDS DE KPIS CONSOLIDADOS */}
      {radar && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#847663]">Total de Landing Pages</span>
            <h3 className="text-2xl font-bold text-[#1E1A16] mt-1">{radar.totalAtivos}</h3>
          </div>

          <div
            onClick={() => setFilterUrgencia('CRITICO')}
            className={`p-4 rounded-[11px] border shadow-2xs cursor-pointer transition-all ${
              filterUrgencia === 'CRITICO'
                ? 'bg-[#FDF2F2] border-[#B83B32] ring-1 ring-[#B83B32]'
                : 'bg-[#FFFDF8] border-[#D8CBB8] hover:border-[#B83B32]'
            }`}
          >
            <div className="flex items-center justify-between text-[#B83B32]">
              <span className="text-[11px] font-semibold">Críticos (&le; 7 dias)</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-2xl font-bold text-[#B83B32] mt-1">{radar.criticos7Dias}</h3>
          </div>

          <div
            onClick={() => setFilterUrgencia('ATENCAO')}
            className={`p-4 rounded-[11px] border shadow-2xs cursor-pointer transition-all ${
              filterUrgencia === 'ATENCAO'
                ? 'bg-[#FAF2E4] border-[#8A6828] ring-1 ring-[#8A6828]'
                : 'bg-[#FFFDF8] border-[#D8CBB8] hover:border-[#8A6828]'
            }`}
          >
            <div className="flex items-center justify-between text-[#8A6828]">
              <span className="text-[11px] font-semibold">Atenção (&le; 30 dias)</span>
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-2xl font-bold text-[#8A6828] mt-1">{radar.atencao30Dias}</h3>
          </div>

          <div
            onClick={() => setFilterUrgencia('EM_DIA')}
            className={`p-4 rounded-[11px] border shadow-2xs cursor-pointer transition-all ${
              filterUrgencia === 'EM_DIA'
                ? 'bg-[#E6F4EA] border-[#247A4A] ring-1 ring-[#247A4A]'
                : 'bg-[#FFFDF8] border-[#D8CBB8] hover:border-[#247A4A]'
            }`}
          >
            <div className="flex items-center justify-between text-[#247A4A]">
              <span className="text-[11px] font-semibold">Em Dia (&gt; 30 dias)</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-2xl font-bold text-[#247A4A] mt-1">{radar.emDia}</h3>
          </div>
        </div>
      )}

      {/* FILTROS E BUSCA */}
      <div className="bg-[#FFFDF8] p-4 rounded-[11px] border border-[#D8CBB8] shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#847663]" />
          <Input
            placeholder="Buscar por cliente, título da LP, URL ou domínio..."
            className="pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={filterUrgencia}
            onChange={(e) => setFilterUrgencia(e.target.value)}
          >
            <option value="TODOS">Todos os Vencimentos</option>
            <option value="CRITICO">🔴 Críticos (&le; 7 dias)</option>
            <option value="ATENCAO">🟡 Atenção (&le; 30 dias)</option>
            <option value="EM_DIA">🟢 Em Dia (&gt; 30 dias)</option>
          </Select>
        </div>
      </div>

      {/* TABELA CONSOLIDADA DE LANDING PAGES */}
      <div className="bg-[#FFFDF8] rounded-[11px] border border-[#D8CBB8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF7F2] text-[#625746] border-b border-[#D8CBB8]">
              <tr>
                <th className="py-3 px-4 font-bold">Cliente</th>
                <th className="py-3 px-3 font-bold">Landing Page</th>
                <th className="py-3 px-3 font-bold">URL Direta</th>
                <th className="py-3 px-3 font-bold">Domínio Principal</th>
                <th className="py-3 px-3 font-bold">Data de Renovação</th>
                <th className="py-3 px-3 font-bold">Previsão / Urgência</th>
                <th className="py-3 px-4 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE7DC]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#625746]">
                    Carregando radar de renovações...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#847663] italic">
                    Nenhuma Landing Page encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredItems.map((ativo) => (
                  <tr key={ativo.id} className="hover:bg-[#FAF7F2] transition-colors">
                    {/* Cliente */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => navigate(`/cliente/${ativo.clienteId}`)}
                        className="font-bold text-[#1E1A16] hover:text-[#8A6828] flex items-center gap-1.5 transition-colors text-left"
                      >
                        <Building2 className="w-3.5 h-3.5 text-[#8A6828]" />
                        {ativo.cliente?.nomeFantasia || 'Cliente'}
                      </button>
                    </td>

                    {/* Título da LP */}
                    <td className="py-3 px-3 font-semibold text-[#1E1A16]">
                      {ativo.titulo}
                    </td>

                    {/* URL */}
                    <td className="py-3 px-3">
                      <a
                        href={ativo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#8A6828] hover:underline font-mono text-[11px] flex items-center gap-1 truncate max-w-[200px]"
                        title={ativo.url}
                      >
                        {ativo.url.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>

                    {/* Domínio */}
                    <td className="py-3 px-3 font-bold text-[#1E1A16]">
                      {ativo.dominio || '-'}
                    </td>

                    {/* Data de Renovação */}
                    <td className="py-3 px-3 font-medium text-[#1E1A16]">
                      {formatarDataBR(ativo.dataExpiracaoDominio)}
                    </td>

                    {/* Previsão Urgência */}
                    <td className="py-3 px-3">
                      {renderBadgeUrgencia(ativo)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF2E4] text-[#8A6828] border border-[#E8D4B4]">
                        {ativo.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
