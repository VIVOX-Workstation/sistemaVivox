import { MidiasService } from './midias.service';
import { CreateMidiaDto } from './dto/create-midia.dto';
import { UpdateMidiaDto } from './dto/update-midia.dto';
import { StorageService } from '../storage/storage.service';
export declare class MidiasController {
    private readonly midiasService;
    private readonly storageService;
    constructor(midiasService: MidiasService, storageService: StorageService);
    create(createMidiaDto: CreateMidiaDto, files?: Express.Multer.File[]): Promise<any[] | {
        id: string;
        clienteId: string;
        tags: string[];
        url: string;
        dataUpload: Date;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        clienteId: string;
        tags: string[];
        url: string;
        dataUpload: Date;
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__MidiaClienteClient<{
        id: string;
        clienteId: string;
        tags: string[];
        url: string;
        dataUpload: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateMidiaDto: UpdateMidiaDto): import(".prisma/client").Prisma.Prisma__MidiaClienteClient<{
        id: string;
        clienteId: string;
        tags: string[];
        url: string;
        dataUpload: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__MidiaClienteClient<{
        id: string;
        clienteId: string;
        tags: string[];
        url: string;
        dataUpload: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
