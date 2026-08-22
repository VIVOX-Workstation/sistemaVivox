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
  ) {
    return this.tarefasService.findAll({
      search,
      status,
      prioridade,
      responsavelId,
      clienteId,
      projetoId,
    });
  }

  @Get('metricas')
  getMetricas() {
    return this.tarefasService.getMetricas();
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
  update(@Param('id') id: string, @Body() updateTarefaDto: UpdateTarefaDto) {
    return this.tarefasService.update(id, updateTarefaDto);
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
}
