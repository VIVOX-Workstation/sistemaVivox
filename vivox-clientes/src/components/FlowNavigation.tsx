import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, House, LogIn, Grid2X2, X } from 'lucide-react';
import './FlowNavigation.css';

const destinations = [
  { to: '/', label: 'Página inicial', detail: 'Visão e propósito', icon: House },
  { to: '/login', label: 'Acessar conta', detail: 'Ambiente de trabalho', icon: LogIn },
];

export default function FlowNavigation() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <div className="flow-navigation">
      <DropdownMenu.Root modal={false} open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button type="button" className="flow-menu-trigger" aria-label="Menu de navegação">
            {open ? <X size={21} strokeWidth={1.7} aria-hidden="true" /> : <Grid2X2 size={20} strokeWidth={1.7} aria-hidden="true" />}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="flow-public-menu" align="end" sideOffset={12} collisionPadding={16} aria-label="Navegação">
            <DropdownMenu.Label className="flow-menu-label"><span>VIVOX Flow</span><span>Navegação</span></DropdownMenu.Label>
            {destinations.map(({ to, label, detail, icon: Icon }) => (
              <DropdownMenu.Item asChild key={to}>
                <Link to={to} className="flow-menu-item" aria-current={pathname === to ? 'page' : undefined}>
                  <span className="flow-menu-icon"><Icon size={18} strokeWidth={1.7} aria-hidden="true" /></span>
                  <span className="flow-menu-copy"><strong>{label}</strong><small>{detail}</small></span>
                  <ArrowUpRight className="flow-menu-arrow" size={16} aria-hidden="true" />
                </Link>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}