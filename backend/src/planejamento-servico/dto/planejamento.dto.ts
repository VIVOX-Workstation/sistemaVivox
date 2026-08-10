import { IsString, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusPlanejamento, StatusEscopoItem, StatusMarco, TipoReferencia } from '@prisma/client';

export class EscopoItemDto {
  @IsString()
  titulo: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsEnum(StatusEscopoItem)
  @IsOptional()
  status?: StatusEscopoItem;
  
  @IsOptional()
  ordem?: number;
}

export class CreatePlanejamentoDto {
  @IsString()
  servicoContratadoId: string;

  @IsString()
  @IsOptional()
  ideiaBriefing?: string;

  @IsEnum(StatusPlanejamento)
  @IsOptional()
  statusGeral?: StatusPlanejamento;

  @IsDateString()
  @IsOptional()
  prazoEntrega?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsaveisIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EscopoItemDto)
  @IsOptional()
  escopoInicial?: EscopoItemDto[];
}

export class UpdatePlanejamentoDto {
  @IsString()
  @IsOptional()
  ideiaBriefing?: string;

  @IsEnum(StatusPlanejamento)
  @IsOptional()
  statusGeral?: StatusPlanejamento;

  @IsDateString()
  @IsOptional()
  prazoEntrega?: string;

  @IsOptional()
  @IsArray()
  flowNodes?: any;

  @IsOptional()
  @IsArray()
  flowEdges?: any;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsaveisIds?: string[];
}

export class CreateMarcoDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsDateString()
  dataPrevista: string;

  @IsOptional()
  @IsString()
  dependeDeId?: string;

  @IsDateString()
  @IsOptional()
  dataRealizada?: string;

  @IsEnum(StatusMarco)
  @IsOptional()
  status?: StatusMarco;
}

export class UpdateMarcoDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataPrevista?: string;

  @IsOptional()
  @IsDateString()
  dataRealizada?: string;

  @IsOptional()
  @IsEnum(StatusMarco)
  status?: StatusMarco;

  @IsOptional()
  @IsString()
  dependeDeId?: string;
}

export class CreateReferenciaDto {
  @IsEnum(TipoReferencia)
  tipo: TipoReferencia;

  @IsString()
  urlOuArquivo: string;

  @IsString()
  @IsOptional()
  descricao?: string;
}

export class CreateNotaHistoricoDto {
  @IsString()
  descricao: string;
}
