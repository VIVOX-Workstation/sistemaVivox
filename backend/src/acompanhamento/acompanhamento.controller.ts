import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CRONOGRAMA_MAX_BYTES, CronogramasService, respostaPdf } from './cronogramas.service';
import { EnviarCronogramaDto } from './dto/enviar-cronograma.dto';
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
  constructor(
    private readonly acompanhamentoService: AcompanhamentoService,
    private readonly cronogramasService: CronogramasService,
  ) {}

  // ---- Cronogramas em PDF ----

  @Get('clientes/:clienteId/cronogramas')
  listarCronogramas(@Param('clienteId') clienteId: string) {
    return this.cronogramasService.listar(clienteId);
  }

  @Post('clientes/:clienteId/cronogramas')
  @UseInterceptors(FileInterceptor('arquivo', { limits: { fileSize: CRONOGRAMA_MAX_BYTES, files: 1 } }))
  enviarCronograma(
    @Param('clienteId') clienteId: string,
    @UploadedFile() arquivo: Express.Multer.File | undefined,
    @Body() dto: EnviarCronogramaDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.cronogramasService.enviar(clienteId, arquivo, dto, req.user.userId);
  }

  @Get('cronogramas/:id/arquivo')
  async arquivoCronograma(@Param('id') id: string) {
    return respostaPdf(await this.cronogramasService.arquivo(id));
  }

  @Delete('cronogramas/:id')
  removerCronograma(@Param('id') id: string) {
    return this.cronogramasService.remover(id);
  }

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
