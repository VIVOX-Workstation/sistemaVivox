import { InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function encryptionKey(): Buffer {
  const key = process.env.PORTAL_ENCRYPTION_KEY;
  if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) {
    throw new InternalServerErrorException(
      'Configure PORTAL_ENCRYPTION_KEY com 64 caracteres hexadecimais (32 bytes) para o acesso ao portal.',
    );
  }
  return Buffer.from(key, 'hex');
}

export function encryptPortalPassword(password: string): string {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('hex')).join(':');
}

export function decryptPortalPassword(encrypted: string | null): string {
  const key = encryptionKey();
  try {
    const parts = encrypted?.split(':');
    if (!parts || parts.length !== 3 || parts.some((part) => !/^(?:[a-fA-F0-9]{2})+$/.test(part))) {
      throw new Error('Formato inválido');
    }
    const [iv, tag, ciphertext] = parts.map((part) => Buffer.from(part, 'hex'));
    if (iv.length !== 12 || tag.length !== 16) throw new Error('Formato inválido');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new InternalServerErrorException('Não foi possível decifrar a senha do portal. Verifique PORTAL_ENCRYPTION_KEY ou redefina a senha.');
  }
}

export function generatePortalPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  // Rejeição evita viés de módulo na seleção dos caracteres.
  const limit = 256 - (256 % alphabet.length);
  let password = '';
  while (password.length < 10) {
    for (const byte of randomBytes(16)) {
      if (byte < limit) password += alphabet[byte % alphabet.length];
      if (password.length === 10) break;
    }
  }
  return password;
}
