import { ModuloSistema } from '@prisma/client';
import { RequerModulo } from '../auth/modulos.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException } from '@nestjs/common';
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
import { KanbanService } from '../kanban/kanban.service';
import { syncActor } from '../kanban/kanban.controller';
import { moveAction } from '../kanban/kanban.policy';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class UploadAnexoDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(86400) audioDuracao?: number;
}

@RequerModulo({ todos: [ModuloSistema.GP], leitura: [ModuloSistema.CLIENTES] })
@Controller('tarefas')
@UseGuards(JwtAuthGuard)
export class TarefasController {
  constructor(
    private readonly tarefasService: TarefasService,
    private readonly storageService: StorageService,
    private readonly kanban: KanbanService,
  ) {}

  @Get()
  findAll(@Query() query: any, @Req() req: any) {
    return this.kanban.listTasks(syncActor(req), query);
  }

  @Get('metricas')
  async getMetricas(@Req() req: any) {
    const items = await this.kanban.listTasks(syncActor(req));
    const now = new Date();
    const week = new Date(now); week.setDate(now.getDate() - now.getDay()); week.setHours(0,0,0,0);
    return {
      total: items.length,
      emAndamento: items.filter(t => t.status === 'EM_ANDAMENTO').length,
      atrasadas: items.filter(t => !['CONCLUIDA','CANCELADA'].includes(t.status) && t.prazo && new Date(t.prazo) < now).length,
      concluidasSemana: items.filter(t => t.status === 'CONCLUIDA' && t.dataConclusao && new Date(t.dataConclusao) >= week).length,
      horasGastasTotal: items.reduce((sum, t) => sum + t.tempo.totalSegundos / 3600, 0),
    };
  }

  @Get('coluna')
  findColuna(@Query() query: any, @Req() req: any) {
    if (!query.status) throw new BadRequestException('O parâmetro status é obrigatório.');
    const skip = Math.max(0, Number.parseInt(query.skip || '0', 10) || 0);
    const take = Math.min(200, Math.max(1, Number.parseInt(query.take || '30', 10) || 30));
    const { status, projetoId, search, prioridade, responsavelId, clienteId, servicoId } = query;
    return this.tarefasService.findColuna(
      { status, projetoId, search, prioridade, responsavelId, clienteId, servicoId, skip, take },
      this.kanban.visibility(syncActor(req)),
    );
  }

  @Get('resumo-etapas')
  getResumoEtapas(@Query() query: any, @Req() req: any) {
    const { projetoId, search, prioridade, responsavelId, clienteId, servicoId } = query;
    return this.tarefasService.getResumoEtapas(
      { projetoId, search, prioridade, responsavelId, clienteId, servicoId },
      this.kanban.visibility(syncActor(req)),
    );
  }

  @Get('exportar')
  exportarWorkspace(@Query('projetoId') projetoId: string) {
    if (!projetoId) {
      throw new BadRequestException('O parâmetro "projetoId" é obrigatório');
    }
    return this.tarefasService.exportarWorkspace(projetoId);
  }

  @Patch('mover-etapa')
  async moverEtapa(
    @Body('projetoId') projetoId: string | undefined,
    @Body('statusOrigem') statusOrigem: string,
    @Body('statusDestino') statusDestino: string,
    @Req() req: any,
  ) {
    if (!statusOrigem || !statusDestino) {
      throw new BadRequestException('statusOrigem e statusDestino são obrigatórios');
    }
    const actor = syncActor(req);
    const tarefas = await this.kanban.listTasks(actor, { projetoId, status: statusOrigem });
    const planos: { id: string; colunaId: string; versao: number }[] = [];
    // Check every task first so a known permission/approval failure cannot move
    // an earlier part of the batch. Each command rechecks under its row lock.
    for (const tarefa of tarefas) {
      if (!tarefa.quadroId) throw new BadRequestException('A tarefa ainda não está vinculada ao Kanban.');
      const destino = await this.kanban.legacyDestination(tarefa.id, statusDestino, actor, tarefa.versao);
      const acao = moveAction(tarefa, destino);
      if (acao === 'corrigir') {
        throw new BadRequestException('Use Pedir correção e informe o motivo para retornar à execução.');
      }
      const permissao = acao === 'reordenar' || acao === 'organizar' ? 'mover' : acao;
      if (!tarefa.permissoes[permissao] ||
          (acao === 'organizar' && tarefa.tempo.sessaoAtiva && !tarefa.permissoes.pausar)) {
        throw new ForbiddenException('Você não tem permissão para esta movimentação na tarefa.');
      }
      planos.push({ id: tarefa.id, colunaId: destino.id, versao: tarefa.versao });
    }
    for (const plano of planos) {
      await this.kanban.command(plano.id, 'mover', { colunaId: plano.colunaId, versao: plano.versao }, actor);
    }
    return { movidas: planos.length };
  }

  @Post('gerar-checklist-ia')
  gerarChecklistIa(@Body() dto: GerarChecklistIaDto) { return this.tarefasService.gerarChecklistIa(dto); }

  @Post('importar-bitrix')
  @UseInterceptors(FileInterceptor('file'))
  async importarBitrix(
    @UploadedFile() file: Express.Multer.File,
    @Body('projetoId') projetoId: string | undefined,
    @Body('etapa') etapa: string | undefined,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    const actor = syncActor(req);
    return this.tarefasService.importarBitrix(file.buffer, projetoId, etapa, async (id, status, destinoProjetoId) => {
      let tarefa = await this.kanban.getTask(id, actor);
      const mudaProjeto = !!destinoProjetoId && destinoProjetoId !== tarefa.projetoId;
      if (mudaProjeto && !tarefa.permissoes.editar) {
        throw new ForbiddenException('Você não tem permissão para alterar o workspace da tarefa.');
      }
      if (status !== tarefa.status) {
        tarefa = await this.kanban.updateTask(id, { status, versao: tarefa.versao }, actor);
      }
      if (mudaProjeto) {
        await this.kanban.updateTask(id, { projetoId: destinoProjetoId, versao: tarefa.versao }, actor);
      }
    });
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

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) { return this.kanban.getTask(id, syncActor(req)); }

  @Post()
  create(@Body() dto: CreateTarefaDto, @Req() req: any) { return this.kanban.createTask(dto, syncActor(req)); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTarefaDto, @Req() req: any) { return this.kanban.updateTask(id, dto, syncActor(req)); }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) { return this.kanban.removeTask(id, syncActor(req)); }

  @Post(':id/checklist')
  addChecklistItem(@Param('id') id: string, @Body() dto: AddChecklistItemDto, @Req() req: any) { return this.kanban.checklist(id, undefined, dto, 'add', syncActor(req)); }

  @Patch('checklist/:itemId')
  updateChecklistItem(@Param('itemId') itemId: string, @Body() dto: UpdateChecklistItemDto, @Req() req: any) { return this.kanban.checklist(undefined, itemId, dto, 'update', syncActor(req)); }

  @Delete('checklist/:itemId')
  removeChecklistItem(@Param('itemId') itemId: string, @Req() req: any) { return this.kanban.checklist(undefined, itemId, {}, 'delete', syncActor(req)); }

  @Post(':id/comentarios')
  addComentario(@Param('id') id: string, @Body() dto: AddComentarioDto, @Req() req: any) { return this.kanban.comment(id, dto.texto, syncActor(req)); }

  @Patch(':id/observadores')
  setObservadores(@Param('id') id: string, @Body() dto: SetObservadoresDto, @Req() req: any) { return this.kanban.observers(id, dto.observadorIds, syncActor(req)); }

  @Post(':id/anexo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAnexo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() dto: UploadAnexoDto, @Req() req: any) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    if (dto.audioDuracao !== undefined) {
      if (!/^audio\//.test(file.mimetype) && !/\.(mp3|wav|m4a|ogg|oga|aac|webm|opus|amr|3gp)$/i.test(file.originalname)) throw new BadRequestException('Selecione um arquivo de áudio.');
      if (file.size > 25 * 1024 * 1024) throw new BadRequestException('O áudio passa de 25 MB.');
    }
    // Validate access before writing an object to storage.
    const task = await this.kanban.getTask(id, syncActor(req));
    if (!task.permissoes.comentar) throw new ForbiddenException('Sem permissão para anexar arquivos.');
    const fileUrl = await this.storageService.uploadFile(file, 'tarefas');
    return this.kanban.comment(id, '📎 Anexo: [' + file.originalname + '](' + fileUrl + ')', syncActor(req), { anexoTipo: file.mimetype, anexoTamanho: file.size, ...(dto.audioDuracao !== undefined ? { audioDuracao: dto.audioDuracao } : {}) });
  }

  @Delete(':id/anexos/:comentarioId')
  removeAnexo(@Param('id') id: string, @Param('comentarioId') comentarioId: string, @Req() req: any) {
    return this.kanban.removeAttachment(id, comentarioId, syncActor(req));
  }

}
