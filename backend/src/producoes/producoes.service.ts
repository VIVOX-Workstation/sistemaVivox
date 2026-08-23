import { Injectable } from '@nestjs/common';
import { CreateProducoeDto } from './dto/create-producoe.dto';
import { UpdateProducoeDto } from './dto/update-producoe.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProducoesService {
  constructor(private prisma: PrismaService) {}

  create(createProducoeDto: CreateProducoeDto) {
    return this.prisma.producao.create({
      data: createProducoeDto,
    });
  }

  findAll(clienteId?: string, servicoId?: string) {
    const where: any = {};
    if (clienteId) where.clienteId = clienteId;
    if (servicoId) where.servicoId = servicoId;

    return this.prisma.producao.findMany({
      where,
      include: {
        responsavel: { select: { id: true, nome: true, email: true } },
        servico: { select: { id: true, tipoServico: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.producao.findUnique({
      where: { id },
    });
  }

  update(id: string, updateProducoeDto: UpdateProducoeDto) {
    return this.prisma.producao.update({
      where: { id },
      data: updateProducoeDto,
    });
  }

  remove(id: string) {
    return this.prisma.producao.delete({
      where: { id },
    });
  }
}
