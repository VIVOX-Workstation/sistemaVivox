import { NavLink, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import VivoxIntro from './VivoxIntro';
import { 
  LayoutDashboard,
  Users, 
  BarChart2, 
  CheckSquare, 
  GraduationCap, 
  PenTool, 
  Palette, 
  Film, 
  Kanban,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { signOut } = useAuth();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('@Vivox:showIntro') === 'true') {
      setShowIntro(true);
      sessionStorage.removeItem('@Vivox:showIntro');
    }
  }, []);

  return (
    <>
      {showIntro && <VivoxIntro onComplete={() => setShowIntro(false)} />}
      <div className="flex min-h-screen bg-[#FAF7F2] text-[#1E1A16]">
      {/* Sidebar VIVOX Design System */}
      <aside className="w-64 bg-[#14120E] border-r border-[#2B261F] flex flex-col shadow-2xl z-10 select-none">
        <div className="h-16 flex items-center px-6 border-b border-[#231F19] bg-[#0E0D0B]">
          <span className="text-lg font-black text-[#F6F0E7] tracking-tight">SISTEMA</span>
          <span className="text-lg font-bold text-[#C7A15F] ml-2 tracking-tight">VIVOX</span>
        </div>
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[9px] font-bold text-[#8F8271] uppercase tracking-[0.13em]">
            Módulos Ativos
          </div>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#24201A] text-[#C7A15F] border border-[#4A4032] shadow-xs'
                  : 'text-[#B9AEA0] hover:bg-[#1C1A15] hover:text-[#F6F0E7] border border-transparent'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 text-[#C7A15F]" />
            Dashboard
          </NavLink>

          <NavLink
            to="/clientes"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#24201A] text-[#C7A15F] border border-[#4A4032] shadow-xs'
                  : 'text-[#B9AEA0] hover:bg-[#1C1A15] hover:text-[#F6F0E7] border border-transparent'
              }`
            }
          >
            <Users className="w-4 h-4 text-[#C7A15F]" />
            Vivox Clientes
          </NavLink>
          
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#24201A] text-[#C7A15F] border border-[#4A4032] shadow-xs'
                  : 'text-[#B9AEA0] hover:bg-[#1C1A15] hover:text-[#F6F0E7] border border-transparent'
              }`
            }
          >
            <BarChart2 className="w-4 h-4 text-[#C7A15F]" />
            Vivox Analytics
          </NavLink>
          
          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#24201A] text-[#C7A15F] border border-[#4A4032] shadow-xs'
                  : 'text-[#B9AEA0] hover:bg-[#1C1A15] hover:text-[#F6F0E7] border border-transparent'
              }`
            }
          >
            <Settings className="w-4 h-4 text-[#C7A15F]" />
            Configurações
          </NavLink>
          
          <div className="pt-4 px-3 pb-1 text-[9px] font-bold text-[#8F8271] uppercase tracking-[0.13em]">
            Em Breve
          </div>

          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#6B6154] cursor-not-allowed">
            <CheckSquare className="w-4 h-4 text-[#6B6154]" />
            Vivox Revisão
          </div>

          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#6B6154] cursor-not-allowed">
            <GraduationCap className="w-4 h-4 text-[#6B6154]" />
            Vivox Educacional
          </div>

          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#6B6154] cursor-not-allowed">
            <PenTool className="w-4 h-4 text-[#6B6154]" />
            Vivox Analista
          </div>

          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#6B6154] cursor-not-allowed">
            <Palette className="w-4 h-4 text-[#6B6154]" />
            Vivox Studio
          </div>

          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#6B6154] cursor-not-allowed">
            <Film className="w-4 h-4 text-[#6B6154]" />
            Vivox Film
          </div>

          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#6B6154] cursor-not-allowed">
            <Kanban className="w-4 h-4 text-[#6B6154]" />
            Vivox GP
          </div>
        </nav>

        <div className="p-4 border-t border-[#231F19] bg-[#0E0D0B]">
          <button
            onClick={signOut}
            className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#B9AEA0] hover:bg-[#1C1A15] hover:text-[#F6F0E7] border border-transparent transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FAF7F2]">
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
    </>
  );
}
