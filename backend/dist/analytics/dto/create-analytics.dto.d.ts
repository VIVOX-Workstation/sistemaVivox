import { OrigemDado } from '@prisma/client';
export declare class CreateMetricaDto {
    clienteId: string;
    periodoInicio: string;
    periodoFim: string;
    origem: OrigemDado;
    alcanceTotal?: number;
    engajamentoTotal?: number;
    notaGmb?: number;
    avaliacoesGmbPeriodo?: number;
}
