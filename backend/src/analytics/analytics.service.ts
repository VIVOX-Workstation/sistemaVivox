import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateMetricaDto } from './dto/create-analytics.dto';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthService } from './google/google-auth.service';
import { GA4Service } from './google/ga4.service';
import { GSCService } from './google/gsc.service';
import { AnalyticsCacheService } from './google/analytics-cache.service';
import { GoogleDashboardResult, GA4MetricsResult, GSCMetricsResult } from './google/interfaces';
import { OpenPanelService } from './openpanel/openpanel.service';
import { OpenPanelDashboardResult } from './openpanel/interfaces';
import { InstagramAuthService } from './instagram/instagram-auth.service';
import { InstagramDirectAuthService } from './instagram/instagram-direct-auth.service';
import { InstagramService, InstagramPeriodInput } from './instagram/instagram.service';
import { InstagramDashboardData } from './instagram/interfaces';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    private googleAuth: GoogleAuthService,
    private ga4Service: GA4Service,
    private gscService: GSCService,
    private cacheService: AnalyticsCacheService,
    private openpanelService: OpenPanelService,
    private instagramAuth: InstagramAuthService,
    private instagramDirectAuth: InstagramDirectAuthService,
    private instagramService: InstagramService,
  ) {}

  async saveSnapshot(dto: CreateMetricaDto) {
    const existing = await this.prisma.analyticsSnapshot.findFirst({
      where: { 
        clienteId: dto.clienteId, 
        periodoInicio: dto.periodoInicio,
        origem: dto.origem
      },
    });

    if (existing) {
      return this.prisma.analyticsSnapshot.update({
        where: { id: existing.id },
        data: dto as any,
      });
    }

    return this.prisma.analyticsSnapshot.create({
      data: dto as any,
    });
  }

  async getResultados(clienteId: string) {
    const snapshots = await this.prisma.analyticsSnapshot.findMany({
      where: { clienteId },
      orderBy: { periodoInicio: 'desc' },
      take: 12,
    });

    const servicos = await this.prisma.servicoContratado.findMany({
      where: { clienteId },
    });

    let oportunidades: any[] = (await this.prisma.oportunidade.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' }
    })).map(o => ({ ...o, origem: 'persistida' as const }));

    // Calcula on-the-fly se não houver no banco (MVP Automático)
    if (oportunidades.length === 0) {
      const todosTipos = [
        'GERENCIAMENTO_REDES', 'FOLDER', 'REVISTA', 'LANDING_PAGE', 
        'APP', 'FOTOGRAFIA', 'VIDEO', 'TRAFEGO_PAGO', 'IDENTIDADE_VISUAL'
      ];
      
      const servicosAtivos = servicos.map(s => s.tipoServico);
      const faltantes = todosTipos.filter(t => !servicosAtivos.includes(t as any));
      
      oportunidades = faltantes.map((tipo, idx) => ({
        id: `mock-${idx}`,
        clienteId,
        servicoSugerido: tipo as any,
        justificativa: `O cliente possui engajamento potencial mas ainda não utiliza o serviço de ${tipo.replace(/_/g, ' ')}.`,
        status: 'ABERTA' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        origem: 'calculada' as const,
      }));
    }

    return {
      servicos,
      snapshot: snapshots.length > 0 ? snapshots[0] : null,
      oportunidades
    };
  }

  /**
   * Retorna informações da Service Account configurada no backend
   */
  getServiceAccountInfo() {
    const isConfigured = this.googleAuth.isConfigured();
    const clientEmail = this.googleAuth.getServiceAccountEmail();

    return {
      configured: isConfigured,
      clientEmail,
    };
  }

  /**
   * Retorna o dashboard consolidado de Google Analytics 4 e Google Search Console para um cliente
   */
  async getGoogleDashboard(
    clienteId: string,
    days: number = 30,
    forceRefresh: boolean = false,
  ): Promise<GoogleDashboardResult> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nomeFantasia: true,
        ga4PropertyId: true,
        gscSiteUrl: true,
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado.`);
    }

    const startDate = `${days}daysAgo`;
    const endDate = 'today';
    const cacheKey = `cliente_${clienteId}_${days}d`;

    // Verifica cache caso não seja forçado refresh
    if (!forceRefresh) {
      const cached = this.cacheService.get<GoogleDashboardResult>(cacheKey);
      if (cached) {
        return {
          ...cached.data,
          cachedAt: cached.cachedAt,
        };
      }
    }

    const serviceAccountInfo = this.getServiceAccountInfo();

    // Consulta paralela GA4 e Search Console
    const [ga4Result, gscResult] = await Promise.all([
      cliente.ga4PropertyId
        ? this.ga4Service.getGA4Metrics(cliente.ga4PropertyId, startDate, endDate)
        : Promise.resolve<GA4MetricsResult>({
            success: false,
            propertyId: '',
            configured: false,
            error: 'ID de propriedade do Google Analytics 4 (GA4) não configurado para este cliente.',
          }),
      cliente.gscSiteUrl
        ? this.gscService.getSearchConsoleMetrics(cliente.gscSiteUrl, startDate, 'yesterday')
        : Promise.resolve<GSCMetricsResult>({
            success: false,
            siteUrl: '',
            configured: false,
            error: 'URL do site no Google Search Console não configurada para este cliente.',
          }),
    ]);

    const result: GoogleDashboardResult = {
      clienteId: cliente.id,
      clienteNome: cliente.nomeFantasia,
      periodo: {
        startDate,
        endDate,
        days,
      },
      serviceAccount: serviceAccountInfo,
      ga4: ga4Result,
      gsc: gscResult,
    };

    // Salva em cache por 1 hora (3600 segundos)
    this.cacheService.set(cacheKey, result, 3600);

    return result;
  }

  /**
   * Endpoint de teste para validar conectividade com GA4 ou Search Console
   */
  async testGoogleConnection(dto: { propertyId?: string; siteUrl?: string; days?: number }) {
    const days = dto.days || 30;
    const startDate = `${days}daysAgo`;
    const results: { ga4?: GA4MetricsResult; gsc?: GSCMetricsResult; serviceAccount: any } = {
      serviceAccount: this.getServiceAccountInfo(),
    };

    if (dto.propertyId) {
      results.ga4 = await this.ga4Service.getGA4Metrics(dto.propertyId, startDate, 'today');
    }

    if (dto.siteUrl) {
      results.gsc = await this.gscService.getSearchConsoleMetrics(dto.siteUrl, startDate, 'yesterday');
    }

    return results;
  }

  /**
   * Salva configurações de GA4 e Search Console diretamente para o cliente
   */
  async updateClienteGoogleConfig(
    clienteId: string,
    dto: { ga4PropertyId?: string; gscSiteUrl?: string },
  ) {
    const updated = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        ga4PropertyId: dto.ga4PropertyId !== undefined ? dto.ga4PropertyId.trim() || null : undefined,
        gscSiteUrl: dto.gscSiteUrl !== undefined ? dto.gscSiteUrl.trim() || null : undefined,
      },
    });

    // Invalida cache do cliente
    this.cacheService.invalidateCliente(clienteId);

    return updated;
  }

  /**
   * Retorna o dashboard de tráfego do OpenPanel para um cliente
   */
  async getOpenPanelDashboard(
    clienteId: string,
    range: string = '30d',
    forceRefresh: boolean = false,
  ): Promise<OpenPanelDashboardResult> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nomeFantasia: true,
        openpanelProjectId: true,
        openpanelClientId: true,
        openpanelClientSecret: true,
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado.`);
    }

    const cacheKey = `cliente_${clienteId}_op_${range}`;

    if (!forceRefresh) {
      const cached = this.cacheService.get<OpenPanelDashboardResult>(cacheKey);
      if (cached) {
        return {
          ...cached.data,
          cachedAt: cached.cachedAt,
        };
      }
    }

    const openpanel = cliente.openpanelProjectId
      ? await this.openpanelService.getOpenPanelMetrics(
          cliente.openpanelProjectId,
          cliente.openpanelClientId,
          cliente.openpanelClientSecret,
          range,
        )
      : {
          success: false,
          projectId: '',
          configured: false,
          error: 'ID do Projeto OpenPanel não configurado para este cliente.',
        };

    const result: OpenPanelDashboardResult = {
      clienteId: cliente.id,
      clienteNome: cliente.nomeFantasia,
      range,
      openpanel,
    };

    this.cacheService.set(cacheKey, result, 3600);

    return result;
  }

  /**
   * Salva o ID do Projeto e as credenciais (Client ID / Client Secret) do OpenPanel do cliente.
   * Client ID e Client Secret só são atualizados quando enviados (não vêm de volta ao
   * frontend), permitindo trocar o Project ID sem reenviar/expor as credenciais salvas.
   */
  async updateClienteOpenPanelConfig(
    clienteId: string,
    dto: { openpanelProjectId?: string; openpanelClientId?: string; openpanelClientSecret?: string },
  ) {
    const updated = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        openpanelProjectId: dto.openpanelProjectId !== undefined ? dto.openpanelProjectId.trim() || null : undefined,
        openpanelClientId: dto.openpanelClientId !== undefined ? dto.openpanelClientId.trim() || null : undefined,
        openpanelClientSecret:
          dto.openpanelClientSecret !== undefined ? dto.openpanelClientSecret.trim() || null : undefined,
      },
      omit: { openpanelClientSecret: true },
    });

    this.cacheService.invalidateCliente(clienteId);

    return updated;
  }

  /**
   * Resumo executivo consolidado da agência para a tela principal do Dashboard
   */
  async getDashboardExecutivo() {
    const [
      totalClientes,
      clientesAtivos,
      clientesProspects,
      clientesPausados,
      totalServicosAtivos,
      totalProducoesEmAndamento,
      radarHospedagens,
      ultimosClientes,
      totalOportunidades,
    ] = await Promise.all([
      this.prisma.cliente.count(),
      this.prisma.cliente.count({ where: { status: 'ATIVO' } }),
      this.prisma.cliente.count({ where: { status: 'PROSPECT' } }),
      this.prisma.cliente.count({ where: { status: 'PAUSADO' } }),
      this.prisma.servicoContratado.count({ where: { status: 'ATIVO' } }),
      this.prisma.producao.count({ where: { status: { in: ['EM_PRODUCAO', 'EM_REVISAO'] } } }),
      this.getRadarHospedagensResumo(),
      this.prisma.cliente.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nomeFantasia: true,
          segmento: true,
          status: true,
          ga4PropertyId: true,
          gscSiteUrl: true,
          openpanelProjectId: true,
          logoUrl: true,
          createdAt: true,
          responsavel: {
            select: { nome: true },
          },
          _count: {
            select: {
              servicosContratados: true,
              ativosHospedagem: true,
            },
          },
        },
      }),
      this.prisma.oportunidade.count({ where: { status: 'ABERTA' } }),
    ]);

    return {
      clientes: {
        total: totalClientes,
        ativos: clientesAtivos,
        prospects: clientesProspects,
        pausados: clientesPausados,
      },
      servicos: {
        ativos: totalServicosAtivos,
        producoesEmAndamento: totalProducoesEmAndamento,
        oportunidadesAbertas: totalOportunidades,
      },
      landingPages: radarHospedagens,
      ultimosClientes,
    };
  }

  private async getRadarHospedagensResumo() {
    const agora = new Date();
    const todos = await this.prisma.ativoHospedagem.findMany({
      where: {
        status: { in: ['ATIVO', 'PENDENTE_RENOVACAO'] },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nomeFantasia: true,
          },
        },
      },
    });

    let criticos7Dias = 0;
    let atencao30Dias = 0;
    let emDia = 0;

    const enriquecidos = todos.map(item => {
      let diasRestantes: number | null = null;
      if (item.dataExpiracaoDominio) {
        diasRestantes = Math.ceil(
          (new Date(item.dataExpiracaoDominio).getTime() - agora.getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      let nivelUrgencia: 'CRITICO' | 'ATENCAO' | 'EM_DIA' | 'SEM_DATA' = 'SEM_DATA';
      if (diasRestantes !== null) {
        if (diasRestantes <= 7) {
          nivelUrgencia = 'CRITICO';
          criticos7Dias++;
        } else if (diasRestantes <= 30) {
          nivelUrgencia = 'ATENCAO';
          atencao30Dias++;
        } else {
          nivelUrgencia = 'EM_DIA';
          emDia++;
        }
      }

      return {
        ...item,
        diasRestantes,
        nivelUrgencia,
      };
    });

    enriquecidos.sort((a, b) => {
      const dA = a.diasRestantes !== null ? a.diasRestantes : 9999;
      const dB = b.diasRestantes !== null ? b.diasRestantes : 9999;
      return dA - dB;
    });

    return {
      total: todos.length,
      criticos7Dias,
      atencao30Dias,
      emDia,
      proximosVencimentos: enriquecidos.filter(e => e.nivelUrgencia !== 'SEM_DATA').slice(0, 6),
    };
  }

  /**
   * Retorna a URL para o cliente autorizar a conta do Instagram / Facebook
   */
  getInstagramAuthUrl(clienteId: string, redirectUri?: string) {
    return {
      url: this.instagramAuth.getAuthUrl(clienteId, redirectUri),
    };
  }

  /**
   * Retorna a URL para o cliente autorizar o Instagram Business Login diretamente
   */
  getInstagramDirectAuthUrl(clienteId: string, redirectUri?: string) {
    return {
      url: this.instagramDirectAuth.getAuthUrl(clienteId, redirectUri),
    };
  }

  /**
   * Processa o callback da Meta com o code, troca por token de longa duração,
   * descobre a conta do Instagram vinculada à página e salva no cliente.
   */
  async handleInstagramCallback(clienteId: string, code: string, redirectUri?: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado.`);
    }

    // 1. Troca o code pelo Long-Lived Token (60 dias)
    const longLivedToken = await this.instagramAuth.exchangeCodeForLongLivedToken(code, redirectUri);

    // 2. Busca as Páginas e Contas do Instagram conectadas
    const pages = await this.instagramAuth.getConnectedPagesAndInstagram(longLivedToken);

    if (!pages || pages.length === 0) {
      throw new NotFoundException(
        'Nenhuma página do Facebook encontrada para esta conta de usuário. Certifique-se de ser administrador de uma página vinculada.',
      );
    }

    // Filtra páginas que possuem conta profissional do Instagram
    const pagesWithIg = pages.filter((p) => p.instagram_business_account?.id);

    if (pagesWithIg.length === 0) {
      // Limpa qualquer token anterior para garantir estado 100% limpo
      await this.prisma.cliente.update({
        where: { id: clienteId },
        data: {
          metaAccessToken: null,
          facebookPageId: null,
          instagramAccountId: null,
          instagramUsername: null,
        },
      });

      const pageNames = pages.map((p) => `"${p.name}"`).join(', ');
      return {
        success: false,
        warning: true,
        message: `As Páginas autorizadas (${pageNames}) não possuem uma conta Profissional (Comercial ou Criador) do Instagram vinculada. Ao fazer login no Facebook, clique em "Editar configurações" / "Editar opções anteriores" para selecionar a Página correta, ou vincule a conta no aplicativo do Instagram em Configurações > Conta > Compartilhar em outros aplicativos > Facebook.`,
        pages: pages.map((p) => ({ id: p.id, name: p.name, hasInstagram: false })),
      };
    }

    // Se houver múltiplas contas, seleciona a primeira por padrão mas avisa que pode escolher
    const pageWithIg = pagesWithIg[0];
    const igAccount = pageWithIg.instagram_business_account!;

    // 3. Atualiza o cadastro do cliente com os dados do Instagram
    const updatedCliente = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        metaAccessToken: longLivedToken,
        facebookPageId: pageWithIg.id,
        instagramAccountId: igAccount.id,
        instagramUsername: igAccount.username || null,
      },
    });

    return {
      success: true,
      multiple: pagesWithIg.length > 1,
      totalAccounts: pagesWithIg.length,
      clienteId: updatedCliente.id,
      instagramAccountId: igAccount.id,
      instagramUsername: igAccount.username,
      pageName: pageWithIg.name,
    };
  }

  /**
   * Processa o callback da Meta via Direct Login, troca por token longo e salva os dados
   */
  async handleInstagramDirectCallback(clienteId: string, code: string, redirectUri?: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado.`);
    }

    try {
      // 1. Troca code pelo token longo e recupera o user_id (Instagram Account ID)
      const tokenResponse = await this.instagramDirectAuth.exchangeCodeForToken(code, redirectUri);
      
      let instagramAccountId = tokenResponse.user_id;
      let instagramUsername: string | null = null;

      // 2. Tenta recuperar o username do perfil
      try {
        const profile = await this.instagramDirectAuth.getProfile(tokenResponse.access_token);
        instagramAccountId = profile.id;
        instagramUsername = profile.username;
      } catch (e) {
        this.logger.warn(`Não foi possível recuperar o perfil inicial para o cliente ${clienteId}. Usando o user_id do token.`, e);
      }

      // 3. Atualiza cliente com os dados do Instagram direto
      const updatedCliente = await this.prisma.cliente.update({
        where: { id: clienteId },
        data: {
          metaAccessToken: tokenResponse.access_token,
          facebookPageId: null, // Sem vínculo com página neste fluxo
          instagramAccountId: instagramAccountId,
          instagramUsername: instagramUsername,
          metaAuthMethod: 'INSTAGRAM',
        },
      });

      return {
        success: true,
        clienteId: updatedCliente.id,
        instagramAccountId: instagramAccountId,
        instagramUsername: instagramUsername,
      };
    } catch (err: any) {
      this.logger.error(`Erro ao processar callback direto do Instagram para ${clienteId}: ${err.message}`);
      return {
        success: false,
        message: err.message || 'Erro interno ao conectar Instagram Direto.',
      };
    }
  }

  /**
   * Retorna todas as páginas e contas do Instagram disponíveis no token da Meta do cliente
   */
  async getAvailableInstagramAccounts(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { metaAccessToken: true, instagramAccountId: true },
    });

    if (!cliente || !cliente.metaAccessToken) {
      throw new NotFoundException('Nenhum token da Meta conectado para este cliente.');
    }

    const pages = await this.instagramAuth.getConnectedPagesAndInstagram(cliente.metaAccessToken);
    return pages.map((p) => ({
      pageId: p.id,
      pageName: p.name,
      hasInstagram: !!p.instagram_business_account?.id,
      instagramId: p.instagram_business_account?.id || null,
      instagramUsername: p.instagram_business_account?.username || null,
      instagramName: p.instagram_business_account?.name || null,
      profilePictureUrl: p.instagram_business_account?.profile_picture_url || null,
      isSelected: p.instagram_business_account?.id === cliente.instagramAccountId,
    }));
  }

  /**
   * Permite selecionar explicitamente qual conta do Instagram vincular a este cliente
   */
  async selectInstagramAccount(
    clienteId: string,
    dto: { pageId: string; instagramAccountId: string; instagramUsername?: string },
  ) {
    return this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        facebookPageId: dto.pageId,
        instagramAccountId: dto.instagramAccountId,
        instagramUsername: dto.instagramUsername || null,
      },
    });
  }

  /**
   * Retorna o dashboard consolidado de métricas do Instagram para o cliente.
   * `period.days` aceita um preset (7/30/90) ou "all" (visão geral); `since`/`until`
   * (AAAA-MM-DD) definem um intervalo personalizado e têm prioridade sobre `days`.
   */
  async getInstagramDashboard(
    clienteId: string,
    period: { days?: string; since?: string; until?: string } = {},
    refresh = false,
  ): Promise<InstagramDashboardData> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nomeFantasia: true,
        metaAccessToken: true,
        instagramAccountId: true,
        instagramUsername: true,
        metaAuthMethod: true,
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado.`);
    }

    if (!cliente.metaAccessToken || !cliente.instagramAccountId) {
      throw new BadRequestException(
        'Instagram não conectado para este cliente. Conecte a conta do Instagram primeiro.',
      );
    }

    return this.instagramService.getDashboard(
      cliente.instagramAccountId,
      cliente.metaAccessToken,
      this.parseInstagramPeriod(period),
      refresh,
      cliente.metaAuthMethod,
    );
  }

  private parseInstagramPeriod(period: { days?: string; since?: string; until?: string }): InstagramPeriodInput {
    if (period.days === 'all') return { all: true };
    if (period.since && period.until) {
      const sinceTs = Math.floor(Date.parse(`${period.since}T00:00:00Z`) / 1000);
      const untilTs = Math.floor(Date.parse(`${period.until}T00:00:00Z`) / 1000) + 86400; // até o fim do dia final (exclusivo)
      if (Number.isNaN(sinceTs) || Number.isNaN(untilTs)) {
        throw new BadRequestException('Datas inválidas. Use o formato AAAA-MM-DD.');
      }
      return { since: sinceTs, until: untilTs };
    }
    return { days: period.days ? Number(period.days) : 30 };
  }

  /**
   * Desconecta o Instagram do cliente removendo os tokens e IDs salvos
   */
  async disconnectInstagram(clienteId: string) {
    return this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        metaAccessToken: null,
        instagramAccountId: null,
        instagramUsername: null,
        facebookPageId: null,
      },
    });
  }
}
