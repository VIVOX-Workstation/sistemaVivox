import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { TipoServico, StatusServico } from '@prisma/client';

export class CreateServicoDto {
  @IsString()
  clienteId: string;

  @IsEnum(TipoServico)
  tipoServico: TipoServico;

  @IsEnum(StatusServico)
  status: StatusServico;

  @IsDateString()
  dataContratacao: string;

  @IsDateString()
  @IsOptional()
  dataEntrega?: string;

  @IsNumber()
  @IsOptional()
  valor?: number;

  @IsString()
  @IsOptional()
  descricaoEscopo?: string;
}
