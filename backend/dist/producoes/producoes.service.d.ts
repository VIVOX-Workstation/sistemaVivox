import { CreateProducoeDto } from './dto/create-producoe.dto';
import { UpdateProducoeDto } from './dto/update-producoe.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class ProducoesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createProducoeDto: CreateProducoeDto): import(".prisma/client").Prisma.Prisma__ProducaoClient<{
        responsavelId: string | null;
        status: import(".prisma/client").$Enums.StatusProducao;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string;
        servicoId: string | null;
        tipo: import(".prisma/client").$Enums.TipoProducao;
        arquivoUrl: string | null;
        dataProducao: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        responsavelId: string | null;
        status: import(".prisma/client").$Enums.StatusProducao;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string;
        servicoId: string | null;
        tipo: import(".prisma/client").$Enums.TipoProducao;
        arquivoUrl: string | null;
        dataProducao: Date | null;
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__ProducaoClient<{
        responsavelId: string | null;
        status: import(".prisma/client").$Enums.StatusProducao;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string;
        servicoId: string | null;
        tipo: import(".prisma/client").$Enums.TipoProducao;
        arquivoUrl: string | null;
        dataProducao: Date | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateProducoeDto: UpdateProducoeDto): import(".prisma/client").Prisma.Prisma__ProducaoClient<{
        responsavelId: string | null;
        status: import(".prisma/client").$Enums.StatusProducao;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string;
        servicoId: string | null;
        tipo: import(".prisma/client").$Enums.TipoProducao;
        arquivoUrl: string | null;
        dataProducao: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__ProducaoClient<{
        responsavelId: string | null;
        status: import(".prisma/client").$Enums.StatusProducao;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string;
        servicoId: string | null;
        tipo: import(".prisma/client").$Enums.TipoProducao;
        arquivoUrl: string | null;
        dataProducao: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
