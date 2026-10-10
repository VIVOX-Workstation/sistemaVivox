import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsArray, MaxLength, ArrayMaxSize, ValidateNested, IsUrl } from 'class-validator';
import { PrioridadeTarefa } from '@prisma/client';
import { Type } from 'class-transformer';

export class LinkReferenciaDto {
  @IsString() @MaxLength(100) id: string;
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048) url: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(160) by?: string;
  @IsOptional() @IsDateString() at?: string;
}

export class CreateTarefaDto {
  @IsOptional() @IsString() @MaxLength(160) clienteNome?: string;
  @IsOptional() @IsString() @MaxLength(160) fonte?: string;
  @IsOptional() @IsString() @MaxLength(1000) subtitulo?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => LinkReferenciaDto) linksReferencia?: LinkReferenciaDto[];
  @IsOptional()
  @IsString()
  quadroId?: string;

  @IsOptional()
  @IsString()
  colunaId?: string;

  @IsOptional()
  @IsString()
  revisorId?: string;
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(PrioridadeTarefa)
  prioridade?: PrioridadeTarefa;

  @IsOptional()
  @IsDateString()
  prazo?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsNumber()
  horasEstimadas?: number;

  @IsOptional()
  @IsNumber()
  horasGastas?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  ordem?: number;

  @IsOptional()
  @IsString()
  responsavelId?: string;

  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsOptional()
  @IsString()
  projetoId?: string;

  @IsOptional()
  @IsString()
  servicoId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  checklist?: string[];
}
