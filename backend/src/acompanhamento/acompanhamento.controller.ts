import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ModuloSistema } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequerModulo } from '../auth/modulos.decorator';
import { AcompanhamentoService } from './acompanhamento.service';
import { FiltroAcompanhamentoDto } from './dto/filtro-acompanhamento.dto';
import { CreatePublicacaoDto } from './dto/create-publicacao.dto';
import { UpdatePublicacaoDto } from './dto/update-publicacao.dto';

@Controller('acompanhamento')
@UseGuards(JwtAuthGuard)
@RequerModulo({ todos: [ModuloSistema.ACOMPANHAMENTO] })
export class AcompanhamentoController {
  constructor(private readonly acompanhamentoService: AcompanhamentoService) {}

  @Get('clientes/:clienteId')
  listar(@Param('clienteId') clienteId: string, @Query() filtro: FiltroAcompanhamentoDto) {
    return this.acompanhamentoService.consultar(clienteId, filtro);
  }

  @Get('clientes/:clienteId/meses')
  meses(@Param('clienteId') clienteId: string) {
    return this.acompanhamentoService.meses(clienteId);
  }

  @Post('clientes/:clienteId/publicacoes')
  criar(@Param('clienteId') clienteId: string, @Body() dto: CreatePublicacaoDto) {
    return this.acompanhamentoService.criar(clienteId, dto);
  }

  @Patch('publicacoes/:id')
  atualizar(@Param('id') id: string, @Body() dto: UpdatePublicacaoDto) {
    return this.acompanhamentoService.atualizar(id, dto);
  }

  @Delete('publicacoes/:id')
  remover(@Param('id') id: string) {
    return this.acompanhamentoService.remover(id);
  }
}
