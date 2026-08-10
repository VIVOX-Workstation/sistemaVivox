import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from './rag.service';
import { tavily } from '@tavily/core';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

@Injectable()
export class PesquisaService {
  private readonly logger = new Logger(PesquisaService.name);
  private tavilyClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
  ) {
    // Inicializa o Tavily (precisamos de TAVILY_API_KEY no .env)
    this.tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
  }

  /**
   * Roda toda Segunda-Feira às 02:00 da manhã
   * Busca tendências para todos os clientes ativos.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async executarPesquisaSemanal() {
    this.logger.log('Iniciando cron job de Pesquisa de Mercado (Tavily)...');
    
    // Pega todos os clientes ativos com seus segmentos
    const clientes = await this.prisma.cliente.findMany({
      where: { status: 'ATIVO' },
      select: { id: true, nomeFantasia: true, segmento: true }
    });

    for (const cliente of clientes) {
      await this.pesquisarNicho(cliente.id, cliente.segmento);
    }
  }

  async pesquisarNicho(clienteId: string, segmento: string) {
    try {
      this.logger.log(`Buscando tendências para o segmento: ${segmento} (Cliente ID: ${clienteId})`);

      // 1. Fazer a busca inteligente com Tavily (Agente de Pesquisa)
      const query = `Últimas tendências, inovações, estratégias de marketing e notícias do setor de ${segmento} no Brasil`;
      const response = await this.tavilyClient.search(query, {
        searchDepth: 'advanced',
        includeAnswer: true,
        maxResults: 5,
        days: 7 // Foca em notícias recentes
      });

      // 2. Extrair informações da busca
      const searchContext = response.results.map(r => `Fonte: ${r.url}\nConteúdo: ${r.content}`).join('\n\n');

      // 3. Processar o resultado bruto com um LLM para estruturar os dados (JSON Seguro via Zod)
      const { object } = await generateObject({
        model: openai('gpt-4o-mini'), // Modelo barato para processamento
        schema: z.object({
          resumoGeral: z.string().describe('Resumo executivo das tendências e notícias atuais do mercado encontradas.'),
          tendencias: z.array(z.object({
            titulo: z.string(),
            descricao: z.string(),
            impacto: z.string().describe('Como essa tendência impacta o marketing deste cliente.'),
          })).describe('Lista estruturada de 3 a 5 tendências identificadas.'),
        }),
        prompt: `Você é um analista de inteligência de mercado.
Sua missão é analisar os seguintes resultados de pesquisa da web sobre o segmento '${segmento}'.
Extraia um resumo geral e as principais tendências práticas.

RESULTADOS DA PESQUISA:
${searchContext}
${response.answer ? `\nRESUMO DA PESQUISA:\n${response.answer}` : ''}`
      });

      // 4. Salvar no banco relacional para visualização na UI (Aba de Mercado)
      const inteligenciaDb = await this.prisma.inteligenciaMercado.create({
        data: {
          clienteId,
          resumo: object.resumoGeral,
          tendencias: object.tendencias,
          fontes: response.results.map(r => ({ title: r.title, url: r.url })),
        }
      });

      // 5. O SEGREDO DO RAG DINÂMICO: Transformar isso em um vetor para a IA consultar depois!
      const textoVetorizacao = `RESUMO DO MERCADO (${segmento}): ${object.resumoGeral}\n\nTENDÊNCIAS:\n${object.tendencias.map(t => `- ${t.titulo}: ${t.descricao} (Impacto: ${t.impacto})`).join('\n')}`;
      
      await this.ragService.vectorizeText(
        clienteId,
        textoVetorizacao,
        'TENDENCIA_SEMANA',
        `Pesquisa Semanal: Tendências para ${segmento}`
      );

      this.logger.log(`Pesquisa concluída e vetorizada para o cliente ${clienteId}.`);

    } catch (error) {
      this.logger.error(`Erro ao pesquisar tendências para cliente ${clienteId}:`, error);
    }
  }
}
