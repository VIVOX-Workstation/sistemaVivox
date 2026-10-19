import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { VivoxLogo } from './brand/VivoxLogo';
import { VivoxMark } from './brand/SistemaVivoxLogo';
import { useSidebarPrefs } from '../utils/sidebarPrefs';
import VivoxIntro from './VivoxIntro';
import { FloatingAssistant } from './FloatingAssistant';
import {
  LayoutDashboard,
  Users,
  BarChart2,
  GraduationCap,
  Kanban,
  LogOut,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  ClipboardList,
  ListChecks,
  LifeBuoy,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type IconType = React.ComponentType<{ className?: string }>;

function SideLink({
  to,
  end,
  icon: Icon,
  label,
  collapsed,
}: {
  to: string;
  end?: boolean;
  icon: IconType;
  label: string;
  collapsed: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) => `vsb-item ${collapsed ? 'is-collapsed' : ''} ${isActive ? 'is-active' : ''}`}
    >
      <Icon className="vsb-ic" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

/** Nome da tela na barra superior, a partir da rota. */
function tituloDaRota(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (/^\/cliente\/novo/.test(pathname)) return 'Novo cliente';
  if (/^\/cliente\/[^/]+\/servicos\/[^/]+\/planejamento/.test(pathname)) return 'Planejamento do serviço';
  if (/^\/cliente\/[^/]+\/servicos\/[^/]+\/devboard/.test(pathname)) return 'DevBoard';
  if (/^\/clientes?\/[^/]+/.test(pathname)) return 'Perfil do cliente';
  if (pathname.startsWith('/clientes')) return 'Clientes';
  if (pathname.startsWith('/hospedagens') || pathname.startsWith('/renovacoes')) return 'Hospedagens';
  if (/^\/analytics\/[^/]+/.test(pathname)) return 'Painel de métricas';
  if (pathname.startsWith('/analytics')) return 'Analytics';
  if (pathname.startsWith('/acompanhamento')) return 'Acompanhamento';
  if (pathname.startsWith('/gp/minhas-tarefas')) return 'Minhas tarefas';
  if (pathname.startsWith('/gp/workspace/all')) return 'Chamados';
  if (pathname.startsWith('/gp')) return 'Tarefas';
  if (pathname.startsWith('/educacional/admin')) return 'Gerenciar cursos';
  if (pathname.startsWith('/educacional/curso')) return 'Curso';
  if (pathname.startsWith('/educacional')) return 'Educacional';
  if (pathname.startsWith('/configuracoes')) return 'Configurações';
  if (pathname.startsWith('/sem-acesso')) return 'Sem acesso';
  return '';
}

/** Em telas estreitas a barra lateral fica sempre recolhida (só ícones). */
function useTelaEstreita() {
  const consulta = '(max-width: 767px)';
  const [estreita, setEstreita] = useState(() => typeof window !== 'undefined' && window.matchMedia(consulta).matches);
  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const sync = () => setEstreita(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return estreita;
}

/* Estrutura base clean (docs/DESIGN_SYSTEM.md › 5): menu branco, barra superior e assistente em painel lateral. */
const LAYOUT_CSS = `
.vsb{background:var(--vx-surface);border-right:1px solid var(--vx-line);font-family:var(--vx-font)}
.vsb-head{height:64px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 12px 0 20px;border-bottom:1px solid var(--vx-line);flex:none}
.vsb-head.is-collapsed{justify-content:center;padding:0}
.vsb-brand{display:flex;align-items:center;gap:10px;color:var(--vx-ink);text-decoration:none;min-width:0}
.vsb-logo{display:block;width:84px;height:auto}
.vsb-mark{display:block;height:22px;width:auto}
.vsb-tag{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--vx-ink-3);padding-top:2px}
.vsb-toggle{flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:8px;border:0;background:transparent;color:var(--vx-ink-3);cursor:pointer;transition:background .15s var(--vx-ease),color .15s var(--vx-ease)}
.vsb-toggle:hover{background:var(--vx-sunken);color:var(--vx-ink)}
.vsb-nav{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:16px 12px;display:flex;flex-direction:column;gap:2px}
.vsb-label{padding:4px 10px 8px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--vx-ink-3)}
.vsb-item{display:flex;align-items:center;gap:11px;width:100%;height:38px;padding:0 10px;border-radius:9px;border:0;background:transparent;color:var(--vx-ink-2);font:inherit;font-size:13.5px;font-weight:520;text-align:left;cursor:pointer;text-decoration:none;white-space:nowrap;transition:background .15s var(--vx-ease),color .15s var(--vx-ease)}
.vsb-item.is-collapsed{justify-content:center;padding:0}
.vsb-ic{width:17px;height:17px;flex:none;color:var(--vx-ink-3)}
.vsb-item:hover{background:var(--vx-sunken);color:var(--vx-ink)}
.vsb-item.is-active{background:var(--vx-accent-soft);color:var(--vx-accent-ink);font-weight:600}
.vsb-item.is-active .vsb-ic{color:var(--vx-accent)}
.vsb-item:focus-visible,.vsb-toggle:focus-visible,.vtop-ia:focus-visible{outline:none;box-shadow:0 0 0 2px var(--vx-surface),0 0 0 4px var(--vx-ring)}
.vsb-foot{flex:none;padding:12px;display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--vx-line)}
.vsb-me{display:flex;align-items:center;gap:10px;padding:8px 6px 4px 10px}
.vsb-me.is-collapsed{flex-direction:column;padding:8px 0 0}
.vsb-av{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--vx-sunken);color:var(--vx-ink-2);font-size:12px;font-weight:650}
.vsb-me b{display:block;font-size:13px;font-weight:600;color:var(--vx-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vsb-me small{display:block;font-size:11.5px;color:var(--vx-ink-3)}
.vsb-out{width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:8px;border:0;background:transparent;color:var(--vx-ink-3);cursor:pointer}
.vsb-out:hover{background:var(--vx-bad-soft);color:var(--vx-bad)}
.vsb-out:focus-visible{outline:none;box-shadow:0 0 0 2px var(--vx-surface),0 0 0 4px var(--vx-ring)}
.vtop{height:56px;flex:none;display:flex;align-items:center;gap:12px;padding:0 24px;background:var(--vx-surface);border-bottom:1px solid var(--vx-line);font-family:var(--vx-font)}
.vtop-title{flex:1;min-width:0;font-size:13.5px;font-weight:600;color:var(--vx-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vtop-ia{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 12px;border-radius:9px;border:0;background:transparent;color:var(--vx-ink-2);font:inherit;font-size:13px;font-weight:560;cursor:pointer;transition:background .15s var(--vx-ease),color .15s var(--vx-ease)}
.vtop-ia svg{width:16px;height:16px;color:var(--vx-accent)}
.vtop-ia:hover{background:var(--vx-sunken);color:var(--vx-ink)}
.vtop-ia.is-on{background:var(--vx-accent-soft);color:var(--vx-accent-ink)}
@media (max-width:767px){.vtop{padding:0 16px}.vtop-ia span{display:none}}
@media (prefers-reduced-motion:reduce){.vsb,.vsb-item,.vsb-toggle,.vtop-ia{transition:none}}
`;

function iniciais(nome?: string) {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

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

  const [showIntro, setShowIntro] = useState(false);
  const [iaAberta, setIaAberta] = useState(false);

  // Recolher fica salvo neste navegador; em tela estreita a barra fica sempre recolhida
  const { prefs, update } = useSidebarPrefs();
  const telaEstreita = useTelaEstreita();
  const recolhida = prefs.collapsed || telaEstreita;
  const toggleSidebar = () => update({ collapsed: !prefs.collapsed });

  useEffect(() => {
    if (sessionStorage.getItem('@Vivox:showIntro') === 'true') {
      setShowIntro(true);
      sessionStorage.removeItem('@Vivox:showIntro');
    }
  }, []);

  const titulo = tituloDaRota(location.pathname);
  const papel = isAdmin ? 'Administrador' : 'Colaborador';

  return (
    <>
      {showIntro && <VivoxIntro onComplete={() => setShowIntro(false)} />}
      <style>{LAYOUT_CSS}</style>
      <div className="flex min-h-screen bg-[var(--vx-bg)] text-[var(--vx-ink)] relative overflow-hidden">
        <aside
          className={`vsb flex flex-col z-20 select-none transition-[width] duration-300 ease-in-out shrink-0 ${
            isSyncCanvas ? 'hidden' : recolhida ? 'w-[68px]' : 'w-60'
          }`}
        >
          {/* Logo + recolher */}
          <div className={`vsb-head ${recolhida ? 'is-collapsed' : ''}`}>
            {!recolhida && (
              <NavLink to="/" className="vsb-brand" aria-label="Sistema VIVOX, ir para o início">
                <VivoxLogo className="vsb-logo" />
                <span className="vsb-tag">Sistema</span>
              </NavLink>
            )}
            {recolhida && telaEstreita && <VivoxMark className="vsb-mark" />}
            {!telaEstreita && (
              <button
                type="button"
                onClick={toggleSidebar}
                title={recolhida ? 'Expandir barra lateral' : 'Recolher barra lateral'}
                aria-label={recolhida ? 'Expandir barra lateral' : 'Recolher barra lateral'}
                className="vsb-toggle"
              >
                {recolhida ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Módulos que a pessoa pode abrir */}
          <nav className="vsb-nav" aria-label="Módulos">
            {!recolhida && <div className="vsb-label">Módulos</div>}
            {podeAcessar('DASHBOARD') && <SideLink to="/" end icon={LayoutDashboard} label="Dashboard" collapsed={recolhida} />}
            {podeAcessar('CLIENTES') && <SideLink to="/clientes" icon={Users} label="Clientes" collapsed={recolhida} />}
            {podeAcessar('HOSPEDAGENS') && <SideLink to="/hospedagens" icon={Globe} label="Hospedagens" collapsed={recolhida} />}
            {podeAcessar('ANALYTICS') && <SideLink to="/analytics" icon={BarChart2} label="Analytics" collapsed={recolhida} />}
            {podeAcessar('ACOMPANHAMENTO') && <SideLink to="/acompanhamento" icon={ClipboardList} label="Acompanhamento" collapsed={recolhida} />}
            {podeAcessar('GP') && <SideLink to="/vvoxsync" icon={Kanban} label="VVOX Sync" collapsed={recolhida} />}
            {podeAcessar('GP') && <SideLink to="/gp/minhas-tarefas" icon={ListChecks} label="Minhas tarefas" collapsed={recolhida} />}
            {podeAcessar('GP') && <SideLink to="/gp/workspace/all" icon={LifeBuoy} label="Chamados" collapsed={recolhida} />}
            {podeAcessar('EDUCACIONAL') && <SideLink to="/educacional" icon={GraduationCap} label="Educacional" collapsed={recolhida} />}
          </nav>

          {/* Configurações (admin) + pessoa conectada */}
          <div className="vsb-foot">
            {isAdmin && <SideLink to="/configuracoes" icon={Settings} label="Configurações" collapsed={recolhida} />}
            <div className={`vsb-me ${recolhida ? 'is-collapsed' : ''}`}>
              <span className="vsb-av" title={recolhida ? `${user?.nome ?? ''} · ${papel}` : undefined}>{iniciais(user?.nome)}</span>
              {!recolhida && (
                <div className="flex-1 min-w-0">
                  <b>{user?.nome}</b>
                  <small>{papel}</small>
                </div>
              )}
              <button type="button" onClick={signOut} className="vsb-out" title="Sair da conta" aria-label="Sair da conta">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--vx-bg)] min-w-0 relative">
          {!isSyncCanvas && (
            <header className="vtop">
              <p className="vtop-title">{titulo}</p>
              <button
                type="button"
                className={`vtop-ia ${iaAberta ? 'is-on' : ''}`}
                aria-pressed={iaAberta}
                onClick={() => setIaAberta((v) => !v)}
              >
                <Sparkles aria-hidden="true" />
                <span>Assistente</span>
              </button>
            </header>
          )}

          <div className={`flex-1 overflow-auto relative z-10 ${isFullBleed ? 'p-0 flex flex-col' : 'p-8'}`}>
            <Outlet />
          </div>
        </main>

        {/* Assistente IA: painel lateral aberto pela barra superior */}
        {!isSyncCanvas && <FloatingAssistant open={iaAberta} onClose={() => setIaAberta(false)} />}
      </div>
    </>
  );
}
