import { Injectable } from '@nestjs/common';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicosService {
  constructor(private prisma: PrismaService) {}

  create(createServicoDto: CreateServicoDto) {
    return this.prisma.servicoContratado.create({
      data: createServicoDto,
    });
  }

  findAll() {
    return this.prisma.servicoContratado.findMany();
  }

  findOne(id: string) {
    return this.prisma.servicoContratado.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nomeFantasia: true, razaoSocial: true },
        },
        historico: {
          include: {
            usuario: { select: { id: true, nome: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tarefas: {
          select: { id: true, titulo: true, status: true, prioridade: true, prazo: true },
        },
      },
    });
  }

  findByCliente(clienteId: string) {
    return this.prisma.servicoContratado.findMany({
      where: { clienteId },
      include: {
        cliente: {
          select: { id: true, nomeFantasia: true, razaoSocial: true },
        },
        historico: {
          include: {
            usuario: { select: { id: true, nome: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tarefas: {
          select: { id: true, titulo: true, status: true, prioridade: true, prazo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, updateServicoDto: UpdateServicoDto) {
    return this.prisma.servicoContratado.update({
      where: { id },
      data: updateServicoDto,
    });
  }

  remove(id: string) {
    return this.prisma.servicoContratado.delete({
      where: { id },
    });
  }
}
