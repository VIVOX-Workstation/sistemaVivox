import { IsString, IsOptional } from 'class-validator';

export class GerarChecklistIaDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  clienteId?: string;
}
