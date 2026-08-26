import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CategoriaChamado, UrgenciaChamado } from '@prisma/client';

export class CreateChamadoDto {
  @IsString()
  clienteId: string;

  @IsOptional()
  @IsString()
  servicoId?: string;

  @IsOptional()
  @IsString()
  itemPlanejadoId?: string;

  @IsOptional()
  @IsString()
  itemTitulo?: string;

  @IsString()
  titulo: string;

  @IsEnum(CategoriaChamado)
  categoria: CategoriaChamado;

  @IsOptional()
  @IsEnum(UrgenciaChamado)
  urgencia?: UrgenciaChamado;

  @IsString()
  descricaoProblema: string;
}
