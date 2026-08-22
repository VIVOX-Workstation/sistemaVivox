import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import VivoxIntro from './VivoxIntro';
import { FloatingAssistant } from './FloatingAssistant';
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
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const isFullBleed = location.pathname.startsWith('/gp');
  const [showIntro, setShowIntro] = useState(false);

  // Estado de recolhimento da barra lateral com persistência no localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('@Vivox:sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('@Vivox:sidebarCollapsed', String(next));
      } catch (e) {
        console.error('Erro ao salvar estado da sidebar:', e);
      }
      return next;
    });
  };

  useEffect(() => {
    if (sessionStorage.getItem('@Vivox:showIntro') === 'true') {
      setShowIntro(true);
      sessionStorage.removeItem('@Vivox:showIntro');
    }
  }, []);

  return (
    <>
      {showIntro && <VivoxIntro onComplete={() => setShowIntro(false)} />}
      <div className="flex min-h-screen bg-[#FAF7F2] text-[#1E1A16] relative overflow-hidden">
        {/* Sidebar VIVOX Design System com Recolhimento Dinâmico */}
        <aside
          className={`bg-[#14120E] border-r border-[#2B261F] flex flex-col shadow-2xl z-20 select-none transition-all duration-300 ease-in-out shrink-0 ${
            isSidebarCollapsed ? 'w-[72px]' : 'w-64'
          }`}
        >
          {/* Header da Sidebar com Botão Recolher */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#231F19] bg-[#0E0D0B] overflow-hidden">
            {!isSidebarCollapsed ? (
              <div className="flex items-center truncate">
                <span className="text-base font-black text-[#F6F0E7] tracking-tight">SISTEMA</span>
                <span className="text-base font-bold text-[#C7A15F] ml-1.5 tracking-tight">VIVOX</span>
              </div>
            ) : (
              <div className="w-full flex items-center justify-center">
                <span className="text-lg font-black text-[#C7A15F] tracking-tight">V</span>
              </div>
            )}

            <button
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
              className="p-1.5 rounded-lg text-[#8F8271] hover:text-[#F6F0E7] hover:bg-[#24201A] transition-colors cursor-pointer shrink-0"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#C7A15F]" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-[#8F8271]" />
              )}
            </button>
          </div>

          {/* Navegação de Módulos */}
          <nav className="flex-1 p-2.5 space-y-1.5 overflow-y-auto overflow-x-hidden">
            {!isSidebarCollapsed && (
              <div className="px-3 py-1.5 text-[9px] font-bold text-[#8F8271] uppercase tracking-[0.13em] truncate">
                Módulos Ativos
              </div>
            )}

            <NavLink
              to="/"
              end
              title={isSidebarCollapsed ? 'Dashboard Executivo' : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isSidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-[#24201A] text-[#C7A15F] border border-[#4A4032] shadow-xs'
                    : 'text-[#B9AEA0] hover:bg-[#1C1A15] hover:text-[#F6F0E7] border border-transparent'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-[#C7A15F] shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Dashboard</span>}
            </NavLink>

            <NavLink
              to="/clientes"
              title={isSidebarCollapsed ? 'Vivox Clientes' : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isSidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-[#24201A] text-[#C7A15F] border border-[#4A4032] shadow-xs'
                    : 'text-[#B9AEA0] hover:bg-[#1C1A15] hover:text-[#F6F0E7] border border-transparent'
                }`
              }
            >
              <Users className="w-4 h-4 text-[#C7A15F] shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Vivox Clientes</span>}
            </NavLink>
            
            <NavLink
              to="/analytics"
              title={isSidebarCollapsed ? 'Vivox Analytics' : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isSidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-[#24201A] text-[#C7A15F] border border-[#4A4032] shadow-xs'
                    : 'text-[#B9AEA0] hover:bg-[#1C1A15] hover:text-[#F6F0E7] border border-transparent'
                }`
              }
            >
              <BarChart2 className="w-4 h-4 text-[#C7A15F] shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Vivox Analytics</span>}
            </NavLink>

            <NavLink
              to="/gp"
              title={isSidebarCollapsed ? 'Vivox GP • Gestão de Projetos' : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isSidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-[#24201A] text-[#C7A15F] border border-[#4A4032] shadow-xs'
                    : 'text-[#B9AEA0] hover:bg-[#1C1A15] hover:text-[#F6F0E7] border border-transparent'
                }`
              }
            >
              <Kanban className="w-4 h-4 text-[#C7A15F] shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Vivox GP</span>}
            </NavLink>
            
            <NavLink
              to="/configuracoes"
              title={isSidebarCollapsed ? 'Configurações do Sistema' : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isSidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-[#24201A] text-[#C7A15F] border border-[#4A4032] shadow-xs'
                    : 'text-[#B9AEA0] hover:bg-[#1C1A15] hover:text-[#F6F0E7] border border-transparent'
                }`
              }
            >
              <Settings className="w-4 h-4 text-[#C7A15F] shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Configurações</span>}
            </NavLink>
            
            {!isSidebarCollapsed && (
              <div className="pt-4 px-3 pb-1 text-[9px] font-bold text-[#8F8271] uppercase tracking-[0.13em] truncate">
                Em Breve
              </div>
            )}

            <div
              title={isSidebarCollapsed ? 'Vivox Revisão' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#6B6154] cursor-not-allowed ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <CheckSquare className="w-4 h-4 text-[#6B6154] shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Vivox Revisão</span>}
            </div>

            <div
              title={isSidebarCollapsed ? 'Vivox Educacional' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#6B6154] cursor-not-allowed ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#6B6154] shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Vivox Educacional</span>}
            </div>

            <div
              title={isSidebarCollapsed ? 'Vivox Analista' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#6B6154] cursor-not-allowed ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <PenTool className="w-4 h-4 text-[#6B6154] shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Vivox Analista</span>}
            </div>

            <div
              title={isSidebarCollapsed ? 'Vivox Studio' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#6B6154] cursor-not-allowed ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <Palette className="w-4 h-4 text-[#6B6154] shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Vivox Studio</span>}
            </div>

            <div
              title={isSidebarCollapsed ? 'Vivox Film' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#6B6154] cursor-not-allowed ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <Film className="w-4 h-4 text-[#6B6154] shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Vivox Film</span>}
            </div>
          </nav>

          {/* Rodapé da Sidebar: Sair */}
          <div className="p-3 border-t border-[#231F19] bg-[#0E0D0B]">
            <button
              onClick={signOut}
              title={isSidebarCollapsed ? 'Sair da conta' : undefined}
              className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#B9AEA0] hover:bg-[#1C1A15] hover:text-[#F6F0E7] border border-transparent transition-all duration-150 cursor-pointer ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut className="w-4 h-4 text-[#B83B32] shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Sair</span>}
            </button>
          </div>
        </aside>

        {/* Conteúdo Principal (Expande para preencher o espaço restante) */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FAF7F2] min-w-0">
          <div className={`flex-1 overflow-auto ${isFullBleed ? 'p-0 flex flex-col' : 'p-8'}`}>
            <Outlet />
          </div>
        </main>

        {/* Assistente IA Flutuante Global */}
        <FloatingAssistant />
      </div>
    </>
  );
}
