import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { PlanejamentoServicoService } from './planejamento-servico.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  CreatePlanejamentoDto, 
  UpdatePlanejamentoDto, 
  EscopoItemDto, 
  CreateMarcoDto, 
  UpdateMarcoDto, 
  CreateNotaHistoricoDto 
} from './dto/planejamento.dto';

@UseGuards(JwtAuthGuard)
@Controller('planejamento-servico')
export class PlanejamentoServicoController {
  constructor(private readonly planejamentoService: PlanejamentoServicoService) {}

  @Get('servico/:servicoContratadoId')
  async getByServico(@Param('servicoContratadoId') servicoContratadoId: string) {
    const planejamento = await this.planejamentoService.getPlanejamentoByServico(servicoContratadoId);
    if (!planejamento) {
      return null;
    }
    return planejamento;
  }

  @Post()
  async create(@Body() dto: CreatePlanejamentoDto, @Request() req) {
    return this.planejamentoService.createPlanejamento(dto, req.user.userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePlanejamentoDto, @Request() req) {
    return this.planejamentoService.updatePlanejamento(id, dto, req.user.userId);
  }

  // --- Escopo ---
  @Post(':id/escopo')
  async addEscopo(@Param('id') id: string, @Body() dto: EscopoItemDto, @Request() req) {
    return this.planejamentoService.addEscopoItem(id, dto, req.user.userId);
  }

  @Patch('escopo/:itemId')
  async updateEscopo(@Param('itemId') itemId: string, @Body() dto: EscopoItemDto, @Request() req) {
    return this.planejamentoService.updateEscopoItem(itemId, dto, req.user.userId);
  }

  @Delete('escopo/:itemId')
  async deleteEscopo(@Param('itemId') itemId: string, @Request() req) {
    return this.planejamentoService.deleteEscopoItem(itemId, req.user.userId);
  }

  // --- Marcos ---
  @Post(':id/marcos')
  async addMarco(@Param('id') id: string, @Body() dto: CreateMarcoDto, @Request() req) {
    return this.planejamentoService.addMarco(id, dto, req.user.userId);
  }

  @Patch('marcos/:marcoId')
  async updateMarco(@Param('marcoId') marcoId: string, @Body() dto: UpdateMarcoDto, @Request() req) {
    return this.planejamentoService.updateMarco(marcoId, dto, req.user.userId);
  }

  @Delete('marcos/:marcoId')
  async deleteMarco(@Param('marcoId') marcoId: string, @Request() req) {
    return this.planejamentoService.deleteMarco(marcoId, req.user.userId);
  }

  // --- Histórico ---
  @Post(':id/notas')
  async addNotaHistorico(@Param('id') id: string, @Body() dto: CreateNotaHistoricoDto, @Request() req) {
    return this.planejamentoService.addNotaHistorico(id, dto, req.user.userId);
  }
}
