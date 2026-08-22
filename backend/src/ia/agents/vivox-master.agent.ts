import { Injectable, Logger, Optional } from '@nestjs/common';
import { streamText, generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';
import { PrismaService } from '../../prisma/prisma.service';
import { RagService } from '../rag.service';
import { OpenPanelService } from '../../analytics/openpanel/openpanel.service';

export class GenerateExecutiveReportDto {
  periodo?: string;
  foco?: 'DESEMPENHO_GERAL' | 'OPORTUNIDADES_UPSELL' | 'AUDITORIA_PRODUCOES';
  clienteId?: string;
}

@Injectable()
export class VivoxMasterAgent {
  private readonly logger = new Logger(VivoxMasterAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
    @Optional() private readonly openpanelService?: OpenPanelService,
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

  /**
   * Constrói o System Prompt global com métricas e contexto de todo o ecossistema Vivox
   */
  async buildGlobalSystemPrompt(): Promise<string> {
    const [
      totalClientes,
      todosClientes,
      servicosAtivos,
      producoesRecentes,
      hospedagensAtivas,
      oportunidadesAbertas,
    ] = await Promise.all([
      this.prisma.cliente.count(),
      this.prisma.cliente.findMany({
        select: {
          id: true,
          nomeFantasia: true,
          razaoSocial: true,
          segmento: true,
          status: true,
          gscSiteUrl: true,
          ga4PropertyId: true,
          openpanelProjectId: true,
          openpanelClientId: true,
          openpanelClientSecret: true,
          servicosContratados: {
            select: { tipoServico: true, status: true },
          },
          ativosHospedagem: {
            select: { dominio: true, status: true },
          },
        },
        take: 50,
      }),
      this.prisma.servicoContratado.findMany({
        where: { status: 'ATIVO' },
        select: { tipoServico: true, cliente: { select: { nomeFantasia: true } } },
      }),
      this.prisma.producao.count({
        where: { status: 'EM_PRODUCAO' },
      }),
      this.prisma.ativoHospedagem.count({
        where: { status: 'ATIVO' },
      }),
      this.prisma.oportunidade.findMany({
        where: { status: 'ABERTA' },
        include: { cliente: { select: { nomeFantasia: true } } },
      }),
    ]);

    // Busca métricas reais de OpenPanel para clientes com LP ativa
    const openpanelMetricsMap: Record<string, string> = {};
    if (this.openpanelService) {
      await Promise.all(
        todosClientes
          .filter((c) => Boolean(c.openpanelProjectId))
          .map(async (c) => {
            try {
              const res = await this.openpanelService!.getOpenPanelMetrics(
                c.openpanelProjectId!,
                c.openpanelClientId,
                c.openpanelClientSecret,
                '30d',
              );
              if (res.success && res.overview) {
                const ov = res.overview;
                const durationMin = Math.floor(ov.avgSessionDuration / 60);
                const durationSec = ov.avgSessionDuration % 60;
                const durationFormatted = `${String(durationMin).padStart(2, '0')}:${String(durationSec).padStart(2, '0')}`;
                const whatsappCount = res.whatsappClicks ? res.whatsappClicks.length : 0;
                const whatsappConvRate = ov.totalSessions > 0 ? ((whatsappCount / ov.totalSessions) * 100).toFixed(0) : '0';

                openpanelMetricsMap[c.id] = `Visualizações: ${ov.totalScreenViews} | Sessões: ${ov.totalSessions} | Visitantes Únicos: ${ov.uniqueVisitors} | Duração Média: ${durationFormatted} | Taxa de Rejeição: ${ov.bounceRate}% | Conversões WhatsApp: ${whatsappCount} cliques (${whatsappConvRate}%)`;
              }
            } catch {}
          }),
      );
    }

    const listaClientesFormatada = todosClientes
      .map((c) => {
        const dominios = [
          c.gscSiteUrl ? `Site/GSC: ${c.gscSiteUrl}` : null,
          ...c.ativosHospedagem.map((h) => `Domínio: ${h.dominio}`),
        ]
          .filter(Boolean)
          .join(', ');

        const servicos = c.servicosContratados.map((s) => s.tipoServico).join(', ') || 'Nenhum serviço contratado no momento';
        const openpanelInfo = openpanelMetricsMap[c.id]
          ? `\n  - 📊 Métricas da Landing Page (OpenPanel em Tempo Real): ${openpanelMetricsMap[c.id]}`
          : '';

        return `• **${c.nomeFantasia}** (Status: ${c.status} | Segmento: ${c.segmento})
  - Site/Domínio: ${dominios || 'Não vinculado ainda'}
  - Serviços Contratados: ${servicos}${openpanelInfo}`;
      })
      .join('\n\n');

    return `Você é o **Diretor de Operações & Estrategista Sênior da Vivox**. Você é um membro de liderança da equipe, trabalhando lado a lado com o usuário.

### SEU TOM DE VOZ & COMPORTAMENTO (COMO MEMBRO DA EQUIPE):
1. **Fale como Colega e Líder**: Fale em primeira pessoa do plural ("Temos", "Nosso time", "Nossos clientes"). Seja direto, estratégico, humano e resolutivo.
2. **Dados em Tempo Real de Landing Pages / Sites (OpenPanel)**: Quando perguntado sobre o site, tráfego, landing page, visitantes, rejeição ou conversões de um cliente (como o Kelson), UTILIZE AS MÉTRICAS REAIS fornecidas abaixo.
3. **PROIBIDO LINGUAGEM ROBÓTICA**:
   - NUNCA diga frases como "segundo a base de dados exportada para esta sessão", "não há registros nos códigos internos", "identificação no sistema".
   - NUNCA invente nomes genéricos como "Cliente A", "Código C001".
   - Use SEMPRE os nomes reais das marcas listadas abaixo.
4. **Formatação Impecável & Visualmente Agradável**:
   - Use listas claras com bullet points, negrito para destacar nomes e métricas, e parágrafos curtos e objetivos.
   - Apresente os números de forma agradável e contextualizada com insights de marketing.

--- PORTFÓLIO DE CLIENTES DA VIVOX & MÉTRICAS DE LANDING PAGES ---
${listaClientesFormatada}

--- STATUS OPERACIONAL DA AGÊNCIA ---
- Total de Clientes na Casa: ${totalClientes}
- Produções em Andamento no Kanban: ${producoesRecentes}
- Ativos de Hospedagem Monitorados: ${hospedagensAtivas}
- Oportunidades Comerciais em Aberto: ${oportunidadesAbertas.length} (${oportunidadesAbertas.map((o) => `${o.cliente.nomeFantasia}: ${o.servicoSugerido}`).join(', ')})
--------------------------------------`;
  }

  /**
   * Executa o chat global do assistente com streaming
   */
  async chatStream(messages: any[]): Promise<any> {
    const systemPrompt = await this.buildGlobalSystemPrompt();
    const model = this.getModel();

    return streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.6,
    });
  }

  /**
   * Gera um relatório executivo de alta densidade analítica
   */
  async generateExecutiveReport(dto: GenerateExecutiveReportDto) {
    const model = this.getModel();
    let systemPrompt = '';
    let prompt = '';

    if (dto.clienteId) {
      // Relatório focado em 1 cliente específico
      systemPrompt = await this.ragService.getFullClientContext(dto.clienteId);
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: dto.clienteId },
        include: {
          servicosContratados: true,
          publicacoes: { orderBy: { dataPublicacao: 'desc' }, take: 10 },
          analyticsSnapshots: { orderBy: { periodoFim: 'desc' }, take: 2 },
          oportunidades: true,
        },
      });

      prompt = `GERE UM RELATÓRIO EXECUTIVO DE PERFORMANCE & MARKETING PARA O CLIENTE: **${cliente?.nomeFantasia}**.
Período de Referência: ${dto.periodo || 'Mês Atual'}
Foco da Análise: ${dto.foco || 'DESEMPENHO_GERAL'}

Estrutura Obrigatória do Relatório:
# 📊 Relatório Executivo — ${cliente?.nomeFantasia}
## 1. 🎯 Resumo Executivo & Status da Conta
## 2. 🚀 Principais Entregas & Produções Realizadas
## 3. 📈 Análise de Métricas & Engajamento
## 4. ⚠️ Pontos de Atenção & Desafios
## 5. 💡 Oportunidades de Crescimento & Próximos Passos Recomendados

Seja preciso, embasado e use formatação Markdown elegante com tabelas e listas onde couber.`;
    } else {
      // Relatório global da agência
      systemPrompt = await this.buildGlobalSystemPrompt();
      prompt = `GERE UM RELATÓRIO EXECUTIVO GLOBAL DA AGÊNCIA VIVOX.
Período de Referência: ${dto.periodo || 'Panorama Atual'}
Foco da Análise: ${dto.foco || 'DESEMPENHO_GERAL'}

Estrutura Obrigatória:
# 🏛️ Relatório Estratégico Global — Vivox
## 1. 🌐 Visão Geral do Portfólio de Clientes
## 2. ⚡ Ritmo Operacional & Produções
## 3. 🔍 Oportunidades Comerciais Mapeadas (Upsell / Cross-sell)
## 4. 📋 Plano de Ação & Recomendações para a Diretoria`;
    }

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt,
      temperature: 0.6,
    });

    return {
      clienteId: dto.clienteId || null,
      foco: dto.foco || 'DESEMPENHO_GERAL',
      relatorioMarkdown: text,
      geradoEm: new Date().toISOString(),
    };
  }
}
