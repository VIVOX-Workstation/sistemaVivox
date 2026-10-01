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
import { followerChangeFromSnapshots, SNAPSHOT_TOLERANCE_MS } from './instagram/follower-history';

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

  /**
   * Séries curtas para sparklines nos cards de clientes. Somente Prisma, sem N+1.
   */
  async getSparklines() {
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    const [followers, snaps] = await Promise.all([
      this.prisma.instagramFollowerSnapshot.findMany({
        where: { capturedAt: { gte: new Date(now - 60 * DAY) } },
        select: { clienteId: true, instagramAccountId: true, followersCount: true, capturedAt: true },
        orderBy: { capturedAt: 'asc' },
      }),
      this.prisma.analyticsSnapshot.findMany({
        where: { periodoFim: { gte: new Date(now - 90 * DAY) }, alcanceTotal: { not: null } },
        select: { clienteId: true, periodoFim: true, alcanceTotal: true },
        orderBy: { periodoFim: 'asc' },
      }),
    ]);

    type Ponto = { data: string; valor: number };
    const build = (metrica: 'seguidores' | 'alcance', rotulo: string, mapa: Map<string, number>) => {
      const serie: Ponto[] = [...mapa.entries()]
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([data, valor]) => ({ data, valor }))
        .slice(-30);
      const ultimo = serie.length ? serie[serie.length - 1].valor : null;
      const primeiro = serie.length ? serie[0].valor : null;
      const variacaoPct =
        serie.length >= 2 && primeiro !== 0 && primeiro !== null && ultimo !== null
          ? Math.round(((ultimo - primeiro) / primeiro) * 1000) / 10
          : null;
      return { metrica, rotulo, serie, ultimo, variacaoPct };
    };

    const result: Record<string, ReturnType<typeof build>> = {};

    // Seguidores: agrupa por cliente e conta; usa a conta com mais registros
    const porCliente = new Map<string, Map<string, typeof followers>>();
    for (const f of followers) {
      let contas = porCliente.get(f.clienteId);
      if (!contas) porCliente.set(f.clienteId, (contas = new Map()));
      const lista = contas.get(f.instagramAccountId);
      if (lista) lista.push(f);
      else contas.set(f.instagramAccountId, [f]);
    }
    for (const [clienteId, contas] of porCliente) {
      let melhor: typeof followers = [];
      for (const lista of contas.values()) if (lista.length > melhor.length) melhor = lista;
      const dias = new Map<string, number>();
      // já ordenado por capturedAt asc: o último do dia sobrescreve
      for (const f of melhor) dias.set(iso(f.capturedAt), f.followersCount);
      result[clienteId] = build('seguidores', 'Seguidores', dias);
    }

    // Alcance: apenas para clientes sem seguidores
    const alcance = new Map<string, Map<string, number>>();
    for (const s of snaps) {
      if (result[s.clienteId]) continue;
      let dias = alcance.get(s.clienteId);
      if (!dias) alcance.set(s.clienteId, (dias = new Map()));
      const d = iso(s.periodoFim);
      dias.set(d, (dias.get(d) ?? 0) + (s.alcanceTotal ?? 0));
    }
    for (const [clienteId, dias] of alcance) {
      result[clienteId] = build('alcance', 'Alcance', dias);
    }

    return result;
  }

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
      extras,
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
      this.getDashboardExtras(),
    ]);

    return {
      clientes: {
        total: totalClientes,
        ativos: clientesAtivos,
        prospects: clientesProspects,
        pausados: clientesPausados,
        novosPorMes: extras.novosPorMes,
      },
      servicos: {
        ativos: totalServicosAtivos,
        producoesEmAndamento: totalProducoesEmAndamento,
        oportunidadesAbertas: totalOportunidades,
        porTipo: extras.servicosPorTipo,
      },
      landingPages: radarHospedagens,
      ultimosClientes,
      tarefas: extras.tarefas,
      chamados: extras.chamados,
      producoes: extras.producoes,
      analytics: extras.analytics,
    };
  }

  /** Data "local" (America/Cuiaba, UTC-4 fixo, sem DST) com campos UTC representando o relógio local. */
  private static readonly OFFSET_LOCAL_MS = -4 * 60 * 60 * 1000;

  private async getDashboardExtras() {
    const DIA = 24 * 60 * 60 * 1000;
    const agora = new Date();
    const local = new Date(agora.getTime() + AnalyticsService.OFFSET_LOCAL_MS);
    const fmtDia = (d: Date) => d.toISOString().slice(0, 10);

    // Últimos 6 meses (mês corrente incluso)
    const mesesChaves: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - i, 1));
      mesesChaves.push(d.toISOString().slice(0, 7));
    }
    const inicioMeses = new Date(
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - 5, 1) - AnalyticsService.OFFSET_LOCAL_MS,
    );
    const inicioMesAtual = new Date(
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - AnalyticsService.OFFSET_LOCAL_MS,
    );

    // Semana (domingo 00:00) igual a TarefasService.getMetricas
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    // Últimas 8 semanas (segunda-feira como chave)
    const diaSemanaLocal = (local.getUTCDay() + 6) % 7; // 0 = segunda
    const segundaAtualLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - diaSemanaLocal * DIA;
    const semanasChaves: string[] = [];
    for (let i = 7; i >= 0; i--) semanasChaves.push(fmtDia(new Date(segundaAtualLocal - i * 7 * DIA)));
    const inicioSemanas = new Date(segundaAtualLocal - 7 * 7 * DIA - AnalyticsService.OFFSET_LOCAL_MS);

    const em7Dias = new Date(agora.getTime() + 7 * DIA);
    const ha30Dias = new Date(agora.getTime() - 30 * DIA);

    const statusTarefa = ['BACKLOG', 'A_FAZER', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDA', 'CANCELADA'];
    const prioridades = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'] as const;
    const urgencias = ['BAIXA', 'MEDIA', 'ALTA'] as const;
    const statusProducao = ['EM_PRODUCAO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO'];
    const abertaWhere = { status: { notIn: ['CONCLUIDA', 'CANCELADA'] } };
    const naoResolvido = { status: { not: 'RESOLVIDO' as const } };

    const [
      clientesRecentes,
      servicosTipoRaw,
      tarefasTotal,
      tarefasStatusRaw,
      tarefasPrioridadeRaw,
      tarefasAtrasadas,
      tarefasVencendo,
      tarefasConcluidasSemana,
      tarefasHoras,
      tarefasConcluidasRecentes,
      tarefasAtrasadasLista,
      chamadosStatusRaw,
      chamadosResolvidosMes,
      chamadosSlaVencidos,
      chamadosUrgenciaRaw,
      chamadosRecentesRaw,
      producoesStatusRaw,
      clientesGa4,
      clientesInstagram,
      clientesOpenpanel,
      snapshots,
    ] = await Promise.all([
      this.prisma.cliente.findMany({ where: { createdAt: { gte: inicioMeses } }, select: { createdAt: true } }),
      this.prisma.servicoContratado.groupBy({ by: ['tipoServico'], where: { status: 'ATIVO' }, _count: { _all: true } }),
      this.prisma.tarefa.count(),
      this.prisma.tarefa.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.tarefa.groupBy({ by: ['prioridade'], where: abertaWhere, _count: { _all: true } }),
      this.prisma.tarefa.count({ where: { ...abertaWhere, prazo: { lt: agora } } }),
      this.prisma.tarefa.count({ where: { ...abertaWhere, prazo: { gte: agora, lte: em7Dias } } }),
      this.prisma.tarefa.count({ where: { status: 'CONCLUIDA', dataConclusao: { gte: inicioSemana } } }),
      this.prisma.tarefa.aggregate({ _sum: { horasGastas: true } }),
      this.prisma.tarefa.findMany({
        where: { status: 'CONCLUIDA', dataConclusao: { gte: inicioSemanas } },
        select: { dataConclusao: true },
      }),
      this.prisma.tarefa.findMany({
        where: { ...abertaWhere, prazo: { lt: agora } },
        orderBy: { prazo: 'asc' },
        take: 6,
        select: {
          id: true,
          titulo: true,
          prazo: true,
          prioridade: true,
          cliente: { select: { id: true, nomeFantasia: true } },
          responsavel: { select: { nome: true } },
        },
      }),
      this.prisma.chamado.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.chamado.count({ where: { resolvidoEm: { gte: inicioMesAtual } } }),
      this.prisma.chamado.count({ where: { ...naoResolvido, slaVencimento: { lt: agora } } }),
      this.prisma.chamado.groupBy({ by: ['urgencia'], where: naoResolvido, _count: { _all: true } }),
      this.prisma.chamado.findMany({
        where: naoResolvido,
        orderBy: { slaVencimento: { sort: 'asc', nulls: 'last' } },
        take: 6,
        select: {
          id: true,
          titulo: true,
          urgencia: true,
          status: true,
          slaVencimento: true,
          createdAt: true,
          cliente: { select: { id: true, nomeFantasia: true } },
        },
      }),
      this.prisma.producao.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.cliente.count({ where: { status: 'ATIVO', ga4PropertyId: { not: null } } }),
      this.prisma.cliente.count({ where: { status: 'ATIVO', instagramAccountId: { not: null } } }),
      this.prisma.cliente.count({ where: { status: 'ATIVO', openpanelProjectId: { not: null } } }),
      this.prisma.analyticsSnapshot.findMany({
        where: { periodoFim: { gte: ha30Dias } },
        select: {
          clienteId: true,
          periodoFim: true,
          alcanceTotal: true,
          engajamentoTotal: true,
          cliente: { select: { nomeFantasia: true } },
        },
      }),
    ]);

    const mapa = (rows: any[], campo: string) => {
      const m = new Map<string, number>();
      for (const r of rows || []) m.set(String(r[campo]), r._count?._all ?? 0);
      return m;
    };

    // novosPorMes
    const mesesMap = new Map<string, number>(mesesChaves.map(k => [k, 0]));
    for (const c of clientesRecentes || []) {
      const k = new Date(c.createdAt.getTime() + AnalyticsService.OFFSET_LOCAL_MS).toISOString().slice(0, 7);
      if (mesesMap.has(k)) mesesMap.set(k, (mesesMap.get(k) || 0) + 1);
    }
    const novosPorMes = mesesChaves.map(mes => ({ mes, total: mesesMap.get(mes) || 0 }));

    // serviços por tipo
    const servicosPorTipo = (servicosTipoRaw || [])
      .map((r: any) => ({ tipo: String(r.tipoServico), total: r._count?._all ?? 0 }))
      .sort((a, b) => b.total - a.total);

    // tarefas
    const stMap = mapa(tarefasStatusRaw, 'status');
    const prMap = mapa(tarefasPrioridadeRaw, 'prioridade');
    const abertas = statusTarefa
      .filter(s => s !== 'CONCLUIDA' && s !== 'CANCELADA')
      .reduce((acc, s) => acc + (stMap.get(s) || 0), 0);

    const semanasMap = new Map<string, number>(semanasChaves.map(k => [k, 0]));
    for (const t of tarefasConcluidasRecentes || []) {
      if (!t.dataConclusao) continue;
      const l = new Date(t.dataConclusao.getTime() + AnalyticsService.OFFSET_LOCAL_MS);
      const seg = Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate()) - ((l.getUTCDay() + 6) % 7) * DIA;
      const k = fmtDia(new Date(seg));
      if (semanasMap.has(k)) semanasMap.set(k, (semanasMap.get(k) || 0) + 1);
    }

    const tarefas = {
      total: tarefasTotal ?? 0,
      abertas,
      emAndamento: stMap.get('EM_ANDAMENTO') || 0,
      atrasadas: tarefasAtrasadas ?? 0,
      vencendoSemana: tarefasVencendo ?? 0,
      concluidasSemana: tarefasConcluidasSemana ?? 0,
      horasGastas: tarefasHoras?._sum?.horasGastas ?? 0,
      porStatus: statusTarefa.map(status => ({ status, total: stMap.get(status) || 0 })),
      porPrioridade: prioridades.map(prioridade => ({ prioridade, total: prMap.get(prioridade) || 0 })),
      concluidasPorSemana: semanasChaves.map(semana => ({ semana, total: semanasMap.get(semana) || 0 })),
      atrasadasLista: (tarefasAtrasadasLista || []).map((t: any) => ({
        id: t.id,
        titulo: t.titulo,
        prazo: t.prazo.toISOString(),
        diasAtraso: Math.max(0, Math.floor((agora.getTime() - t.prazo.getTime()) / DIA)),
        prioridade: t.prioridade,
        cliente: t.cliente ? { id: t.cliente.id, nomeFantasia: t.cliente.nomeFantasia } : null,
        responsavel: t.responsavel ? { nome: t.responsavel.nome } : null,
      })),
    };

    // chamados
    const chStatus = mapa(chamadosStatusRaw, 'status');
    const chUrg = mapa(chamadosUrgenciaRaw, 'urgencia');
    const chamados = {
      abertos: chStatus.get('ABERTO') || 0,
      emAndamento: chStatus.get('EM_ANDAMENTO') || 0,
      resolvidosMes: chamadosResolvidosMes ?? 0,
      slaVencidos: chamadosSlaVencidos ?? 0,
      porUrgencia: urgencias.map(urgencia => ({ urgencia, total: chUrg.get(urgencia) || 0 })),
      recentes: (chamadosRecentesRaw || []).map((c: any) => ({
        id: c.id,
        titulo: c.titulo,
        urgencia: c.urgencia,
        status: c.status,
        slaVencimento: c.slaVencimento ? c.slaVencimento.toISOString() : null,
        slaVencido: !!c.slaVencimento && c.slaVencimento.getTime() < agora.getTime(),
        createdAt: c.createdAt.toISOString(),
        cliente: c.cliente,
      })),
    };

    // produções
    const prodMap = mapa(producoesStatusRaw, 'status');
    const producoes = {
      porStatus: statusProducao.map(status => ({ status, total: prodMap.get(status) || 0 })),
    };

    // analytics
    let alcance30d = 0;
    let engajamento30d = 0;
    const serie = new Map<string, { alcance: number; engajamento: number }>();
    const porCliente = new Map<string, { id: string; nomeFantasia: string; alcance: number; engajamento: number }>();
    for (const s of snapshots || []) {
      const alc = s.alcanceTotal ?? 0;
      const eng = s.engajamentoTotal ?? 0;
      alcance30d += alc;
      engajamento30d += eng;
      const dia = fmtDia(s.periodoFim);
      const p = serie.get(dia) || { alcance: 0, engajamento: 0 };
      p.alcance += alc;
      p.engajamento += eng;
      serie.set(dia, p);
      const c = porCliente.get(s.clienteId) || {
        id: s.clienteId,
        nomeFantasia: s.cliente?.nomeFantasia ?? '',
        alcance: 0,
        engajamento: 0,
      };
      c.alcance += alc;
      c.engajamento += eng;
      porCliente.set(s.clienteId, c);
    }

    return {
      novosPorMes,
      servicosPorTipo,
      tarefas,
      chamados,
      producoes,
      analytics: {
        clientesComGa4: clientesGa4 ?? 0,
        clientesComInstagram: clientesInstagram ?? 0,
        clientesComOpenpanel: clientesOpenpanel ?? 0,
        alcance30d,
        engajamento30d,
        serieAlcance: [...serie.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([data, v]) => ({ data, ...v })),
        topClientesAlcance: [...porCliente.values()].sort((a, b) => b.alcance - a.alcance).slice(0, 5),
      },
    };
  }

  private async getRadarHospedagensResumo() {
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
          },
        },
      },
    });

    let criticos7Dias = 0;
    let atencao30Dias = 0;
    let emDia = 0;

    const enriquecidos = todos.map(item => {
      let diasRestantes: number | null = null;
      const vencimentos = [item.dataRenovacaoVps, item.dataExpiracaoDominio]
        .filter((data): data is Date => data !== null);
      if (vencimentos.length) {
        diasRestantes = Math.ceil(
          (Math.min(...vencimentos.map(data => data.getTime())) - agora.getTime()) / (1000 * 60 * 60 * 24),
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
          metaAuthMethod: null,
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
        // Sem isto, um cliente que já conectou pelo Login Direto continuaria
        // marcado como INSTAGRAM e o token do Facebook iria para graph.instagram.com.
        metaAuthMethod: 'FACEBOOK',
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
        metaAuthMethod: 'FACEBOOK',
      },
    });
  }

  /**
   * Retorna o dashboard consolidado de métricas do Instagram para o cliente.
   * `period.days` aceita um preset (7/30/90); `since`/`until` (AAAA-MM-DD)
   * definem um intervalo personalizado e têm prioridade sobre `days`.
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

    const dashboard = await this.instagramService.getDashboard(
      cliente.instagramAccountId,
      cliente.metaAccessToken,
      this.parseInstagramPeriod(period),
      refresh,
      cliente.metaAuthMethod,
    );
    // Clone the cached response before adding client-specific persistent history.
    const data = structuredClone(dashboard);
    try {
      const account = { clienteId, instagramAccountId: cliente.instagramAccountId };
      const capturedAt = new Date(data.syncedAt);
      if (data.overview.totalFollowers !== null) {
        await this.prisma.instagramFollowerSnapshot.upsert({
          where: { clienteId_instagramAccountId_capturedAt: { ...account, capturedAt } },
          create: { ...account, capturedAt, followersCount: data.overview.totalFollowers }, update: {},
        });
      }
      const boundaries = [data.previousPeriod.since, data.period.since, data.period.until];
      const [snapshots, first] = await Promise.all([
        this.prisma.instagramFollowerSnapshot.findMany({ where: { ...account, OR: boundaries.map(value => ({ capturedAt: { gte: new Date(Date.parse(value) - SNAPSHOT_TOLERANCE_MS), lte: new Date(value) } })) }, select: { capturedAt: true, followersCount: true } }),
        this.prisma.instagramFollowerSnapshot.findFirst({ where: account, orderBy: { capturedAt: 'asc' }, select: { capturedAt: true } }),
      ]);
      if (data.followers.current.net === null) data.followers.current = followerChangeFromSnapshots(snapshots, data.period.since, data.period.until);
      if (data.followers.previous.net === null) data.followers.previous = followerChangeFromSnapshots(snapshots, data.previousPeriod.since, data.previousPeriod.until);
      data.followers.historySince = first?.capturedAt.toISOString();
    } catch {
      this.logger.warn('Não foi possível registrar ou consultar o histórico de seguidores.');
      data.warnings.push('O histórico local de seguidores está temporariamente indisponível.');
    }
    return data;
  }

  private parseInstagramPeriod(period: { days?: string; since?: string; until?: string }): InstagramPeriodInput {
    if (period.since !== undefined || period.until !== undefined) {
      const validDate = (value?: string) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
      if (!validDate(period.since) || !validDate(period.until)) throw new BadRequestException('Informe as duas datas válidas no formato AAAA-MM-DD.');
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
        metaAuthMethod: null,
      },
    });
  }
}
