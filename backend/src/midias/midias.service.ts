import { Injectable } from '@nestjs/common';
import { CreateMidiaDto } from './dto/create-midia.dto';
import { UpdateMidiaDto } from './dto/update-midia.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MidiasService {
  constructor(private prisma: PrismaService) {}

  create(createMidiaDto: CreateMidiaDto) {
    return this.prisma.midiaCliente.create({
      data: createMidiaDto as any,
    });
  }

  findAll() {
    return this.prisma.midiaCliente.findMany();
  }

  findOne(id: string) {
    return this.prisma.midiaCliente.findUnique({
      where: { id },
    });
  }

  update(id: string, updateMidiaDto: UpdateMidiaDto) {
    return this.prisma.midiaCliente.update({
      where: { id },
      data: updateMidiaDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.midiaCliente.delete({
      where: { id },
    });
  }
}
