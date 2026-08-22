import { Injectable } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  create(createClienteDto: CreateClienteDto) {
    return this.prisma.cliente.create({
      data: createClienteDto,
      omit: { openpanelClientSecret: true },
    });
  }

  findAll() {
    return this.prisma.cliente.findMany({
      omit: { openpanelClientSecret: true },
    });
  }

  findOne(id: string) {
    return this.prisma.cliente.findUnique({
      where: { id },
      omit: { openpanelClientSecret: true },
      include: {
        fontesContexto: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  update(id: string, updateClienteDto: UpdateClienteDto) {
    return this.prisma.cliente.update({
      where: { id },
      data: updateClienteDto,
      omit: { openpanelClientSecret: true },
    });
  }

  remove(id: string) {
    return this.prisma.cliente.delete({
      where: { id },
    });
  }

  // --- FONTES & CONTEXTO ---
  addFonte(clienteId: string, data: any) {
    return this.prisma.fonteContexto.create({
      data: {
        ...data,
        clienteId
      }
    });
  }

  updateFonte(fonteId: string, data: any) {
    return this.prisma.fonteContexto.update({
      where: { id: fonteId },
      data
    });
  }

  removeFonte(fonteId: string) {
    return this.prisma.fonteContexto.delete({
      where: { id: fonteId }
    });
  }
}
