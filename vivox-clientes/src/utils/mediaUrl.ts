/**
 * Resolve URLs de imagens e mídias do storage (MinIO/S3).
 * Corrige registros antigos salvos com hosts internos/legados (rede Docker, IP puro)
 * apontando sempre para o domínio público e HTTPS do MinIO em produção.
 */
const LEGACY_MEDIA_HOSTS = [
  'http://localhost:9000',
  'http://127.0.0.1:9000',
  'http://minio:9000',
  'http://179.198.120.113:9000',
];
const PUBLIC_MINIO_HOST = 'https://minio.vivoxmarketing.com.br';

export function resolveMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) return '';

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    // Se estiver em produção (não-localhost)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const legacyHost = LEGACY_MEDIA_HOSTS.find((host) => url.startsWith(host));
      if (legacyHost) {
        return PUBLIC_MINIO_HOST + url.slice(legacyHost.length);
      }
    }
  }

  return url;
}
