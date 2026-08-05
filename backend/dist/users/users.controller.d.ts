import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    setup(createUserDto: CreateUserDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        email: string;
        senha: string;
    }>;
    create(createUserDto: CreateUserDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        email: string;
        senha: string;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        nome: string;
        email: string;
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        nome: string;
        email: string;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateUserDto: UpdateUserDto): import(".prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        email: string;
        senha: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        email: string;
        senha: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
