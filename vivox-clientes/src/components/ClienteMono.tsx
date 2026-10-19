import type { Cliente } from '../types';
import { resolveMediaUrl } from '../utils/mediaUrl';

// Monograma do cliente no layout clean (.vxp .mono): logo quando houver, senão as iniciais.

export function sigla(nome: string) {
  const p = nome.trim().split(/\s+/).filter((w) => w.length > 2);
  const base = p.length ? p : [nome];
  return ((base[0]?.[0] ?? '?') + (base[1]?.[0] ?? '')).toUpperCase();
}

export function ClienteMono({ cliente, lg }: { cliente: Pick<Cliente, 'nomeFantasia' | 'logoUrl'>; lg?: boolean }) {
  return (
    <span className={`mono${lg ? ' lg' : ''}`} style={cliente.logoUrl ? { overflow: 'hidden' } : undefined}>
      {cliente.logoUrl ? (
        <img src={resolveMediaUrl(cliente.logoUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        sigla(cliente.nomeFantasia)
      )}
    </span>
  );
}
