import { TipoProducao, StatusProducao } from '@prisma/client';
export declare class CreateProducoeDto {
    clienteId: string;
    servicoId?: string;
    tipo: TipoProducao;
    responsavelId?: string;
    status: StatusProducao;
    arquivoUrl?: string;
}
