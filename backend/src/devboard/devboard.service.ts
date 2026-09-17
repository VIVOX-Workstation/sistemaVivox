import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDevCardDto } from './dto/create-dev-card.dto';
import { UpdateDevCardDto } from './dto/update-dev-card.dto';
import { DevCardTag } from '@prisma/client';

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

const TAG_BRANCH_PREFIX: Record<DevCardTag, string> = {
  FEATURE: 'feature',
  BUG: 'fix',
  ENHANCEMENT: 'refactor',
  DOCS: 'docs',
};

const SEED_CARDS: { title: string; tag: DevCardTag; description: string }[] = [
  { title: 'Adicionar tela de onboarding com autenticação social', tag: 'FEATURE', description: 'Criar o fluxo inicial de onboarding do app, incluindo login social (Google e Apple).' },
  { title: 'Corrigir crash ao abrir notificações em Android 14', tag: 'BUG', description: 'Usuários em Android 14 relatam fechamento inesperado do app ao tocar em notificações push.' },
  { title: 'Implementar checkout via Pix com QR Code dinâmico', tag: 'FEATURE', description: 'Integra o gateway de pagamento Pix ao fluxo de checkout, com geração de QR Code dinâmico.' },
];

@Injectable()
export class DevboardService {
  constructor(private prisma: PrismaService) {}

  async findByServico(servicoId: string) {
    const existentes = await this.prisma.devBoardCard.count({ where: { servicoId } });
    if (existentes === 0) {
      await this.seed(servicoId);
    }
    return this.prisma.devBoardCard.findMany({
      where: { servicoId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async seed(servicoId: string) {
    for (let i = 0; i < SEED_CARDS.length; i++) {
      const card = SEED_CARDS[i];
      await this.prisma.devBoardCard.create({
        data: {
          servicoId,
          prNumber: i + 1,
          title: card.title,
          tag: card.tag,
          description: card.description,
          branch: `${TAG_BRANCH_PREFIX[card.tag]}/${slugify(card.title)}`,
          checklist: [],
        },
      });
    }
  }

  async create(dto: CreateDevCardDto) {
    const tag = dto.tag || 'FEATURE';
    const count = await this.prisma.devBoardCard.count({ where: { servicoId: dto.servicoId } });
    const branch = dto.branch?.trim() || `${TAG_BRANCH_PREFIX[tag]}/${slugify(dto.title)}`;
    return this.prisma.devBoardCard.create({
      data: {
        servicoId: dto.servicoId,
        prNumber: count + 1,
        title: dto.title,
        tag,
        description: dto.description,
        branch,
        checklist: [],
      },
    });
  }

  async update(id: string, dto: UpdateDevCardDto) {
    const card = await this.prisma.devBoardCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('Card não encontrado');
    return this.prisma.devBoardCard.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    const card = await this.prisma.devBoardCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('Card não encontrado');
    return this.prisma.devBoardCard.delete({ where: { id } });
  }

  async saveGithubConfig(servicoId: string, githubInstallationId: string, githubRepoOwner: string, githubRepoName: string) {
    return this.prisma.servicoContratado.update({
      where: { id: servicoId },
      data: {
        githubInstallationId,
        githubRepoOwner,
        githubRepoName,
        githubConnectedAt: new Date(),
      },
    });
  }

  async getServico(servicoId: string) {
    const servico = await this.prisma.servicoContratado.findUnique({ where: { id: servicoId } });
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    return servico;
  }
}
