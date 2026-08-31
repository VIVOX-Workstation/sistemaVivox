import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuadrosService {
  constructor(private readonly prisma: PrismaService) {}

  async findByRoomId(roomId: string) {
    const quadro = await this.prisma.quadroSala.findUnique({
      where: { roomId },
      select: {
        elements: true,
      },
    });

    if (!quadro) {
      return { elements: [] };
    }

    return quadro;
  }

  async upsertQuadro(roomId: string, elements: any) {
    return this.prisma.quadroSala.upsert({
      where: { roomId },
      create: {
        roomId,
        elements,
      },
      update: {
        elements,
      },
    });
  }
}
