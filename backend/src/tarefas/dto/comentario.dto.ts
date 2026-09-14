import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class AddComentarioDto {
  @IsString()
  texto: string;

  @IsOptional()
  @IsBoolean()
  sistema?: boolean;
}
