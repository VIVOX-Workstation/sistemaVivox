import {
  LayoutDashboard,
  Users,
  Globe,
  BarChart2,
  ClipboardList,
  Kanban,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

export type ModuloId =
  | 'DASHBOARD'
  | 'CLIENTES'
  | 'HOSPEDAGENS'
  | 'ANALYTICS'
  | 'ACOMPANHAMENTO'
  | 'GP'
  | 'EDUCACIONAL';

export interface ModuloConfig {
  id: ModuloId;
  label: string;
  descricao: string;
  icone: LucideIcon;
  rotaInicial: string;
}

export const MODULOS: ModuloConfig[] = [
  {
    id: 'DASHBOARD',
    label: 'Dashboard',
    descricao: 'Visão geral e métricas principais da agência',
    icone: LayoutDashboard,
    rotaInicial: '/',
  },
  {
    id: 'CLIENTES',
    label: 'Vivox Clientes',
    descricao: 'Gestão da carteira de clientes e contratos',
    icone: Users,
    rotaInicial: '/clientes',
  },
  {
    id: 'HOSPEDAGENS',
    label: 'Hospedagens',
    descricao: 'Radar de VPS, domínios e renovações',
    icone: Globe,
    rotaInicial: '/hospedagens',
  },
  {
    id: 'ANALYTICS',
    label: 'Vivox Analytics',
    descricao: 'Dashboards de performance GA4, GSC e OpenPanel',
    icone: BarChart2,
    rotaInicial: '/analytics',
  },
  {
    id: 'ACOMPANHAMENTO',
    label: 'Acompanhamento',
    descricao: 'Planilha mensal de publicações e métricas',
    icone: ClipboardList,
    rotaInicial: '/acompanhamento',
  },
  {
    id: 'GP',
    label: 'Vivox GP',
    descricao: 'Gestão de projetos, tarefas e prazos',
    icone: Kanban,
    rotaInicial: '/gp',
  },
  {
    id: 'EDUCACIONAL',
    label: 'Vivox Educacional',
    descricao: 'Cursos, módulos e treinamentos internos',
    icone: GraduationCap,
    rotaInicial: '/educacional',
  },
];

export const TODOS_MODULOS: ModuloId[] = MODULOS.map((m) => m.id);
