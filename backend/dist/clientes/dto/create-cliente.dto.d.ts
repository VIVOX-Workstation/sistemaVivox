import { StatusCliente } from '@prisma/client';
export declare class CreateClienteDto {
    nomeFantasia: string;
    razaoSocial?: string;
    cnpjCpf: string;
    segmento: string;
    responsavelId?: string;
    contatos: any;
    status: StatusCliente;
    dataInicioContrato?: string;
    dataFimContrato?: string;
    logoUrl?: string;
    observacoes?: string;
}
