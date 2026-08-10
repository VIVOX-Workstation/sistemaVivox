import { Controller, Get, Post, Param, NotFoundException, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from './rag.service';
import { generateObject, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

@Controller('ia')
export class IaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService
  ) {}

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

    // 2. Schema Zod obrigando a IA a gerar uma Árvore (Tree) para o react-d3-tree
    // Usamos um schema simples com no máximo 3 níveis para evitar complexidade excessiva
    const schema = z.object({
      name: z.string().describe('O nó raiz, ex: Planejamento Estratégico'),
      children: z.array(z.object({
        name: z.string().describe('Nome da categoria ou pilar'),
        children: z.array(z.object({
          name: z.string().describe('Ação ou detalhe específico')
        })).optional()
      })).optional()
    });

    // 3. Gerar o JSON Estruturado Perfeito
    const { object } = await generateObject({
      model: openai('gpt-4o'), 
      schema,
      prompt: `Você é um Estrategista Especialista em Marketing e Operações.
O usuário quer montar um Mapa Mental Estratégico para um cliente.

Aqui está toda a inteligência e contexto do cliente e do mercado recuperados pela nossa IA:
${contextText}

Gere um mapa mental claro e categorizado. O nó principal deve ser o foco da estratégia.
Os filhos diretos devem ser os pilares (ex: Marketing, Operacional, Vendas).
Os netos devem ser as ações práticas baseadas nas tendências e no contexto fornecido.`
    });

    return object;
  }

  @Post('chat')
  async chat(@Req() req: any, @Res() res: any) {
    const { messages, clienteId } = req.body;
    
    // Pega a última pergunta do usuário
    const lastMessage = messages[messages.length - 1];

    let systemContext = `Você é um Consultor Estratégico especialista no negócio do cliente.
Seja direto, profissional e altamente criativo.`;

    if (clienteId) {
      // 1. RAG: Busca contexto na base de vetores usando a última pergunta
      const contextMatches = await this.ragService.searchContext(
        clienteId,
        lastMessage.content,
        8 // Quantidade de chunks
      );
      
      if (contextMatches.length > 0) {
        const fontes = contextMatches.map(m => `[TIPO: ${m.tipo}] ${m.titulo ? m.titulo + ' - ' : ''}${m.conteudo}`).join('\n\n');
        systemContext += `\n\nAbaixo está o contexto recuperado da base de inteligência (referências passadas, anotações, tendências de mercado).\nBaseie sua resposta nesses dados sempre que aplicável:\n\n${fontes}`;
      }
    }

    // 2. Cria o Stream usando o modelo GPT-4o-mini (ou gpt-4o se preferir mais inteligência)
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemContext,
      messages,
    });

    // 3. Envia os fragmentos da resposta (streaming) de volta para o cliente React
    // @ts-ignore
    if (result.pipeDataStreamToResponse) {
      // @ts-ignore
      result.pipeDataStreamToResponse(res);
    } else {
      result.pipeTextStreamToResponse(res);
    }
  }
}
