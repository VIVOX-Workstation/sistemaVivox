import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
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

  async seedAdmin(email = 'kelson@vivox.com.br', pass = '123456') {
    const hashedPassword = await bcrypt.hash(pass, 10);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      await this.prisma.user.update({
        where: { email },
        data: { senha: hashedPassword },
      });
      return { message: `Senha do usuário ${email} atualizada com sucesso para "${pass}"!`, email };
    }
    const created = await this.prisma.user.create({
      data: {
        nome: 'Kelson Cosme',
        email,
        senha: hashedPassword,
      },
    });
    return { message: `Usuário ${email} criado com sucesso com a senha "${pass}"!`, email: created.email };
  }

  findAll() {
    return this.prisma.user.findMany({ select: { id: true, nome: true, email: true, role: true } });
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
