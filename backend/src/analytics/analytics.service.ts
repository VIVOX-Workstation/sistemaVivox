import { Injectable } from '@nestjs/common';
import { CreateMetricaDto } from './dto/create-analytics.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async saveSnapshot(dto: CreateMetricaDto) {
    const existing = await this.prisma.analyticsSnapshot.findFirst({
      where: { 
        clienteId: dto.clienteId, 
        periodoInicio: dto.periodoInicio,
        origem: dto.origem
      },
    });

    if (existing) {
      return this.prisma.analyticsSnapshot.update({
        where: { id: existing.id },
        data: dto as any,
      });
    }

    return this.prisma.analyticsSnapshot.create({
      data: dto as any,
    });
  }

  async getResultados(clienteId: string) {
    const snapshots = await this.prisma.analyticsSnapshot.findMany({
      where: { clienteId },
      orderBy: { periodoInicio: 'desc' },
      take: 12,
    });

    const servicos = await this.prisma.servicoContratado.findMany({
      where: { clienteId },
    });

    let oportunidades = await this.prisma.oportunidade.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' }
    });

    // Calcula on-the-fly se não houver no banco (MVP Automático)
    if (oportunidades.length === 0) {
      const todosTipos = [
        'GERENCIAMENTO_REDES', 'FOLDER', 'REVISTA', 'LANDING_PAGE', 
        'APP', 'FOTOGRAFIA', 'VIDEO', 'TRAFEGO_PAGO', 'IDENTIDADE_VISUAL'
      ];
      
      const servicosAtivos = servicos.map(s => s.tipoServico);
      const faltantes = todosTipos.filter(t => !servicosAtivos.includes(t as any));
      
      oportunidades = faltantes.map((tipo, idx) => ({
        id: `mock-${idx}`,
        clienteId,
        servicoSugerido: tipo as any,
        justificativa: `O cliente possui engajamento potencial mas ainda não utiliza o serviço de ${tipo.replace(/_/g, ' ')}.`,
        status: 'ABERTA' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    return {
      servicos,
      snapshot: snapshots.length > 0 ? snapshots[0] : null,
      oportunidades
    };
  }
}
