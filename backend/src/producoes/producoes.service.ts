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

  findAll() {
    return this.prisma.producao.findMany();
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
