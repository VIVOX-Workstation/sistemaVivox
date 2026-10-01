import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AtivoHospedagem, CicloRenovacao, Prisma } from '@prisma/client';
import { calcularVencimentoHospedagem } from './prazo-hospedagem';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHospedagemDto } from './dto/create-hospedagem.dto';
import { UpdateHospedagemDto } from './dto/update-hospedagem.dto';

@Injectable()
export class HospedagemService {
  constructor(private readonly prisma: PrismaService) {}

  private async dadosPrazo(dto: CreateHospedagemDto | UpdateHospedagemDto, atual?: AtivoHospedagem) {
    const inicio = dto.dataInicioHospedagem ?? atual?.dataInicioHospedagem?.toISOString().slice(0, 10);
    const meses = dto.prazoHospedagemMeses ?? atual?.prazoHospedagemMeses;
    const servicoId = dto.servicoContratadoId ?? atual?.servicoContratadoId;
    const itemId = dto.itemPlanejadoId ?? atual?.itemPlanejadoId;
    if (Boolean(servicoId) !== Boolean(itemId)) {
      throw new BadRequestException('Informe o serviço e o item do planejamento juntos.');
    }
    if (servicoId) {
      const servico = await this.prisma.servicoContratado.findUnique({
        where: { id: servicoId }, include: { planejamento: { select: { flowNodes: true } } },
      });
      if (!servico || servico.clienteId !== (dto.clienteId ?? atual?.clienteId) || servico.tipoServico !== 'LANDING_PAGE') {
        throw new BadRequestException('O serviço deve ser uma landing page deste cliente.');
      }
      const itens = servico.planejamento?.flowNodes;
      if (!Array.isArray(itens) || !itens.some(item => item && typeof item === 'object' && !Array.isArray(item) && item.id === itemId)) {
        throw new BadRequestException('Salve o item do planejamento antes de cadastrar a hospedagem.');
      }
    }
    if (Boolean(inicio) !== Boolean(meses)) {
      throw new BadRequestException('Informe a data de início e o prazo da hospedagem juntos.');
    }
    if (!inicio && !meses) return {};
    if (!inicio || !meses) throw new BadRequestException('Data de início e prazo são obrigatórios.');
    const ciclos: Record<number, CicloRenovacao> = { 1: 'MENSAL', 3: 'TRIMESTRAL', 6: 'SEMESTRAL', 12: 'ANUAL', 24: 'BIENAL' };
    return {
      dataInicioHospedagem: new Date(`${inicio}T00:00:00.000Z`),
      prazoHospedagemMeses: meses,
      dataRenovacaoVps: calcularVencimentoHospedagem(inicio, meses),
      cicloVps: ciclos[meses] ?? dto.cicloVps ?? atual?.cicloVps ?? 'ANUAL',
    };
  }

  private async persistir<T>(operacao: () => Promise<T>): Promise<T> {
    try { return await operacao(); } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Este item já possui hospedagem cadastrada. Atualize o cadastro existente.');
      }
      throw error;
    }
  }

  async create(dto: CreateHospedagemDto) {
    const prazo = await this.dadosPrazo(dto);
    return this.persistir(() => this.prisma.ativoHospedagem.create({
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
        servicoContratadoId: dto.servicoContratadoId,
        itemPlanejadoId: dto.itemPlanejadoId,
        ...prazo,
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
    }));
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
    const atual = await this.findOne(id);
    const prazo = await this.dadosPrazo(dto, atual);

    return this.persistir(() => this.prisma.ativoHospedagem.update({
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
        ...(dto.servicoContratadoId !== undefined && { servicoContratadoId: dto.servicoContratadoId }),
        ...(dto.itemPlanejadoId !== undefined && { itemPlanejadoId: dto.itemPlanejadoId }),
        ...prazo,
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
    }));
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ativoHospedagem.delete({ where: { id } });
  }

  async getRadarRenovacoes() {
    const hoje = new Intl.DateTimeFormat('en-CA', {
      timeZone: process.env.TZ || 'America/Cuiaba', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const agora = new Date(`${hoje}T00:00:00.000Z`);

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
      if (item.prazoHospedagemMeses) fatorMensal = 1 / item.prazoHospedagemMeses;

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
