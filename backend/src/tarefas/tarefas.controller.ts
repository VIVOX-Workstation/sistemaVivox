import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { TarefasService } from './tarefas.service';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { AddChecklistItemDto, UpdateChecklistItemDto } from './dto/checklist.dto';
import { AddComentarioDto } from './dto/comentario.dto';
import { SetObservadoresDto } from './dto/observadores.dto';
import { GerarChecklistIaDto } from './dto/gerar-checklist-ia.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { PrioridadeTarefa } from '@prisma/client';

@Controller('tarefas')
@UseGuards(JwtAuthGuard)
export class TarefasController {
  constructor(
    private readonly tarefasService: TarefasService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('prioridade') prioridade?: PrioridadeTarefa,
    @Query('responsavelId') responsavelId?: string,
    @Query('clienteId') clienteId?: string,
    @Query('projetoId') projetoId?: string,
    @Query('servicoId') servicoId?: string,
  ) {
    return this.tarefasService.findAll({
      search,
      status,
      prioridade,
      responsavelId,
      clienteId,
      projetoId,
      servicoId,
    });
  }

  @Get('metricas')
  getMetricas() {
    return this.tarefasService.getMetricas();
  }

  @Get('coluna')
  findColuna(
    @Query('status') status: string,
    @Query('projetoId') projetoId?: string,
    @Query('search') search?: string,
    @Query('prioridade') prioridade?: PrioridadeTarefa,
    @Query('responsavelId') responsavelId?: string,
    @Query('clienteId') clienteId?: string,
    @Query('servicoId') servicoId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    if (!status) {
      throw new BadRequestException('O parâmetro "status" (etapa) é obrigatório');
    }
    return this.tarefasService.findColuna({
      status,
      projetoId,
      search,
      prioridade,
      responsavelId,
      clienteId,
      servicoId,
      skip: skip !== undefined ? parseInt(skip, 10) : undefined,
      take: take !== undefined ? parseInt(take, 10) : undefined,
    });
  }

  @Get('resumo-etapas')
  getResumoEtapas(
    @Query('projetoId') projetoId?: string,
    @Query('search') search?: string,
    @Query('prioridade') prioridade?: PrioridadeTarefa,
    @Query('responsavelId') responsavelId?: string,
    @Query('clienteId') clienteId?: string,
    @Query('servicoId') servicoId?: string,
  ) {
    return this.tarefasService.getResumoEtapas({
      projetoId,
      search,
      prioridade,
      responsavelId,
      clienteId,
      servicoId,
    });
  }

  @Get('exportar')
  exportarWorkspace(@Query('projetoId') projetoId: string) {
    if (!projetoId) {
      throw new BadRequestException('O parâmetro "projetoId" é obrigatório');
    }
    return this.tarefasService.exportarWorkspace(projetoId);
  }

  @Patch('mover-etapa')
  moverEtapa(
    @Body('projetoId') projetoId: string | undefined,
    @Body('statusOrigem') statusOrigem: string,
    @Body('statusDestino') statusDestino: string,
  ) {
    if (!statusOrigem || !statusDestino) {
      throw new BadRequestException('statusOrigem e statusDestino são obrigatórios');
    }
    return this.tarefasService.moverEtapa({ projetoId, statusOrigem, statusDestino });
  }

  @Post('gerar-checklist-ia')
  gerarChecklistIa(@Body() dto: GerarChecklistIaDto) {
    return this.tarefasService.gerarChecklistIa(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tarefasService.findOne(id);
  }

  @Post()
  create(@Body() createTarefaDto: CreateTarefaDto, @Req() req: any) {
    const autorId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.tarefasService.create(createTarefaDto, autorId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTarefaDto: UpdateTarefaDto,
    @Req() req: any,
  ) {
    const usuarioId = req.user?.userId || req.user?.id || req.user?.sub;
    const role = req.user?.role;
    return this.tarefasService.update(id, updateTarefaDto, usuarioId, role);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tarefasService.remove(id);
  }

  @Post(':id/checklist')
  addChecklistItem(
    @Param('id') id: string,
    @Body() dto: AddChecklistItemDto,
  ) {
    return this.tarefasService.addChecklistItem(id, dto);
  }

  @Patch('checklist/:itemId')
  updateChecklistItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.tarefasService.updateChecklistItem(itemId, dto);
  }

  @Delete('checklist/:itemId')
  removeChecklistItem(@Param('itemId') itemId: string) {
    return this.tarefasService.removeChecklistItem(itemId);
  }

  @Post(':id/comentarios')
  addComentario(
    @Param('id') id: string,
    @Body() dto: AddComentarioDto,
    @Req() req: any,
  ) {
    const autorId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.tarefasService.addComentario(id, autorId, dto);
  }

  @Patch(':id/observadores')
  setObservadores(@Param('id') id: string, @Body() dto: SetObservadoresDto) {
    return this.tarefasService.setObservadores(id, dto.observadorIds);
  }

  @Post(':id/anexo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAnexo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    const autorId = req.user?.userId || req.user?.id || req.user?.sub;
    const fileUrl = await this.storageService.uploadFile(file, 'tarefas');
    const texto = `📎 Anexo: [${file.originalname}](${fileUrl})`;
    return this.tarefasService.addComentario(id, autorId, { texto });
  }

  @Post('importar-bitrix')
  @UseInterceptors(FileInterceptor('file'))
  async importarBitrix(
    @UploadedFile() file: Express.Multer.File,
    @Body('projetoId') projetoId?: string,
    @Body('etapa') etapa?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    return this.tarefasService.importarBitrix(file.buffer, projetoId, etapa);
  }

  @Post('importar-backup')
  @UseInterceptors(FileInterceptor('file'))
  async importarBackup(
    @UploadedFile() file: Express.Multer.File,
    @Body('projetoId') projetoId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    if (!projetoId) {
      throw new BadRequestException('Selecione o workspace de destino');
    }
    let conteudo: any;
    try {
      conteudo = JSON.parse(file.buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Arquivo de backup inválido: não é um JSON válido');
    }
    return this.tarefasService.importarBackup(conteudo?.tarefas, projetoId);
  }
}
