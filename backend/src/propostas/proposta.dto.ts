import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
  ValidateIf,
} from 'class-validator';

export const DEMOS_PROPOSTA = ['ensino'] as const;

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

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsIn(DEMOS_PROPOSTA)
  demo?: string | null;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SecaoPropostaDto)
  secoes: SecaoPropostaDto[];
}

const aparar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Proposta em PDF: campos de texto do multipart; o arquivo vem em "arquivo".
export class SalvarPropostaPdfDto {
  @Transform(aparar)
  @IsString()
  @IsNotEmpty({ message: 'Informe o título da proposta.' })
  @MaxLength(200)
  titulo: string;

  @Transform(aparar)
  @IsString()
  @IsNotEmpty({ message: 'Informe o destinatário.' })
  @MaxLength(200)
  destinatario: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  apresentacao?: string;

  // O formulário manda "" quando a validade fica em branco.
  @Transform(({ value }) => (value === '' ? null : value))
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  validade?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  corDestaque?: string;
}
