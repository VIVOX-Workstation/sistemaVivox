import { IsString, IsOptional, IsEnum } from 'class-validator';
import { StatusChamado } from '@prisma/client';

export class UpdateChamadoDto {
  @IsOptional()
  @IsEnum(StatusChamado)
  status?: StatusChamado;

  @IsOptional()
  @IsString()
  descricaoProblema?: string;

  @IsOptional()
  @IsString()
  proprietarioId?: string | null;
}
