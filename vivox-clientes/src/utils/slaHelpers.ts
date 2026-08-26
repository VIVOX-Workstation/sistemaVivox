import type { Chamado } from '../api/chamados';

export type SlaEstado = 'no_prazo' | 'vencendo' | 'atrasado' | 'resolvido_no_prazo' | 'resolvido_atrasado' | 'sem_sla';

export interface SlaInfo {
  estado: SlaEstado;
  label: string;
  color: string;
}

const LIMIAR_VENCENDO_MS = 2 * 60 * 60 * 1000; // últimas 2h antes do vencimento conta como "vencendo"

export function getSlaInfo(chamado: Chamado): SlaInfo {
  if (!chamado.slaVencimento) {
    return { estado: 'sem_sla', label: 'Sem prazo definido', color: 'bg-[#E5D9C8] text-[#625746]' };
  }

  const vencimento = new Date(chamado.slaVencimento).getTime();

  if (chamado.status === 'RESOLVIDO') {
    const resolvidoEm = chamado.resolvidoEm ? new Date(chamado.resolvidoEm).getTime() : null;
    if (resolvidoEm && resolvidoEm > vencimento) {
      return { estado: 'resolvido_atrasado', label: 'Resolvido fora do prazo', color: 'bg-[#FF5B5B]/10 text-[#FF5B5B]' };
    }
    return { estado: 'resolvido_no_prazo', label: 'Resolvido no prazo', color: 'bg-[#24C16E]/10 text-[#24C16E]' };
  }

  const agora = Date.now();
  const restante = vencimento - agora;

  if (restante < 0) {
    return { estado: 'atrasado', label: 'Atrasado', color: 'bg-[#FF5B5B]/10 text-[#FF5B5B]' };
  }
  if (restante <= LIMIAR_VENCENDO_MS) {
    return { estado: 'vencendo', label: 'Vencendo em breve', color: 'bg-[#FFA800]/10 text-[#FFA800]' };
  }
  return { estado: 'no_prazo', label: 'No prazo', color: 'bg-[#24C16E]/10 text-[#24C16E]' };
}

export function formatarDuracao(inicioMs: number, fimMs: number): string {
  const diffMs = Math.max(0, fimMs - inicioMs);
  const minutos = Math.floor(diffMs / 60000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (dias > 0) {
    const horasRestantes = horas % 24;
    return horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : `${dias}d`;
  }
  if (horas > 0) {
    const minRestantes = minutos % 60;
    return minRestantes > 0 ? `${horas}h ${minRestantes}min` : `${horas}h`;
  }
  return `${minutos}min`;
}

export function getTempoTotalResolucao(chamado: Chamado): string | null {
  if (chamado.status !== 'RESOLVIDO' || !chamado.resolvidoEm) return null;
  return formatarDuracao(new Date(chamado.createdAt).getTime(), new Date(chamado.resolvidoEm).getTime());
}
