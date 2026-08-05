import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateMidiaDto {
  @IsString()
  clienteId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  url?: string;
}
