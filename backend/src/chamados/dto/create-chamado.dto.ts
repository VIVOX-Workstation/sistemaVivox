import { IsString, IsOptional } from 'class-validator';

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
  descricaoProblema: string;
}
