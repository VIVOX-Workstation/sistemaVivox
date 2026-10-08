import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TipoPublicacao } from '@prisma/client';
import { CreatePublicacaoDto } from './create-publicacao.dto';
import { UpdatePublicacaoDto } from './update-publicacao.dto';
import { MesAcompanhamentoDto } from './mes-acompanhamento.dto';

describe('Acompanhamento DTO validation', () => {
  const base = { dataPublicacao: '2025-01-01T00:00:00-03:00', tipo: TipoPublicacao.POST };

  it('requires year/month, accepts transformed query strings and rejects invalid months', async () => {
    expect(await validate(plainToInstance(MesAcompanhamentoDto, { ano: '2025', mes: '1' }))).toHaveLength(0);
    for (const query of [{}, { ano: '2025' }, { mes: '1' }, { ano: '2025', mes: '13' }, { ano: '2025', mes: '0' }, { ano: 'abc', mes: '1' }, { ano: '2025', mes: '1.5' }]) {
      expect((await validate(plainToInstance(MesAcompanhamentoDto, query))).length).toBeGreaterThan(0);
    }
  });

  it('accepts HTTP/HTTPS and null metrics, rejects invalid URLs, dates and counters', async () => {
    expect(await validate(plainToInstance(CreatePublicacaoDto, { ...base, link: 'https://example.com/post', curtidas: null, visualizacoes: 0 }))).toHaveLength(0);
    for (const invalid of [
      { dataPublicacao: '2025-02-30' }, { dataPublicacao: null }, { tipo: null }, { tipo: 'INVALID' },
      { link: 'ftp://example.com' }, { link: 'javascript:alert(1)' }, { link: 'example.com' }, { link: 'https://example.com/' + 'a'.repeat(500) },
      { curtidas: -1 }, { comentarios: 1.5 }, { salvamentos: '1' }, { compartilhamentos: false }, { assunto: 1 },
    ]) {
      expect((await validate(plainToInstance(CreatePublicacaoDto, { ...base, ...invalid }))).length).toBeGreaterThan(0);
    }
  });

  it('permits partial updates and clearing optional fields, but never null dates or types', async () => {
    expect(await validate(plainToInstance(UpdatePublicacaoDto, {}))).toHaveLength(0);
    expect(await validate(plainToInstance(UpdatePublicacaoDto, { assunto: null, link: null, curtidas: null }))).toHaveLength(0);
    for (const data of [{ dataPublicacao: null }, { tipo: null }, { visualizacoes: -1 }]) {
      expect((await validate(plainToInstance(UpdatePublicacaoDto, data))).length).toBeGreaterThan(0);
    }
  });

  it('aceita alcance inteiro >= 0 (ou null para limpar) e recusa negativo/decimal', async () => {
    expect(await validate(plainToInstance(CreatePublicacaoDto, { ...base, alcance: 1500 }))).toHaveLength(0);
    expect(await validate(plainToInstance(UpdatePublicacaoDto, { alcance: null }))).toHaveLength(0);
    expect((await validate(plainToInstance(CreatePublicacaoDto, { ...base, alcance: -1 }))).length).toBeGreaterThan(0);
    expect((await validate(plainToInstance(CreatePublicacaoDto, { ...base, alcance: 1.5 }))).length).toBeGreaterThan(0);
  });
});
