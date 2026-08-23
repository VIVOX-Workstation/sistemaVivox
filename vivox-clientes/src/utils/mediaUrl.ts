/**
 * Resolve URLs de imagens e mídias do storage (MinIO/S3).
 * Adapta dinamicamente se a imagem foi salva com localhost ou IP público quando executado em produção.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) return '';

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    // Se estiver em produção (não-localhost)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return url
        .replace('http://localhost:9000', `http://${hostname}:9000`)
        .replace('http://127.0.0.1:9000', `http://${hostname}:9000`)
        .replace('http://minio:9000', `http://${hostname}:9000`);
    }
  }

  return url;
}
