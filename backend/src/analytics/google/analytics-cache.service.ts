import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

@Injectable()
export class AnalyticsCacheService {
  private readonly logger = new Logger(AnalyticsCacheService.name);
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Obtém valor do cache se não tiver expirado
   */
  get<T>(key: string): { data: T; cachedAt: string } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return {
      data: entry.data as T,
      cachedAt: new Date(entry.createdAt).toISOString(),
    };
  }

  /**
   * Armazena valor no cache com TTL em segundos (padrão: 3600 = 1 hora)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 3600): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
      createdAt: now,
    });
  }

  /**
   * Invalida uma chave específica
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalida todas as chaves associadas a um cliente
   */
  invalidateCliente(clienteId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`cliente_${clienteId}`) || key.includes(clienteId)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }
}
