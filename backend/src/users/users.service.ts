import { Injectable, ConflictException, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ModuloSistema, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.senha, 10);
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        senha: hashedPassword,
      },
    });
  }

  async setup(createUserDto: CreateUserDto) {
    const count = await this.prisma.user.count();
    if (count > 0) {
      throw new ForbiddenException('Setup só é permitido quando não existem usuários cadastrados.');
    }
    return this.create(createUserDto);
  }

  async seedAdmin(email = 'equipevivox@gmail.com', pass = '123456', role: Role = Role.ADMIN, nome = 'Equipe Vivox') {
    const hashedPassword = await bcrypt.hash(pass, 10);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      const updated = await this.prisma.user.update({
        where: { email },
        data: {
          senha: hashedPassword,
          role,
          ...(nome ? { nome } : {}),
        },
      });
      return {
        message: `Usuário ${email} atualizado com sucesso com perfil ${role}!`,
        user: { id: updated.id, nome: updated.nome, email: updated.email, role: updated.role },
      };
    }
    const created = await this.prisma.user.create({
      data: {
        nome,
        email,
        senha: hashedPassword,
        role,
      },
    });
    return {
      message: `Usuário ${email} criado com sucesso com a senha "${pass}" e perfil ${role}!`,
      user: { id: created.id, nome: created.nome, email: created.email, role: created.role },
    };
  }

  findAll() {
    return this.prisma.user.findMany({ where: { role: { not: Role.CLIENTE } }, select: { id: true, nome: true, email: true, role: true, modulos: true } });
  }

  async findCurrent(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id }, select: { id: true, nome: true, email: true, role: true, clienteId: true, modulos: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async updateModulos(id: string, modulos: ModuloSistema[]) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (user.role === Role.CLIENTE) throw new BadRequestException('Não é possível alterar módulos de um usuário CLIENTE.');
    return this.prisma.user.update({
      where: { id }, data: { modulos }, select: { id: true, nome: true, email: true, role: true, modulos: true },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, nome: true, email: true, role: true } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    // Para simplificar, não estamos atualizando senha aqui.
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  updateRole(id: string, role: Role) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }
}
