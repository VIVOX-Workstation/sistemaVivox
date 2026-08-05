import { CreateMetricaDto } from './dto/create-analytics.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    saveSnapshot(dto: CreateMetricaDto): Promise<{
        id: string;
        createdAt: Date;
        clienteId: string;
        periodoInicio: Date;
        periodoFim: Date;
        origem: import(".prisma/client").$Enums.OrigemDado;
        alcanceTotal: number | null;
        engajamentoTotal: number | null;
        notaGmb: number | null;
        avaliacoesGmbPeriodo: number | null;
    }>;
    getResultados(clienteId: string): Promise<{
        servicos: {
            status: import(".prisma/client").$Enums.StatusServico;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            clienteId: string;
            tipoServico: import(".prisma/client").$Enums.TipoServico;
            dataContratacao: Date;
            dataEntrega: Date | null;
            valor: import("@prisma/client/runtime/library").Decimal | null;
            descricaoEscopo: string | null;
        }[];
        snapshot: {
            id: string;
            createdAt: Date;
            clienteId: string;
            periodoInicio: Date;
            periodoFim: Date;
            origem: import(".prisma/client").$Enums.OrigemDado;
            alcanceTotal: number | null;
            engajamentoTotal: number | null;
            notaGmb: number | null;
            avaliacoesGmbPeriodo: number | null;
        } | null;
        oportunidades: {
            status: import(".prisma/client").$Enums.StatusOportunidade;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            clienteId: string;
            servicoSugerido: import(".prisma/client").$Enums.TipoServico;
            justificativa: string | null;
        }[];
    }>;
}
