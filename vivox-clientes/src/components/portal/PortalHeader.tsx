import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Building2, LogOut, ClipboardList, CalendarDays } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface PortalHeaderProps {
  cliente?: {
    nomeFantasia: string;
    logoUrl?: string | null;
  } | null;
}

export function PortalHeader({ cliente }: PortalHeaderProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/portal/entrar', { replace: true });
  };

  return (
    <header className="relative z-10 w-full mb-8">
      <div className="pw-glass-panel p-4 sm:p-5 rounded-3xl border border-white/60 flex items-center justify-between gap-4 flex-wrap shadow-sm">
        {/* Logo e Nome do Cliente */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF2E4] border border-[#E8D4B4] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
            {cliente?.logoUrl ? (
              <img
                src={resolveMediaUrl(cliente.logoUrl)}
                alt={cliente.nomeFantasia}
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
              {cliente?.nomeFantasia || 'Carregando...'}
            </h1>
          </div>
        </div>

        {/* Navegação entre Acompanhamento e Cronogramas (sem Serviços) + Sair */}
        <div className="flex items-center gap-3 flex-wrap">
          <nav className="flex items-center gap-1.5 bg-white/60 p-1 rounded-2xl border border-[#524B40]/10 shadow-2xs">
            <NavLink
              to="/portal/acompanhamento"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-[#181512] text-[#C7A15F] shadow-xs'
                    : 'text-[#625746] hover:text-[#1E1A16] hover:bg-white/80'
                }`
              }
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Acompanhamento</span>
            </NavLink>

            <NavLink
              to="/portal/cronogramas"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-[#181512] text-[#C7A15F] shadow-xs'
                    : 'text-[#625746] hover:text-[#1E1A16] hover:bg-white/80'
                }`
              }
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Cronogramas</span>
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
  );
}
