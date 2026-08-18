import { Controller, Get, Post, Param, NotFoundException, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from './rag.service';
import { PesquisaService } from './pesquisa.service';
import { generateText, streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ia')
export class IaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
    private readonly pesquisaService: PesquisaService
  ) {}

  @Post('pesquisar/:clienteId')
  async forcarPesquisa(@Param('clienteId') clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, segmento: true, nomeFantasia: true }
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
    // 1. Busca contexto rico do cliente via RAG
    const contextMatches = await this.ragService.searchContext(
      clienteId, 
      "Briefing, escopo do serviço e tendências de mercado para montar o mapa mental", 
      10 
    );
    const contextText = contextMatches.map(m => `[${m.tipo}] ${m.titulo || ''}: ${m.conteudo}`).join('\n\n');

    // 2. Gerar o JSON da árvore mental com Llama 3 (Groq)
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: 'Você é um Estrategista Especialista em Marketing e Operações. Responda SEMPRE E EXCLUSIVAMENTE em formato JSON válido, sem tags markdown como ```json.',
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
${contextText}`
    });

    try {
      const cleaned = text.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        name: "Planejamento Estratégico",
        children: [
          { name: "Posicionamento & Marca", children: [{ name: "Definição de Tom de Voz" }] },
          { name: "Produção de Conteúdo", children: [{ name: "Roteiros de Reels Semanais" }] }
        ]
      };
    }
  }

  @Post('chat')
  async chat(@Req() req: any, @Res() res: any) {
    const { messages, clienteId } = req.body;

    let systemContext = `Você é o Consultor Estratégico e Diretor de Criação da Vivox, especialista dedicado ao negócio deste cliente.
Seu objetivo é analisar profundamente o contexto, histórico, briefing e as fontes do Segundo Cérebro do cliente para fornecer respostas ricas, personalizadas e de alto valor estratégico.

Diretrizes:
- Pense de forma crítica e analítica antes de responder.
- Sempre cruze as informações das Fontes de Contexto, Briefing e Tendências de Mercado.
- Responda sempre em Português do Brasil com tom profissional, experiente e criativo.
- Se o usuário perguntar sobre pessoas, marcas ou detalhes do negócio (como 'quem é a Dra...', sócios, produtos, etc.), consulte diretamente os dados fornecidos abaixo no Segundo Cérebro.`;

    if (clienteId) {
      const fullContext = await this.ragService.getFullClientContext(clienteId);
      if (fullContext) {
        systemContext += `\n\n--- INFORMAÇÕES DO SEGUNDO CÉREBRO & CONTEXTO DO CLIENTE ---\n${fullContext}\n-----------------------------------------------------------`;
      }
    }

    // 2. Cria o Stream usando o modelo super-rápido Llama 3 via Groq
    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemContext,
      messages,
    });

    // 3. Envia os fragmentos da resposta (streaming puro)
    result.pipeTextStreamToResponse(res);
  }
}
