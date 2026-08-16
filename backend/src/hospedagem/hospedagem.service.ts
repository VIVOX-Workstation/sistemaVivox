import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHospedagemDto } from './dto/create-hospedagem.dto';
import { UpdateHospedagemDto } from './dto/update-hospedagem.dto';

@Injectable()
export class HospedagemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHospedagemDto) {
    return this.prisma.ativoHospedagem.create({
      data: {
        clienteId: dto.clienteId,
        titulo: dto.titulo,
        url: dto.url,
        provedorVps: dto.provedorVps || null,
        ipServidor: dto.ipServidor || null,
        dataRenovacaoVps: dto.dataRenovacaoVps ? new Date(dto.dataRenovacaoVps) : null,
        cicloVps: dto.cicloVps || 'ANUAL',
        custoVps: dto.custoVps !== undefined ? dto.custoVps : null,
        valorCobrado: dto.valorCobrado !== undefined ? dto.valorCobrado : null,
        dominio: dto.dominio || null,
        registradorDominio: dto.registradorDominio || null,
        dataExpiracaoDominio: dto.dataExpiracaoDominio ? new Date(dto.dataExpiracaoDominio) : null,
        dnsProvedor: dto.dnsProvedor || null,
        status: dto.status || 'ATIVO',
        sslAtivo: dto.sslAtivo !== undefined ? dto.sslAtivo : true,
        observacoes: dto.observacoes || null,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nomeFantasia: true,
            logoUrl: true,
            status: true,
          },
        },
      },
    });
  }

  async findAll(params?: { search?: string; status?: string }) {
    const where: any = {};

    if (params?.search) {
      where.OR = [
        { titulo: { contains: params.search, mode: 'insensitive' } },
        { url: { contains: params.search, mode: 'insensitive' } },
        { dominio: { contains: params.search, mode: 'insensitive' } },
        { cliente: { nomeFantasia: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    if (params?.status) {
      where.status = params.status;
    }

    return this.prisma.ativoHospedagem.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nomeFantasia: true,
            logoUrl: true,
            status: true,
          },
        },
      },
      orderBy: [
        { dataRenovacaoVps: 'asc' },
        { dataExpiracaoDominio: 'asc' },
      ],
    });
  }

  async findByCliente(clienteId: string) {
    return this.prisma.ativoHospedagem.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.ativoHospedagem.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nomeFantasia: true,
            logoUrl: true,
            status: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Ativo de hospedagem com ID ${id} não encontrado.`);
    }

    return item;
  }

  async update(id: string, dto: UpdateHospedagemDto) {
    await this.findOne(id);

    return this.prisma.ativoHospedagem.update({
      where: { id },
      data: {
        ...(dto.clienteId && { clienteId: dto.clienteId }),
        ...(dto.titulo && { titulo: dto.titulo }),
        ...(dto.url && { url: dto.url }),
        ...(dto.provedorVps !== undefined && { provedorVps: dto.provedorVps || null }),
        ...(dto.ipServidor !== undefined && { ipServidor: dto.ipServidor || null }),
        ...(dto.dataRenovacaoVps !== undefined && {
          dataRenovacaoVps: dto.dataRenovacaoVps ? new Date(dto.dataRenovacaoVps) : null,
        }),
        ...(dto.cicloVps && { cicloVps: dto.cicloVps }),
        ...(dto.custoVps !== undefined && { custoVps: dto.custoVps }),
        ...(dto.valorCobrado !== undefined && { valorCobrado: dto.valorCobrado }),
        ...(dto.dominio !== undefined && { dominio: dto.dominio || null }),
        ...(dto.registradorDominio !== undefined && {
          registradorDominio: dto.registradorDominio || null,
        }),
        ...(dto.dataExpiracaoDominio !== undefined && {
          dataExpiracaoDominio: dto.dataExpiracaoDominio ? new Date(dto.dataExpiracaoDominio) : null,
        }),
        ...(dto.dnsProvedor !== undefined && { dnsProvedor: dto.dnsProvedor || null }),
        ...(dto.status && { status: dto.status }),
        ...(dto.sslAtivo !== undefined && { sslAtivo: dto.sslAtivo }),
        ...(dto.observacoes !== undefined && { observacoes: dto.observacoes || null }),
      },
      include: {
        cliente: {
          select: {
            id: true,
            nomeFantasia: true,
            logoUrl: true,
            status: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ativoHospedagem.delete({ where: { id } });
  }

  async getRadarRenovacoes() {
    const agora = new Date();
    const em7Dias = new Date();
    em7Dias.setDate(agora.getDate() + 7);

    const em30Dias = new Date();
    em30Dias.setDate(agora.getDate() + 30);

    const todos = await this.prisma.ativoHospedagem.findMany({
      where: {
        status: { in: ['ATIVO', 'PENDENTE_RENOVACAO'] },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nomeFantasia: true,
            logoUrl: true,
          },
        },
      },
    });

    let criticos7Dias = 0;
    let atencao30Dias = 0;
    let emDia = 0;
    let receitaMensalTotal = 0;
    let custoMensalTotal = 0;

    const enriquecidos = todos.map(item => {
      const vpsDate = item.dataRenovacaoVps ? new Date(item.dataRenovacaoVps) : null;
      const domDate = item.dataExpiracaoDominio ? new Date(item.dataExpiracaoDominio) : null;

      let diasParaVps: number | null = null;
      if (vpsDate) {
        diasParaVps = Math.ceil((vpsDate.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
      }

      let diasParaDominio: number | null = null;
      if (domDate) {
        diasParaDominio = Math.ceil((domDate.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Menor quantidade de dias para algum vencimento
      const menorDias = Math.min(
        diasParaVps !== null ? diasParaVps : 9999,
        diasParaDominio !== null ? diasParaDominio : 9999
      );

      let nivelUrgencia: 'CRITICO' | 'ATENCAO' | 'EM_DIA' | 'SEM_DATA' = 'SEM_DATA';
      if (menorDias !== 9999) {
        if (menorDias <= 7) {
          nivelUrgencia = 'CRITICO';
          criticos7Dias++;
        } else if (menorDias <= 30) {
          nivelUrgencia = 'ATENCAO';
          atencao30Dias++;
        } else {
          nivelUrgencia = 'EM_DIA';
          emDia++;
        }
      }

      // Cálculo de receita mensal estimada por ciclo
      const valor = item.valorCobrado ? Number(item.valorCobrado) : 0;
      const custo = item.custoVps ? Number(item.custoVps) : 0;

      let fatorMensal = 1;
      if (item.cicloVps === 'ANUAL') fatorMensal = 1 / 12;
      else if (item.cicloVps === 'SEMESTRAL') fatorMensal = 1 / 6;
      else if (item.cicloVps === 'TRIMESTRAL') fatorMensal = 1 / 3;
      else if (item.cicloVps === 'BIENAL') fatorMensal = 1 / 24;

      receitaMensalTotal += valor * fatorMensal;
      custoMensalTotal += custo * fatorMensal;

      return {
        ...item,
        diasParaVps,
        diasParaDominio,
        menorDias: menorDias === 9999 ? null : menorDias,
        nivelUrgencia,
      };
    });

    // Ordenar pelos mais próximos de vencer
    enriquecidos.sort((a, b) => {
      const dA = a.menorDias !== null ? a.menorDias : 9999;
      const dB = b.menorDias !== null ? b.menorDias : 9999;
      return dA - dB;
    });

    return {
      totalAtivos: todos.length,
      criticos7Dias,
      atencao30Dias,
      emDia,
      receitaMensalTotal: Math.round(receitaMensalTotal * 100) / 100,
      custoMensalTotal: Math.round(custoMensalTotal * 100) / 100,
      margemMensal: Math.round((receitaMensalTotal - custoMensalTotal) * 100) / 100,
      proximasRenovacoes: enriquecidos.slice(0, 15),
    };
  }
}
