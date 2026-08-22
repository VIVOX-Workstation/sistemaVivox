import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class AddChecklistItemDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsNumber()
  ordem?: number;
}

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsBoolean()
  concluido?: boolean;

  @IsOptional()
  @IsNumber()
  ordem?: number;
}
