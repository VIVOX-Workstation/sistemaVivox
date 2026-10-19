import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsString, IsOptional, IsInt, Min, Max, IsIn, MaxLength, Matches, IsBoolean, IsArray, ArrayMinSize, ArrayMaxSize, ValidateNested, IsObject, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ModuloSistema } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequerModulo } from '../auth/modulos.decorator';
import { KanbanService } from './kanban.service';
import { SyncActor } from './kanban.policy';
import { KanbanEquipeService } from './kanban-equipe.service';

export function syncActor(req: any): SyncActor {
  return { id: req.user?.userId || req.user?.id || req.user?.sub, role: req.user?.role };
}
class BoardDto {
  @IsString() @MaxLength(160) nome: string;
  @IsOptional() @IsString() @MaxLength(5000) descricao?: string;
  @IsOptional() @Matches(/^[a-zA-Z][a-zA-Z0-9]*$/) @MaxLength(40) icone?: string;
  @IsOptional() @IsIn(['gray','green','orange','red','gold','blue','violet','teal','pink']) cor?: string;
}
class ColumnDto {
  @IsString() @MaxLength(160) nome: string;
  @IsOptional() @IsIn(['queue','doing','review','done','none']) papel?: string;
  @IsOptional() @Matches(/^#[0-9a-fA-F]{6}$/) cor?: string;
  @IsOptional() @IsIn(['gray','green','orange','red','gold','blue','violet','teal','pink']) corInterface?: string;
  @IsOptional() @Matches(/^[a-zA-Z][a-zA-Z0-9]*$/) @MaxLength(40) icone?: string;
  @IsOptional() @IsIn(['dot','icon']) marcador?: string;
  @IsOptional() @IsBoolean() preenchida?: boolean;
  @IsOptional() @IsIn(['', 'todo', 'sched']) planoPublicacao?: string;
}
class CreateBoardDto extends BoardDto {
  @IsOptional() @IsArray() @ArrayMinSize(4) @ArrayMaxSize(60) @ValidateNested({ each: true }) @Type(() => ColumnDto) colunas?: ColumnDto[];
}
class UpdateColumnDto {
  @IsOptional() @IsString() @MaxLength(160) nome?: string;
  @IsOptional() @IsIn(['queue','doing','review','done','none']) papel?: string;
  @IsOptional() @Matches(/^#[0-9a-fA-F]{6}$/) cor?: string;
  @IsOptional() @IsIn(['gray','green','orange','red','gold','blue','violet','teal','pink']) corInterface?: string;
  @IsOptional() @Matches(/^[a-zA-Z][a-zA-Z0-9]*$/) @MaxLength(40) icone?: string;
  @IsOptional() @IsIn(['dot','icon']) marcador?: string;
  @IsOptional() @IsBoolean() preenchida?: boolean;
  @IsOptional() @IsIn(['', 'todo', 'sched']) planoPublicacao?: string;
  @IsOptional() @IsInt() @Min(0) ordem?: number;
}
class CommandDto {
  @IsOptional() @IsInt() @Min(0) versao?: number;
  @IsOptional() @IsString() @MaxLength(5000) motivo?: string;
}
class MoveDto extends CommandDto {
  @IsString() colunaId: string;
  @IsOptional() @IsString() antesDeId?: string;
  @IsOptional() @IsString() depoisDeId?: string;
}

class PessoaEquipeDto {
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(28) cargo?: string | null;
  @IsOptional() @IsIn(['owner', 'lead', 'maker', 'viewer']) funcao?: string;
}
class PermissoesDto { @IsObject() permissoes: Record<string, Record<string, boolean>>; }
class CargosDto { @IsArray() @ArrayMaxSize(24) @IsString({ each: true }) @MaxLength(28, { each: true }) cargos: string[]; }
class DiasClienteDto {
  @IsString() @MaxLength(120) cliente: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsArray() @ArrayMaxSize(7) @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true }) dias?: number[] | null;
}
const imagem = FileInterceptor('file', { limits: { fileSize: 2 * 1048576 } });

@Controller('kanban')
@UseGuards(JwtAuthGuard)
@RequerModulo({ todos: [ModuloSistema.GP] })
export class KanbanController {
  constructor(private readonly kanban: KanbanService, private readonly equipe: KanbanEquipeService) {}

  @Get('equipe') team(@Req() req: any) { return this.equipe.equipe(syncActor(req)); }
  @Patch('equipe/pessoas/:id') teamPerson(@Param('id') id: string, @Body() dto: PessoaEquipeDto, @Req() req: any) { return this.equipe.atualizarPessoa(id, dto, syncActor(req)); }
  @Put('equipe/permissoes') teamPerms(@Body() dto: PermissoesDto, @Req() req: any) { return this.equipe.salvarPermissoes(dto.permissoes, syncActor(req)); }
  @Put('equipe/cargos') teamCargos(@Body() dto: CargosDto, @Req() req: any) { return this.equipe.salvarCargos(dto.cargos, syncActor(req)); }
  @Put('equipe/dias-clientes') clientDays(@Body() dto: DiasClienteDto, @Req() req: any) { return this.equipe.salvarDiasCliente(dto.cliente, dto.dias ?? null, syncActor(req)); }
  @Post('equipe/eu/foto') @UseInterceptors(imagem) myPhoto(@UploadedFile() file: Express.Multer.File, @Req() req: any) { return this.equipe.salvarFoto(file, syncActor(req)); }
  @Delete('equipe/eu/foto') removeMyPhoto(@Req() req: any) { return this.equipe.removerFoto(syncActor(req)); }
  @Post('clientes/:id/logo') @UseInterceptors(imagem) clientLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() req: any) { return this.equipe.salvarLogoCliente(id, file, syncActor(req)); }

  @Get('quadros') list(@Req() req: any) { return this.kanban.listBoards(syncActor(req)); }
  @Post('quadros') create(@Body() dto: CreateBoardDto, @Req() req: any) { return this.kanban.createBoard(dto.nome, syncActor(req), dto); }
  @Get('quadros/:id') get(@Param('id') id: string, @Req() req: any) { return this.kanban.getBoard(id, syncActor(req)); }
  @Patch('quadros/:id') update(@Param('id') id: string, @Body() dto: BoardDto, @Req() req: any) { return this.kanban.updateBoard(id, dto, syncActor(req)); }
  @Delete('quadros/:id') remove(@Param('id') id: string, @Req() req: any) { return this.kanban.removeBoard(id, syncActor(req)); }
  @Get('quadros/:id/tarefas') tasks(@Param('id') id: string, @Query() query: any, @Req() req: any) { return this.kanban.listTasks(syncActor(req), query, id); }
  @Post('quadros/:id/colunas') addColumn(@Param('id') id: string, @Body() dto: ColumnDto, @Req() req: any) { return this.kanban.addColumn(id, dto, syncActor(req)); }
  @Patch('colunas/:id') editColumn(@Param('id') id: string, @Body() dto: UpdateColumnDto, @Req() req: any) { return this.kanban.updateColumn(id, dto, syncActor(req)); }
  @Delete('colunas/:id') deleteColumn(@Param('id') id: string, @Req() req: any) { return this.kanban.removeColumn(id, syncActor(req)); }
  @Get('tarefas/:id') task(@Param('id') id: string, @Req() req: any) { return this.kanban.getTask(id, syncActor(req)); }
  @Post('tarefas/:id/iniciar') start(@Param('id') id: string, @Body() dto: CommandDto, @Req() req: any) { return this.kanban.command(id, 'iniciar', dto, syncActor(req)); }
  @Post('tarefas/:id/pausar') pause(@Param('id') id: string, @Body() dto: CommandDto, @Req() req: any) { return this.kanban.command(id, 'pausar', dto, syncActor(req)); }
  @Post('tarefas/:id/entregar') deliver(@Param('id') id: string, @Body() dto: CommandDto, @Req() req: any) { return this.kanban.command(id, 'entregar', dto, syncActor(req)); }
  @Post('tarefas/:id/aprovar') approve(@Param('id') id: string, @Body() dto: CommandDto, @Req() req: any) { return this.kanban.command(id, 'aprovar', dto, syncActor(req)); }
  @Post('tarefas/:id/corrigir') correct(@Param('id') id: string, @Body() dto: CommandDto, @Req() req: any) { return this.kanban.command(id, 'corrigir', dto, syncActor(req)); }
  @Post('tarefas/:id/mover') move(@Param('id') id: string, @Body() dto: MoveDto, @Req() req: any) { return this.kanban.command(id, 'mover', dto, syncActor(req)); }
}
