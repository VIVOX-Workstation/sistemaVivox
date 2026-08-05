import { IsString, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { OrigemDado } from '@prisma/client';

export class CreateMetricaDto {
  @IsString()
  clienteId: string;

  @IsDateString()
  periodoInicio: string;

  @IsDateString()
  periodoFim: string;

  @IsEnum(OrigemDado)
  origem: OrigemDado;

  @IsNumber()
  @IsOptional()
  alcanceTotal?: number;

  @IsNumber()
  @IsOptional()
  engajamentoTotal?: number;

  @IsNumber()
  @IsOptional()
  notaGmb?: number;

  @IsNumber()
  @IsOptional()
  avaliacoesGmbPeriodo?: number;
}
