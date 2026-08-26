import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateModuloDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsNumber()
  ordem?: number;
}
