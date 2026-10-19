import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
  ValidateIf,
} from 'class-validator';

export class SecaoPropostaDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(100000)
  html?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string;

  @IsString()
  @MaxLength(30000)
  texto: string;
}

// Edição substitui o documento completo; campos internos nunca vêm do cliente.
export class SalvarPropostaDto {
  @IsString()
  @Matches(/\S/)
  @MaxLength(200)
  titulo: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(200)
  destinatario: string;

  @IsString()
  @MaxLength(5000)
  apresentacao: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  validade?: string | null;

  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  corDestaque: string;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SecaoPropostaDto)
  secoes: SecaoPropostaDto[];
}
