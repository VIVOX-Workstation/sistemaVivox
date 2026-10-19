import type { Cliente } from '../types';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { sigla } from '../utils/clean';

// Monograma do cliente no layout clean (.vxp .mono): logo quando houver, senão as iniciais.

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
