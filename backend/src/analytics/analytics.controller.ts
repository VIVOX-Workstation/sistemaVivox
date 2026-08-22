import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateMetricaDto } from './dto/create-analytics.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('snapshot')
  saveSnapshot(@Body() dto: CreateMetricaDto) {
    return this.analyticsService.saveSnapshot(dto);
  }

  @Get('dashboard-executivo')
  getDashboardExecutivo() {
    return this.analyticsService.getDashboardExecutivo();
  }

  @Get('resultados/:clienteId')
  getResultados(@Param('clienteId') clienteId: string) {
    return this.analyticsService.getResultados(clienteId);
  }

  /**
   * Retorna o status e o e-mail da Service Account configurada
   */
  @Get('google/service-account')
  getServiceAccountInfo() {
    return this.analyticsService.getServiceAccountInfo();
  }

  /**
   * Retorna as métricas de GA4 e Google Search Console consolidadas para um cliente
   */
  @Get('google/:clienteId')
  getGoogleDashboard(
    @Param('clienteId') clienteId: string,
    @Query('days') days?: string,
    @Query('refresh') refresh?: string,
  ) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    const forceRefresh = refresh === 'true' || refresh === '1';
    return this.analyticsService.getGoogleDashboard(clienteId, daysNumber, forceRefresh);
  }

  /**
   * Salva as configurações de IDs de GA4 e Search Console do cliente
   */
  @Patch('google/:clienteId')
  updateGoogleConfig(
    @Param('clienteId') clienteId: string,
    @Body() dto: { ga4PropertyId?: string; gscSiteUrl?: string },
  ) {
    return this.analyticsService.updateClienteGoogleConfig(clienteId, dto);
  }

  /**
   * Testa a conexão e permissões para um propertyId ou siteUrl avulso
   */
  @Post('google/test-connection')
  testConnection(@Body() dto: { propertyId?: string; siteUrl?: string; days?: number }) {
    return this.analyticsService.testGoogleConnection(dto);
  }

  /**
   * Retorna as métricas de tráfego do OpenPanel para um cliente
   */
  @Get('openpanel/:clienteId')
  getOpenPanelDashboard(
    @Param('clienteId') clienteId: string,
    @Query('range') range?: string,
    @Query('refresh') refresh?: string,
  ) {
    const forceRefresh = refresh === 'true' || refresh === '1';
    return this.analyticsService.getOpenPanelDashboard(clienteId, range || '30d', forceRefresh);
  }

  /**
   * Salva o ID do Projeto OpenPanel do cliente
   */
  @Patch('openpanel/:clienteId')
  updateOpenPanelConfig(
    @Param('clienteId') clienteId: string,
    @Body() dto: { openpanelProjectId?: string; openpanelClientId?: string; openpanelClientSecret?: string },
  ) {
    return this.analyticsService.updateClienteOpenPanelConfig(clienteId, dto);
  }
}
