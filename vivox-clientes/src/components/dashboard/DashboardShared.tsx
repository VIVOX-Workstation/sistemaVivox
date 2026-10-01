import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

// Paleta dourada/neutra do sistema para os gráficos
export const CHART_COLORS = {
  gold: '#C7A15F',
  goldDark: '#8A6828',
  goldLight: '#E8D4B4',
  brown: '#524B40',
  taupe: '#8F8271',
  ink: '#1E1A16',
  success: '#247A4A',
  danger: '#B83B32',
};

export const PIE_PALETTE = ['#C7A15F', '#8A6828', '#524B40', '#E8D4B4', '#8F8271', '#247A4A'];

export const CHART_HEIGHT = 240;

export const nf = new Intl.NumberFormat('pt-BR');

export const STATUS_TAREFA_LABEL: Record<string, string> = {
  BACKLOG: 'Backlog',
  A_FAZER: 'A fazer',
  EM_ANDAMENTO: 'Em andamento',
  EM_REVISAO: 'Em revisão',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const PRIORIDADE_LABEL: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export function humanize(valor: string): string {
  const t = (valor || '').replace(/_/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function formatDiaMes(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-');
  return d && m ? `${d}/${m}` : iso;
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function formatMes(ym: string): string {
  const [, m] = ym.split('-');
  return MESES[Number(m) - 1] ?? ym;
}

interface SectionProps {
  title: string;
  icon: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function Section({ title, icon, actionLabel, onAction, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[#C7A15F]">{icon}</span>
          <h2 className="pw-section-label">{title}</h2>
        </div>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-bold text-[#7A6440] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {actionLabel} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export function Panel({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`pw-glass-panel p-5 min-w-0 ${className}`}>
      {title && <h3 className="text-[13px] font-bold text-[#1E1A16] mb-3">{title}</h3>}
      {children}
    </div>
  );
}

export function EmptyChart({ message = 'Sem dados no período.' }: { message?: string }) {
  return (
    <div
      className="flex items-center justify-center text-center text-xs text-[#8F8271] rounded-xl border border-dashed border-[#D8CBB8] px-4"
      style={{ height: CHART_HEIGHT }}
    >
      {message}
    </div>
  );
}

export function EmptyList({ message }: { message: string }) {
  return <p className="text-xs text-[#8F8271] py-4 text-center">{message}</p>;
}
