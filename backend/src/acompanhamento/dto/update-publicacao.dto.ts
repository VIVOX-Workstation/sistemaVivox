import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicacaoDto } from './create-publicacao.dto';

// Só campos opcionais e anuláveis podem ser limpos; data e tipo nunca aceitam null.
export class UpdatePublicacaoDto extends PartialType(CreatePublicacaoDto, { skipNullProperties: false }) {}
