import { BadRequestException } from '@nestjs/common';

export function calcularVencimentoHospedagem(inicio: string, meses: number): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !Number.isInteger(meses) || meses < 1 || meses > 120) {
    throw new BadRequestException('Informe uma data de início válida e um prazo entre 1 e 120 meses.');
  }
  const data = new Date(`${inicio}T00:00:00.000Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== inicio) {
    throw new BadRequestException('Data de início da hospedagem inválida.');
  }
  const destino = new Date(data);
  destino.setUTCDate(1);
  destino.setUTCMonth(destino.getUTCMonth() + meses);
  const ultimoDia = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
  destino.setUTCDate(Math.min(data.getUTCDate(), ultimoDia));
  return destino;
}
