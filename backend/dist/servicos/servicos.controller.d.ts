import { ServicosService } from './servicos.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
export declare class ServicosController {
    private readonly servicosService;
    constructor(servicosService: ServicosService);
    create(createServicoDto: CreateServicoDto): import(".prisma/client").Prisma.Prisma__ServicoContratadoClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
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
    }[]>;
    findByCliente(clienteId: string): import(".prisma/client").Prisma.PrismaPromise<{
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
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__ServicoContratadoClient<{
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
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateServicoDto: UpdateServicoDto): import(".prisma/client").Prisma.Prisma__ServicoContratadoClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__ServicoContratadoClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
