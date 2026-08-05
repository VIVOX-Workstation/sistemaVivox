import { ProducoesService } from './producoes.service';
import { CreateProducoeDto } from './dto/create-producoe.dto';
import { UpdateProducoeDto } from './dto/update-producoe.dto';
import { StorageService } from '../storage/storage.service';
export declare class ProducoesController {
    private readonly producoesService;
    private readonly storageService;
    constructor(producoesService: ProducoesService, storageService: StorageService);
    create(createProducoeDto: CreateProducoeDto, file?: Express.Multer.File): Promise<{
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
    }>;
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
