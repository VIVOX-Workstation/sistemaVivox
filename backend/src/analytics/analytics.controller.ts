import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
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

  @Get('resultados/:clienteId')
  getResultados(@Param('clienteId') clienteId: string) {
    return this.analyticsService.getResultados(clienteId);
  }
}
