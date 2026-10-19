import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ClienteMono } from '../ClienteMono';
import { VivoxFlowLogo } from '../brand/VivoxFlowLogo';

// Topo do portal do cliente no layout clean (canvas › Portal). Precisa estar dentro de .vxp.

interface PortalHeaderProps {
  cliente?: {
    nomeFantasia: string;
    logoUrl?: string | null;
  } | null;
}

const LINKS = [
  { to: '/portal', label: 'Serviços', end: true },
  { to: '/portal/acompanhamento', label: 'Acompanhamento', end: false },
  { to: '/portal/cronogramas', label: 'Cronogramas', end: false },
];

export function PortalHeader({ cliente }: PortalHeaderProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const sair = () => {
    signOut();
    navigate('/portal/entrar', { replace: true });
  };

  return (
    <header className="ph-top">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <ClienteMono cliente={{ nomeFantasia: cliente?.nomeFantasia || '…', logoUrl: cliente?.logoUrl || undefined }} />
        <div style={{ minWidth: 0 }}>
          <b style={{ display: 'block', fontWeight: 620 }}>{cliente?.nomeFantasia || 'Carregando...'}</b>
          <small className="mut" style={{ fontSize: 12 }}>Portal do cliente</small>
        </div>
      </div>
      <nav className="pnav" aria-label="Portal">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'on' : '')}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <VivoxFlowLogo className="ph-logo" />
        <button className="btn gh sm" type="button" onClick={sair}>Sair</button>
      </div>
    </header>
  );
}
