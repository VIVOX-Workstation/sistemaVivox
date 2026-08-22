import { IsString } from 'class-validator';

export class AddComentarioDto {
  @IsString()
  texto: string;
}
