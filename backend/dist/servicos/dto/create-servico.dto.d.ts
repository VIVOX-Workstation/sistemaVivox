import { TipoServico, StatusServico } from '@prisma/client';
export declare class CreateServicoDto {
    clienteId: string;
    tipoServico: TipoServico;
    status: StatusServico;
    dataContratacao: string;
    dataEntrega?: string;
    valor?: number;
    descricaoEscopo?: string;
}
