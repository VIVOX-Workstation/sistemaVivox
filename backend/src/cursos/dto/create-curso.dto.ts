import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateCursoDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  capaUrl?: string;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;

  @IsOptional()
  @IsNumber()
  ordem?: number;

  @IsOptional()
  @IsNumber()
  capaPosX?: number;

  @IsOptional()
  @IsNumber()
  capaPosY?: number;
}
