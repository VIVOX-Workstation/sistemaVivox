import { Controller, Get, Post, Body, Param, NotFoundException, Req, Res, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from './rag.service';
import { PesquisaService } from './pesquisa.service';
import { ClientSpecialistAgent, GenerateContentDto } from './agents/client-specialist.agent';
import { VivoxMasterAgent, GenerateExecutiveReportDto } from './agents/vivox-master.agent';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ia')
export class IaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
    private readonly pesquisaService: PesquisaService,
    private readonly clientSpecialistAgent: ClientSpecialistAgent,
    private readonly vivoxMasterAgent: VivoxMasterAgent,
  ) {}

  @Post('pesquisar/:clienteId')
  async forcarPesquisa(@Param('clienteId') clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, segmento: true, nomeFantasia: true },
    });

    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const segmento = cliente.segmento || cliente.nomeFantasia;
    return this.pesquisaService.pesquisarNicho(cliente.id, segmento);
  }

  @Get('mercado/:clienteId')
  async getInteligenciaMercado(@Param('clienteId') clienteId: string) {
    return this.prisma.inteligenciaMercado.findMany({
      where: { clienteId },
      orderBy: { data: 'desc' },
      take: 10,
    });
  }

  @Post('generate-mindmap/:clienteId')
  async generateMindmap(@Param('clienteId') clienteId: string) {
    const contextMatches = await this.ragService.searchContext(
      clienteId,
      'Briefing, escopo do serviço e tendências de mercado para montar o mapa mental',
      10,
    );
    const contextText = contextMatches.map((m) => `[${m.tipo}] ${m.titulo || ''}: ${m.conteudo}`).join('\n\n');

    const { text } = await generateText({
      model: groq('openai/gpt-oss-120b'),
      system:
        'Você é um Estrategista Especialista em Marketing e Operações. Responda SEMPRE E EXCLUSIVAMENTE em formato JSON válido, sem tags markdown como ```json.',
      prompt: `Gere um mapa mental estratégico para um cliente no formato JSON exato:
{
  "name": "Foco da Estratégia",
  "children": [
    {
      "name": "Pilar Estratégico (Ex: Conteúdo & Redes)",
      "children": [
        { "name": "Ação ou tema prático" }
      ]
    }
  ]
}

Aqui está o contexto e as tendências do cliente:
${contextText}`,
    });

    try {
      const cleaned = text.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        name: 'Planejamento Estratégico',
        children: [
          { name: 'Posicionamento & Marca', children: [{ name: 'Definição de Tom de Voz' }] },
          { name: 'Produção de Conteúdo', children: [{ name: 'Roteiros de Reels Semanais' }] },
        ],
      };
    }
  }

  /**
   * Chat Streaming inteligente: detecta se é Especialista do Cliente ou Vivox Master Geral
   */
  @Post('chat')
  async chat(@Req() req: any, @Res() res: any) {
    try {
      const { messages, clienteId } = req.body;

      if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(
          '⚠️ Chave de API não configurada!\n\nPara ativar o assistente de IA, adicione `GROQ_API_KEY=sua_chave_aqui` (gratuita em console.groq.com) ou `OPENAI_API_KEY` no arquivo `.env` do projeto e reinicie o backend.',
        );
      }

      let result;
      if (clienteId) {
        result = await this.clientSpecialistAgent.chatStream(clienteId, messages);
      } else {
        result = await this.vivoxMasterAgent.chatStream(messages);
      }

      result.pipeTextStreamToResponse(res);
    } catch (err: any) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.status(500).send(`Erro ao processar resposta da IA: ${err.message}`);
    }
  }

  /**
   * Gerador de Conteúdo de Marketing Estruturado (Reels, Carrosséis, Copies de Anúncios, Pautas)
   */
  @Post('marketing/generate')
  async generateMarketing(@Body() dto: GenerateContentDto) {
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new NotFoundException(
        'Chave de API não encontrada. Configure GROQ_API_KEY ou OPENAI_API_KEY no arquivo .env.',
      );
    }
    if (!dto.clienteId) {
      throw new NotFoundException('clienteId é obrigatório para gerar conteúdo de marketing');
    }
    return this.clientSpecialistAgent.generateMarketingContent(dto);
  }

  /**
   * Gerador de Relatório Executivo Analítico (Global ou por Cliente)
   */
  @Post('reports/executive')
  async generateExecutiveReport(@Body() dto: GenerateExecutiveReportDto) {
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new NotFoundException(
        'Chave de API não encontrada. Configure GROQ_API_KEY ou OPENAI_API_KEY no arquivo .env.',
      );
    }
    return this.vivoxMasterAgent.generateExecutiveReport(dto);
  }

  /**
   * Transforma sugestão de IA diretamente em um item de Produção no Kanban
   */
  @Post('productions/create-from-ai')
  async createProductionFromAi(
    @Body()
    body: {
      clienteId: string;
      tipo: 'POST' | 'VIDEO' | 'FOLDER' | 'REVISTA' | 'LANDING_PAGE' | 'APP' | 'FOTO';
      servicoId?: string;
    },
  ) {
    const { clienteId, tipo, servicoId } = body;

    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, nomeFantasia: true },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const novaProducao = await this.prisma.producao.create({
      data: {
        clienteId,
        tipo,
        status: 'EM_PRODUCAO',
        servicoId: servicoId || null,
      },
    });

    return {
      success: true,
      message: 'Produção criada com sucesso no Kanban',
      producao: novaProducao,
    };
  }
}

