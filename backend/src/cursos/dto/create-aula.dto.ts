import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateAulaDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsString()
  videoUrl: string;

  @IsOptional()
  @IsNumber()
  duracaoSeg?: number;

  @IsOptional()
  @IsNumber()
  ordem?: number;

  @IsOptional()
  @IsString()
  capaUrl?: string;

  @IsOptional()
  @IsNumber()
  capaPosX?: number;

  @IsOptional()
  @IsNumber()
  capaPosY?: number;
}
