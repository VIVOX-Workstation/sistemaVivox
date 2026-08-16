import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from './rag.service';
import { tavily } from '@tavily/core';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';

@Injectable()
export class PesquisaService {
  private readonly logger = new Logger(PesquisaService.name);
  private tavilyClient: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
  ) {
    this.tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
  }

  /**
   * Roda diariamente às 06:00 da manhã
   * Busca tendências para todos os clientes ativos.
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async executarPesquisaDiaria() {
    this.logger.log('Iniciando cron job diário de Pesquisa de Mercado (Tavily + Groq)...');
    
    const clientes = await this.prisma.cliente.findMany({
      where: { status: 'ATIVO' },
      select: { id: true, nomeFantasia: true, segmento: true }
    });

    for (const cliente of clientes) {
      await this.pesquisarNicho(cliente.id, cliente.segmento);
    }
  }

  async pesquisarNicho(clienteId: string, segmentoParam?: string) {
    try {
      // 1. Busca os dados reais e profundos do cliente e do 2º Cérebro no banco
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: clienteId },
        include: {
          fontesContexto: true,
          servicosContratados: {
            include: { planejamento: true }
          }
        }
      });

      const nomeCliente = cliente?.nomeFantasia || 'Cliente';
      const segmento = cliente?.segmento || segmentoParam || 'Negócios';
      const observacoes = cliente?.observacoes || '';
      const fontesDoCerebro = cliente?.fontesContexto?.map(f => `• [${f.tipo}] ${f.titulo}: ${f.descricao || ''}`).join('\n') || '';

      this.logger.log(`Analisando 2º Cérebro para: ${nomeCliente} (${segmento})`);

      // 2. A IA LÊ O 2º CÉREBRO e descobre a especialidade exata para gerar a busca cirúrgica
      const { text: queryRaw } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: 'Você é um pesquisador de tendências. Responda APENAS com termos de busca (4 a 6 palavras-chave) para o Google/Tavily, sem aspas, sem pontuação extra.',
        prompt: `Descubra a especialidade real e nicho do cliente através dos dados do Segundo Cérebro:
Nome: ${nomeCliente}
Segmento registrado: ${segmento}
Anotações: ${observacoes}
Segundo Cérebro:
${fontesDoCerebro}

Gere uma frase de busca no Google focada em descobrir as principais novidades, dúvidas de clientes, polêmicas e tratamentos/serviços em alta para essa especialidade específica no Brasil em 2025/2026.
(Ex: Se for pediatra, retorne: pediatria cuidados bebe introducao alimentar sono saude infantil 2026)`
      });

      const searchTerms = queryRaw.replace(/["\n\r]/g, '').trim() || `${segmento} novidades duvidas 2026 Brasil`;
      this.logger.log(`Termos de busca gerados para o Tavily: "${searchTerms}"`);

      // 3. Busca no Tavily com os termos refinados da especialidade
      const response = await this.tavilyClient.search(searchTerms, {
        searchDepth: 'advanced',
        includeAnswer: true,
        maxResults: 6,
        days: 30
      });

      const searchContext = response.results
        .map((r: any) => `Fonte: ${r.url}\nTítulo: ${r.title}\nConteúdo: ${r.content}`)
        .join('\n\n');

      // 4. Processar com Llama 3 (Groq) com foco TOTAL na especialidade real
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: `Você é o Estrategista de Conteúdo e Diretor Criativo exclusivo de "${nomeCliente}".
Sua função é transformar notícias e o conhecimento do Segundo Cérebro em temas de conteúdo magnéticos e irresistíveis para o público-alvo deste profissional.
Responda SEMPRE E EXCLUSIVAMENTE em formato JSON válido, sem tags markdown como \`\`\`json.`,
        prompt: `Crie 3 a 5 TEMAS PRÁTICOS DE ALTO ENGAJAMENTO E RETENÇÃO para "${nomeCliente}".

DADOS E ESPECIALIDADE (DO SEGUNDO CÉREBRO):
- Nome: ${nomeCliente}
- Área/Especialidade: ${segmento}
- Segundo Cérebro (Fontes e Temas cadastrados):
${fontesDoCerebro}

NOTÍCIAS E PESQUISAS DA WEB SOBRE O SETOR:
${searchContext}
${response.answer ? `\nRESUMO TAVILY:\n${response.answer}` : ''}

⚠️ REGRAS MANDATÓRIAS:
1. FOCO TOTAL NA ESPECIALIDADE REAL (Ex: Se for Pediatria, os temas devem ser sobre bebês, mães, crianças, desenvolvimento, alimentação, etc.).
2. NUNCA use temas genéricos de segurança, TI, desafios virais ou lives.
3. Crie Ganchos (Hooks) impossíveis de ignorar nos primeiros 3 segundos.

Formato JSON Obrigatório:
{
  "resumoGeral": "Resumo do que os clientes e pacientes de ${nomeCliente} mais estão buscando e com dúvidas no momento.",
  "tendencias": [
    {
      "titulo": "Tema específico e magnético do nicho",
      "descricao": "Explicação clara e prática sobre o tema",
      "formato": "Reels / Carrossel 5 Lâminas / Stories Interativo / Vídeo Falado",
      "gancho": "Frase de impacto real para prender o público nos primeiros 3 segundos",
      "impacto": "Por que esse tema atrai o público ideal e gera autoridade para ${nomeCliente}"
    }
  ]
}`
      });

      let object: { resumoGeral: string; tendencias: any[] };
      try {
        const cleaned = text.replace(/```json\n?|```/g, '').trim();
        object = JSON.parse(cleaned);
      } catch {
        object = {
          resumoGeral: response.answer || `Temas em destaque para ${nomeCliente}.`,
          tendencias: response.results.slice(0, 3).map((r: any) => ({
            titulo: r.title || `Destaque do Setor`,
            descricao: r.content?.substring(0, 150) || 'Assunto em alta no nicho.',
            formato: 'Reels / Post Educativo',
            gancho: `Você já sabia dessa novidade importante?`,
            impacto: `Posiciona ${nomeCliente} como autoridade no assunto.`,
          }))
        };
      }

      // 3. Salvar no banco relacional
      const inteligenciaDb = await this.prisma.inteligenciaMercado.create({
        data: {
          clienteId,
          resumo: object.resumoGeral,
          tendencias: object.tendencias,
          fontes: response.results.map((r: any) => ({ title: r.title, url: r.url })),
        }
      });

      // 4. Salvar também como Fonte & Contexto no Segundo Cérebro
      try {
        await this.prisma.fonteContexto.create({
          data: {
            clienteId,
            titulo: `Radar de Mercado (${new Date().toLocaleDateString('pt-BR')}): ${segmento}`,
            descricao: `${object.resumoGeral}\n\nTop Temas: ${object.tendencias.map(t => `${t.titulo} (${t.formato}) - Gancho: ${t.gancho}`).join(' | ')}`,
            tipo: 'LINK',
          }
        });
      } catch (e) {
        this.logger.warn('Não foi possível duplicar como fonte de contexto, continuando...');
      }

      this.logger.log(`Pesquisa de mercado concluída e registrada para o cliente ${clienteId}.`);
      return inteligenciaDb;

    } catch (error) {
      this.logger.error(`Erro ao pesquisar tendências com Tavily para cliente ${clienteId}:`, error);
      throw error;
    }
  }
}
