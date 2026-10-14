import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SistemaVivoxLogo, VivoxMark } from './brand/SistemaVivoxLogo';
import { useSidebarPrefs } from '../utils/sidebarPrefs';
import VivoxIntro from './VivoxIntro';
import { FloatingAssistant } from './FloatingAssistant';
import marcaImg from '../assets/marca.webp';
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
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type IconType = React.ComponentType<{ className?: string }>;

function SideLink({
  to,
  end,
  icon: Icon,
  label,
  title,
  collapsed,
}: {
  to: string;
  end?: boolean;
  icon: IconType;
  label: string;
  title?: string;
  collapsed: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? title || label : undefined}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) => `vsb-item ${collapsed ? 'is-collapsed' : ''} ${isActive ? 'is-active' : ''}`}
    >
      <Icon className="vsb-ic" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

function SoonItem({ icon: Icon, label, collapsed }: { icon: IconType; label: string; collapsed: boolean }) {
  return (
    <div
      title={collapsed ? label : undefined}
      aria-disabled="true"
      className={`vsb-item vsb-soon ${collapsed ? 'is-collapsed' : ''}`}
    >
      <Icon className="vsb-ic" />
      {!collapsed && <span className="truncate">{label}</span>}
    </div>
  );
}

/* Barra lateral: preto, grade fina e uma luz dourada que respira (a mesma da tela de entrada) */
const SIDEBAR_CSS = `
.vsb{position:relative;overflow:hidden;background:#080706;border-right:1px solid rgba(204,182,145,.14);box-shadow:20px 0 60px -30px rgba(0,0,0,.8);isolation:isolate}
.vsb-grid{position:absolute;inset:0;z-index:-2;pointer-events:none;background-image:linear-gradient(to right,rgba(204,182,145,.05) 1px,transparent 1px),linear-gradient(to bottom,rgba(204,182,145,.05) 1px,transparent 1px);background-size:48px 48px;-webkit-mask-image:linear-gradient(to bottom,#000,transparent 70%);mask-image:linear-gradient(to bottom,#000,transparent 70%)}
.vsb-light{position:absolute;left:50%;top:-90px;width:340px;aspect-ratio:1;z-index:-1;pointer-events:none;transform:translateX(-50%);display:none}
.vsb-glow .vsb-light{display:block}
.vsb-light i{position:absolute;inset:0;border-radius:50%;background:radial-gradient(closest-side,rgba(204,182,145,.30),rgba(204,182,145,.08) 55%,transparent 75%);filter:blur(22px);animation:vsb-breathe 7s ease-in-out infinite}
.vsb-light i+i{inset:26%;background:radial-gradient(closest-side,rgba(255,226,170,.30),transparent 72%);animation-delay:-3.5s}
@keyframes vsb-breathe{0%,100%{opacity:.5;transform:scale(.92)}50%{opacity:1;transform:scale(1.06)}}
.vsb-head{height:72px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 14px 0 18px;border-bottom:1px solid rgba(204,182,145,.12);flex:none}
.vsb-head.is-collapsed{flex-direction:column;justify-content:center;gap:6px;height:84px;padding:0}
.vsb-logo{display:block;height:auto;width:min(176px,100%);color:#f4efe6;filter:drop-shadow(0 0 16px rgba(204,182,145,.22))}
.vsb-mark{display:block;height:26px;width:auto;filter:drop-shadow(0 0 14px rgba(204,182,145,.35))}
.vsb-toggle{flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:9px;border:1px solid transparent;background:transparent;color:#8f8677;cursor:pointer;transition:color .2s,background .2s,border-color .2s}
.vsb-toggle:hover{color:#f4efe6;background:rgba(204,182,145,.1);border-color:rgba(204,182,145,.2)}
.vsb-nav{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:14px 12px;display:flex;flex-direction:column;gap:4px}
.vsb-label{padding:6px 10px 8px;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#7d7566}
.vsb-label-soon{margin-top:14px}
.vsb-sep{height:1px;margin:10px 8px;background:rgba(204,182,145,.12)}
.vsb-item{position:relative;display:flex;align-items:center;gap:12px;width:100%;height:42px;padding:0 12px;border-radius:12px;border:1px solid transparent;background:transparent;color:#bdb3a2;font:inherit;font-size:13px;font-weight:600;text-align:left;cursor:pointer;text-decoration:none;transition:background .2s,color .2s,border-color .2s,box-shadow .25s}
.vsb-item.is-collapsed{justify-content:center;padding:0}
.vsb-ic{width:18px;height:18px;flex:none;color:#ccb691;transition:transform .2s,filter .25s}
.vsb-item:hover{background:rgba(204,182,145,.08);color:#f4efe6;border-color:rgba(204,182,145,.12)}
.vsb-item:hover .vsb-ic{transform:scale(1.08)}
.vsb-item:focus-visible,.vsb-toggle:focus-visible{outline:2px solid rgba(204,182,145,.75);outline-offset:2px}
.vsb-item.is-active{color:#f6e9cf;background:linear-gradient(180deg,rgba(204,182,145,.16),rgba(204,182,145,.07));border-color:rgba(204,182,145,.38);box-shadow:0 0 28px -10px rgba(204,182,145,.55),inset 0 1px 0 rgba(255,255,255,.06)}
.vsb-item.is-active .vsb-ic{filter:drop-shadow(0 0 6px rgba(204,182,145,.6))}
.vsb-soon{color:#5f584c;cursor:not-allowed;font-weight:500}
.vsb-soon .vsb-ic{color:#5f584c}
.vsb-soon:hover{background:transparent;border-color:transparent;color:#5f584c}
.vsb-soon:hover .vsb-ic{transform:none}
.vsb-foot{flex:none;padding:12px;display:flex;flex-direction:column;gap:4px;border-top:1px solid rgba(204,182,145,.12);background:linear-gradient(180deg,transparent,rgba(0,0,0,.35))}
.vsb-out .vsb-ic{color:#d9695e}
.vsb-out:hover{background:rgba(217,105,94,.1);border-color:rgba(217,105,94,.25)}
@media (prefers-reduced-motion:reduce){.vsb-light i{animation:none;opacity:.7}.vsb,.vsb-item,.vsb-ic{transition:none}}
`;

export function Layout() {
  const { signOut, podeAcessar, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isLegacySyncView = searchParams.has('clienteId') || searchParams.has('servicoId') ||
    searchParams.get('visao') === 'lista' || searchParams.get('visao') === 'prazos';
  const isSyncEntry = /^\/gp(?:\/tarefa\/[^/]+)?\/?$/.test(location.pathname);
  const isVvoxSyncRoute = /^\/vvoxsync(?:\/|$)/.test(location.pathname);
  const isSyncCanvas = isVvoxSyncRoute || /^\/gp\/kanban\/?$/.test(location.pathname) || (isSyncEntry && !isLegacySyncView);
  const isFullBleed =
    location.pathname === '/' ||
    location.pathname.startsWith('/gp') ||
    location.pathname.startsWith('/vvoxsync') ||
    location.pathname.startsWith('/cliente') || 
    location.pathname.startsWith('/analytics') ||
    location.pathname.startsWith('/acompanhamento') ||
    location.pathname === '/hospedagens' ||
    location.pathname === '/renovacoes' ||
    location.pathname === '/configuracoes';

  const isMarcaVisible =
    location.pathname === '/' ||
    location.pathname.startsWith('/cliente') ||
    location.pathname.startsWith('/analytics') ||
    location.pathname.startsWith('/vvoxsync') ||
    location.pathname.startsWith('/gp');

  const [showIntro, setShowIntro] = useState(false);

  // Preferências da barra lateral (recolher e luz dourada), salvas neste navegador
  const { prefs, update } = useSidebarPrefs();
  const isSidebarCollapsed = prefs.collapsed;
  const toggleSidebar = () => update({ collapsed: !prefs.collapsed });

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
        {/* Barra lateral: preta, com a luz dourada da tela de entrada */}
        <aside
          className={`vsb ${prefs.glow ? 'vsb-glow' : ''} flex flex-col z-20 select-none transition-[width] duration-300 ease-in-out shrink-0 ${
            isSyncCanvas ? 'hidden' : isSidebarCollapsed ? 'w-[76px]' : 'w-64'
          }`}
        >
          <style>{SIDEBAR_CSS}</style>
          <div className="vsb-light" aria-hidden="true">
            <i />
            <i />
          </div>
          <div className="vsb-grid" aria-hidden="true" />

          {/* Logo + recolher */}
          <div className={`vsb-head ${isSidebarCollapsed ? 'is-collapsed' : ''}`}>
            {!isSidebarCollapsed ? <SistemaVivoxLogo className="vsb-logo" /> : <VivoxMark className="vsb-mark" />}
            <button
              type="button"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
              aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
              className="vsb-toggle"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Navegação de módulos */}
          <nav className="vsb-nav" aria-label="Módulos">
            {!isSidebarCollapsed && <div className="vsb-label">Módulos ativos</div>}

            {podeAcessar('DASHBOARD') && (
              <SideLink to="/" end icon={LayoutDashboard} label="Dashboard" title="Dashboard Executivo" collapsed={isSidebarCollapsed} />
            )}
            {podeAcessar('CLIENTES') && (
              <SideLink to="/clientes" icon={Users} label="Vivox Clientes" collapsed={isSidebarCollapsed} />
            )}
            {podeAcessar('HOSPEDAGENS') && (
              <SideLink to="/hospedagens" icon={Globe} label="Hospedagens" collapsed={isSidebarCollapsed} />
            )}
            {podeAcessar('ANALYTICS') && (
              <SideLink to="/analytics" icon={BarChart2} label="Vivox Analytics" collapsed={isSidebarCollapsed} />
            )}
            {podeAcessar('ACOMPANHAMENTO') && (
              <SideLink to="/acompanhamento" icon={ClipboardList} label="Acompanhamento" collapsed={isSidebarCollapsed} />
            )}
            {podeAcessar('GP') && (
              <SideLink to="/vvoxsync" icon={Kanban} label="VVOX Sync" collapsed={isSidebarCollapsed} />
            )}
            {podeAcessar('EDUCACIONAL') && (
              <SideLink to="/educacional" icon={GraduationCap} label="Vivox Educacional" collapsed={isSidebarCollapsed} />
            )}

            {/* Em breve: visível só para administradores */}
            {isAdmin && (
              <>
                {!isSidebarCollapsed && <div className="vsb-label vsb-label-soon">Em breve</div>}
                {isSidebarCollapsed && <div className="vsb-sep" aria-hidden="true" />}
                <SoonItem icon={CheckSquare} label="Vivox Revisão" collapsed={isSidebarCollapsed} />
                <SoonItem icon={PenTool} label="Vivox Analista" collapsed={isSidebarCollapsed} />
                <SoonItem icon={Palette} label="Vivox Studio" collapsed={isSidebarCollapsed} />
                <SoonItem icon={Film} label="Vivox Film" collapsed={isSidebarCollapsed} />
              </>
            )}
          </nav>

          {/* Rodapé: Configurações + Sair */}
          <div className="vsb-foot">
            {isAdmin && (
              <SideLink to="/configuracoes" icon={Settings} label="Configurações" title="Configurações do Sistema" collapsed={isSidebarCollapsed} />
            )}
            <button
              type="button"
              onClick={signOut}
              title={isSidebarCollapsed ? 'Sair da conta' : undefined}
              aria-label={isSidebarCollapsed ? 'Sair da conta' : undefined}
              className={`vsb-item vsb-out ${isSidebarCollapsed ? 'is-collapsed' : ''}`}
            >
              <LogOut className="vsb-ic" />
              {!isSidebarCollapsed && <span className="truncate">Sair</span>}
            </button>
          </div>
        </aside>

        {/* Conteúdo Principal (Expande para preencher o espaço restante) */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FAF7F2] min-w-0 relative">
          {/* Marca D'água Vivox no canto inferior direito - camada de fundo z-0 */}
          {isMarcaVisible && !isSyncCanvas && (
            <div className="fixed -bottom-2 -right-2 pointer-events-none select-none z-0 overflow-hidden leading-none">
              <img
                src={marcaImg}
                alt=""
                aria-hidden="true"
                className="w-56 sm:w-72 md:w-[360px] lg:w-[440px] xl:w-[500px] max-w-none object-contain opacity-[0.07] md:opacity-[0.09] pointer-events-none"
              />
            </div>
          )}

          <div className={`flex-1 overflow-auto relative z-10 ${isFullBleed ? 'p-0 flex flex-col' : 'p-8'}`}>
            <Outlet />
          </div>
        </main>

        {/* Assistente IA Flutuante Global */}
        {!isSyncCanvas && <FloatingAssistant />}
      </div>
    </>
  );
}
