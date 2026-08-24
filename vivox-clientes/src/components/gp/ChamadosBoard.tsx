import React, { useState, useMemo } from 'react';
import type { Chamado, StatusChamado } from '../../api/chamados';
import type { Cliente } from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { 
  Building2,
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Timer,
  Search,
  Filter,
  User,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChamadosBoardProps {
  chamados: Chamado[];
  clientes: Cliente[];
  onUpdateStatus: (chamadoId: string, novoStatus: StatusChamado) => void;
  onOpenChamado?: (chamado: Chamado) => void;
}

const statusConfig = {
  ABERTO: { label: 'Aberto', color: 'bg-[#FF5B5B]/10 text-[#FF5B5B]', icon: AlertCircle },
  EM_ANDAMENTO: { label: 'Em Atendimento', color: 'bg-[#FFA800]/10 text-[#FFA800]', icon: Timer },
  RESOLVIDO: { label: 'Resolvido', color: 'bg-[#24C16E]/10 text-[#24C16E]', icon: CheckCircle2 }
};

export const ChamadosBoard: React.FC<ChamadosBoardProps> = ({
  chamados,
  clientes,
  onUpdateStatus,
  onOpenChamado
}) => {
  const [activeTab, setActiveTab] = useState<'ativos' | 'fechados'>('ativos');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickFora = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClickFora);
    return () => window.removeEventListener('click', handleClickFora);
  }, []);

  // Filter and group chamados
  const filteredChamados = useMemo(() => {
    let filtered = chamados;
    
    // Filtro por Tab
    if (activeTab === 'ativos') {
      filtered = filtered.filter(c => c.status === 'ABERTO' || c.status === 'EM_ANDAMENTO');
    } else {
      filtered = filtered.filter(c => c.status === 'RESOLVIDO');
    }

    // Filtro por Busca
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => {
        const cliente = clientes.find(cl => cl.id === c.clienteId);
        const matchDesc = c.descricaoProblema?.toLowerCase().includes(lowerSearch);
        const matchCliente = cliente?.nomeFantasia?.toLowerCase().includes(lowerSearch);
        const matchId = c.id.toLowerCase().includes(lowerSearch);
        return matchDesc || matchCliente || matchId;
      });
    }

    // Ordernar por data decrescente
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [chamados, activeTab, searchTerm, clientes]);

  const renderChamadoRow = (chamado: Chamado) => {
    const cliente = clientes.find(c => c.id === chamado.clienteId);
    const statusInfo = statusConfig[chamado.status];
    
    // Mock do criador (enquanto não temos no DB)
    const creatorName = cliente?.nomeFantasia || 'Equipe Vivox';
    const ticketNum = `#${chamado.id.substring(0, 6).toUpperCase()}`;

    return (
      <div 
        key={chamado.id}
        onClick={() => onOpenChamado && onOpenChamado(chamado)}
        className="flex items-center px-6 py-4 hover:bg-[#FAF7F2]/50 transition-colors cursor-pointer border-b border-[#F6F2EA] group"
      >
        {/* Ticket ID */}
        <div className="w-[100px] shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#8F8271]">
          <Hash className="w-3.5 h-3.5" />
          {ticketNum}
        </div>

        {/* Cliente / Assunto */}
        <div className="flex-1 min-w-[300px] pr-4 flex flex-col justify-center">
          <p className="text-[13px] font-bold text-[#1E1A16] line-clamp-1 group-hover:text-[#C7A15F] transition-colors">
            {chamado.descricaoProblema || 'Sem descrição definida'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {cliente?.logoUrl ? (
              <img src={resolveMediaUrl(cliente.logoUrl)} alt="Logo" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-[#181512] flex items-center justify-center text-[#C7A15F]">
                <Building2 className="w-2.5 h-2.5" />
              </div>
            )}
            <span className="text-[11px] font-bold text-[#8F8271]">
              {cliente?.nomeFantasia || 'Desconhecido'}
            </span>
          </div>
        </div>

        {/* Criador */}
        <div className="w-[160px] shrink-0 flex items-center gap-2 pr-4">
          <div className="w-6 h-6 rounded-full bg-[#E5D9C8] flex items-center justify-center text-[#625746]">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-[#625746] truncate">
            {creatorName}
          </span>
        </div>

        {/* Data */}
        <div className="w-[140px] shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-[#8F8271]">
          <Clock className="w-3.5 h-3.5 opacity-70" />
          {format(new Date(chamado.createdAt), "dd MMM, yyyy", { locale: ptBR })}
        </div>

        {/* Status */}
        <div className="w-[130px] shrink-0 flex items-center justify-center">
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 w-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Ações */}
        <div className="w-[50px] shrink-0 flex items-center justify-end relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(openDropdownId === chamado.id ? null : chamado.id);
            }}
            className="w-8 h-8 rounded-full text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#E5D9C8] flex items-center justify-center transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {openDropdownId === chamado.id && (
            <div className="absolute right-6 top-8 w-44 bg-white border border-[#E5D9C8] rounded-2xl shadow-xl z-50 py-2 overflow-hidden"
                 onClick={(e) => e.stopPropagation()}>
              <div className="px-3 py-1 mb-1 text-[10px] font-bold text-[#8F8271] uppercase tracking-wider border-b border-[#F6F2EA]">
                Alterar Status
              </div>
              <button
                onClick={() => {
                  onUpdateStatus(chamado.id, 'ABERTO');
                  setOpenDropdownId(null);
                }}
                className="w-full text-left px-4 py-2 text-xs font-bold text-[#625746] hover:bg-[#FAF7F2] hover:text-[#1E1A16] transition-colors"
              >
                Marcar como Aberto
              </button>
              <button
                onClick={() => {
                  onUpdateStatus(chamado.id, 'EM_ANDAMENTO');
                  setOpenDropdownId(null);
                }}
                className="w-full text-left px-4 py-2 text-xs font-bold text-[#625746] hover:bg-[#FAF7F2] hover:text-[#1E1A16] transition-colors"
              >
                Em Atendimento
              </button>
              <button
                onClick={() => {
                  onUpdateStatus(chamado.id, 'RESOLVIDO');
                  setOpenDropdownId(null);
                }}
                className="w-full text-left px-4 py-2 text-xs font-bold text-[#24C16E] hover:bg-[#24C16E]/10 transition-colors"
              >
                Marcar Resolvido
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const abertos = filteredChamados.filter(c => c.status === 'ABERTO');
  const emAndamento = filteredChamados.filter(c => c.status === 'EM_ANDAMENTO');

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#FFFDF8] overflow-hidden">
      {/* Top Header Controls (Inspired by the new design) */}
      <div className="flex flex-col gap-4 px-8 pt-8 pb-4 bg-white border-b border-[#F6F2EA]">
        <div className="flex items-center justify-between gap-6">
          {/* Tabs - Pill style */}
          <div className="flex items-center bg-[#FAF7F2] p-1.5 rounded-full border border-[#E5D9C8]">
            <button
              onClick={() => setActiveTab('ativos')}
              className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all ${
                activeTab === 'ativos'
                  ? 'bg-white text-[#181512] shadow-sm'
                  : 'text-[#8F8271] hover:text-[#1E1A16]'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setActiveTab('fechados')}
              className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all ${
                activeTab === 'fechados'
                  ? 'bg-white text-[#181512] shadow-sm'
                  : 'text-[#8F8271] hover:text-[#1E1A16]'
              }`}
            >
              Resolvidos
            </button>
          </div>

          {/* Centered Search Bar */}
          <div className="flex-1 max-w-md relative group">
            <Search className="w-4 h-4 text-[#8F8271] absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#C7A15F] transition-colors" />
            <input
              type="text"
              placeholder="Buscar por cliente, assunto ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FAF7F2] hover:bg-[#F6F2EA] focus:bg-white border border-[#E5D9C8] focus:border-[#C7A15F] focus:ring-4 focus:ring-[#C7A15F]/10 rounded-full py-2.5 pl-11 pr-4 text-xs font-bold text-[#1E1A16] placeholder:text-[#8F8271] outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Right side controls (Filters) */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#E5D9C8] border border-[#E5D9C8] rounded-full text-xs font-bold text-[#625746] transition-colors shadow-2xs">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Chamados */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Table Header (Clean, no background, just text) */}
        <div className="flex items-center px-6 py-4 text-[11px] font-black text-[#8F8271] uppercase tracking-wider border-b border-[#F6F2EA]">
          <div className="w-[100px] shrink-0">ID</div>
          <div className="flex-1 min-w-[300px]">Cliente / Assunto</div>
          <div className="w-[160px] shrink-0">Criado Por</div>
          <div className="w-[140px] shrink-0">Data</div>
          <div className="w-[130px] shrink-0 text-center">Status</div>
          <div className="w-[50px] shrink-0 text-right"></div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto pb-20">
          {filteredChamados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#8F8271] gap-3">
              <CheckCircle2 className="w-10 h-10 opacity-30" />
              <p className="text-sm font-bold">Nenhum chamado encontrado.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {activeTab === 'ativos' ? (
                <>
                  {/* Sessão Novos (Abertos) */}
                  {abertos.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-3 px-6 py-3 bg-[#FAF7F2]/50 border-b border-[#F6F2EA]">
                        <div className="w-2 h-2 rounded-full bg-[#FF5B5B]" />
                        <h4 className="text-[11px] font-black uppercase text-[#1E1A16] tracking-widest">
                          Novos Chamados
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-white border border-[#E5D9C8] text-[10px] font-bold text-[#8F8271]">
                          {abertos.length}
                        </span>
                      </div>
                      {abertos.map(renderChamadoRow)}
                    </div>
                  )}

                  {/* Sessão Em Atendimento */}
                  {emAndamento.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 px-6 py-3 bg-[#FAF7F2]/50 border-b border-[#F6F2EA]">
                        <div className="w-2 h-2 rounded-full bg-[#FFA800]" />
                        <h4 className="text-[11px] font-black uppercase text-[#1E1A16] tracking-widest">
                          Em Atendimento
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-white border border-[#E5D9C8] text-[10px] font-bold text-[#8F8271]">
                          {emAndamento.length}
                        </span>
                      </div>
                      {emAndamento.map(renderChamadoRow)}
                    </div>
                  )}
                </>
              ) : (
                /* Tab Fechados (Resolvidos) */
                filteredChamados.map(renderChamadoRow)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
