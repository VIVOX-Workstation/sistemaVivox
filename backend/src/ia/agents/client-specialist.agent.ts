import { Injectable, Logger } from '@nestjs/common';
import { streamText, generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';
import { PrismaService } from '../../prisma/prisma.service';
import { RagService } from '../rag.service';

export type MarketingContentType = 'REELS' | 'CAROUSEL' | 'COPY_ADS' | 'CALENDAR';

export class GenerateContentDto {
  clienteId: string;
  tipo: MarketingContentType;
  tema: string;
  objetivo?: string;
  formatoEspecifico?: string;
  instrucoesExtras?: string;
}

@Injectable()
export class ClientSpecialistAgent {
  private readonly logger = new Logger(ClientSpecialistAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
  ) {}

  private getModel() {
    if (process.env.GROQ_API_KEY) {
      return groq('openai/gpt-oss-120b');
    }
    if (process.env.OPENAI_API_KEY) {
      return openai('gpt-4o-mini');
    }
    return groq('openai/gpt-oss-120b');
  }

  async buildSystemPrompt(clienteId: string): Promise<string> {
    const context = await this.ragService.getFullClientContext(clienteId);
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { nomeFantasia: true, segmento: true },
    });

    const marca = cliente?.nomeFantasia || 'Cliente';
    const segmento = cliente?.segmento || 'Mercado Geral';

    return `Você é o **Diretor de Criação & Estrategista Chefe de Marketing** dedicado exclusivamente à marca **${marca}** (Segmento: ${segmento}).

Sua missão é atuar como o cérebro criativo e estratégico da Vivox para este cliente, gerando ideias de alto impacto, roteiros envolventes, copies persuasivas e planejamento de conteúdo direcionado ao público-alvo.

### REGRAS E DIRETRIZES DE ATUAÇÃO:
1. **Especialista no Negócio**: Use terminologias corretas do setor, respeite o tom de voz da marca e considere o posicionamento no mercado.
2. **Foco em Resultados**: Sempre justifique as decisões criativas com base no funil de marketing (Atração, Nutrição ou Conversão).
3. **Formatos Prontos para Uso**:
   - Ao criar **Roteiros de Vídeo/Reels**: Divida claramente em [Gancho Visual/Falado 0-3s], [Retenção 4-15s], [Desenvolvimento de Valor], [CTA Claro]. Inclua orientações de cena/gravação entre colchetes.
   - Ao criar **Carrosséis**: Estruture slide a slide: [Slide 1: Capa com Headline Magnética], [Slides 2-5: Conteúdo Escaneável], [Slide Final: CTA de Salvamento/Compartilhamento], seguido da **Legenda Completa com Hashtags Estratégicas**.
   - Ao criar **Copies para Anúncios**: Aplique frameworks como AIDA (Atenção, Interesse, Desejo, Ação) ou PAS (Problema, Agitação, Solução).
   - Ao criar **Pautas/Calendário**: Defina os Pilares de Conteúdo (ex: Autoridade, Conexão, Educação, Venda).
4. **Sem enrolação**: Seja prático, criativo e entregue materiais prontos para a equipe de produção e design executar.
5. **Idioma**: Responda sempre em Português do Brasil com excelente redação publicitária.

--- INFORMAÇÕES DO CLIENTE, BRIEFINGS & SEGUNDO CÉREBRO ---
${context}
-----------------------------------------------------------`;
  }

  async chatStream(clienteId: string, messages: any[]): Promise<any> {
    const systemPrompt = await this.buildSystemPrompt(clienteId);
    const model = this.getModel();

    return streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });
  }

  async generateMarketingContent(dto: GenerateContentDto) {
    const systemPrompt = await this.buildSystemPrompt(dto.clienteId);
    const model = this.getModel();

    let taskInstruction = '';

    switch (dto.tipo) {
      case 'REELS':
        taskInstruction = `CRIE UM ROTEIRO COMPLETO PARA REELS / TIKTOK / SHORTS:
Tema: "${dto.tema}"
Objetivo: ${dto.objetivo || 'Engajamento e Atração de Seguidores'}
${dto.formatoEspecifico ? `Formato Desejado: ${dto.formatoEspecifico}` : ''}
${dto.instrucoesExtras ? `Instruções Extras: ${dto.instrucoesExtras}` : ''}

Estrutura obrigatória:
1. **Título do Conteúdo & Pilar Estratégico**
2. **Gancho (0-3s)**: O que o apresentador faz/fala na abertura para reter a atenção.
3. **Roteiro Cena a Cena**:
   - [Câmera / Ação visual]
   - Fala do Apresentador (Áudio)
   - Texto na Tela (GC)
4. **Chamada para Ação (CTA)**
5. **Sugestão de Trilha/Áudio e Legenda com Hashtags**`;
        break;

      case 'CAROUSEL':
        taskInstruction = `CRIE UM CARROSSEL COMPLETO PARA O INSTAGRAM:
Tema: "${dto.tema}"
Objetivo: ${dto.objetivo || 'Educação e Salvamento'}
${dto.formatoEspecifico ? `Formato Desejado: ${dto.formatoEspecifico}` : ''}
${dto.instrucoesExtras ? `Instruções Extras: ${dto.instrucoesExtras}` : ''}

Estrutura obrigatória:
1. **Conceito & Ângulo do Carrossel**
2. **Slide a Slide (Do Slide 1 ao Slide Final)**:
   - Para cada slide: [Título / Headline Principal] + [Texto Curto de Apoio] + [Sugestão Visual para o Designer]
3. **Legenda Completa**: Texto envolvente de acompanhamento, com quebra de linhas e emojis moderados.
4. **Hashtags Estratégicas**: Selecionadas para o nicho da marca.`;
        break;

      case 'COPY_ADS':
        taskInstruction = `CRIE UMA COPY DE ANÚNCIO (META ADS / GOOGLE ADS) DE ALTA CONVERSÃO:
Tema / Oferta: "${dto.tema}"
Objetivo: ${dto.objetivo || 'Captação de Leads / Venda Direta'}
${dto.formatoEspecifico ? `Formato Desejado: ${dto.formatoEspecifico}` : ''}
${dto.instrucoesExtras ? `Instruções Extras: ${dto.instrucoesExtras}` : ''}

Estrutura obrigatória:
1. **Público & Dor Explorada**
2. **Variação 1 (Framework AIDA)**: Headline + Corpo + CTA
3. **Variação 2 (Framework PAS - Problema, Agitação, Solução)**: Headline + Corpo + CTA
4. **Sugestões de Criativo Visual**: Ideias de imagem ou vídeo estático para acompanhar a copy.`;
        break;

      case 'CALENDAR':
        taskInstruction = `CRIE UMA GRADE DE PAUTAS ESTRATÉGICAS DE CONTEÚDO (4 A 6 IDEIAS DE POSTS):
Tema / Foco do Mês: "${dto.tema}"
Objetivo: ${dto.objetivo || 'Crescimento e Autoridade de Marca'}
${dto.formatoEspecifico ? `Formato Desejado: ${dto.formatoEspecifico}` : ''}
${dto.instrucoesExtras ? `Instruções Extras: ${dto.instrucoesExtras}` : ''}

Para cada post sugerido, forneça:
- **Formato**: (Reels / Carrossel / Post Estático / Story Interativo)
- **Pilar**: (Autoridade / Conexão / Educativo / Venda)
- **Título & Gancho**
- **Resumo do Conteúdo & CTA**`;
        break;
    }

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: taskInstruction,
      temperature: 0.7,
    });

    return {
      clienteId: dto.clienteId,
      tipo: dto.tipo,
      tema: dto.tema,
      conteudoGerado: text,
      geradoEm: new Date().toISOString(),
    };
  }
}
