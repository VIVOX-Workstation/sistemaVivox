import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { OrigemDado } from '@prisma/client';
import { CreatePublicacaoDto } from './create-publicacao.dto';

export const IMPORTACAO_MAX_LINHAS = 5000;

// Item do backup JSON: id de uma publicação deste cliente atualiza a existente; sem id (ou id
// desconhecido, ex.: backup de outro cliente ou publicação já excluída) cria uma nova.
export class ImportarPublicacaoItemDto extends CreatePublicacaoDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsEnum(OrigemDado)
  origemDado?: OrigemDado;
}

export class ImportarPublicacoesDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'O arquivo não tem nenhuma publicação.' })
  @ArrayMaxSize(IMPORTACAO_MAX_LINHAS, { message: `Importe no máximo ${IMPORTACAO_MAX_LINHAS} publicações por vez.` })
  @ValidateNested({ each: true })
  @Type(() => ImportarPublicacaoItemDto)
  publicacoes: ImportarPublicacaoItemDto[];
}
