import { InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function chave(): Buffer {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) throw new InternalServerErrorException('Configure JWT_SECRET para guardar os links das propostas.');
  // Chave exclusiva desta finalidade, derivada do segredo já configurado no servidor.
  return createHash('sha256').update('vivox:proposta-link:v1\0').update(segredo).digest();
}

export function criptografarLink(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', chave(), iv);
  const texto = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), texto].map(p => p.toString('hex')).join(':');
}

export function decifrarLink(valor: string): string {
  const key = chave();
  try {
    if (!/^[a-f0-9]{24}:[a-f0-9]{32}:[a-f0-9]{128}$/.test(valor)) throw new Error('Formato inválido');
    const [iv, tag, texto] = valor.split(':').map(p => Buffer.from(p, 'hex'));
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const token = Buffer.concat([decipher.update(texto), decipher.final()]).toString('utf8');
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Token inválido');
    return token;
  } catch {
    throw new InternalServerErrorException('Não foi possível recuperar o link. Gere um novo link para esta proposta.');
  }
}
