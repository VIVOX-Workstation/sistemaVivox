import { useEffect, type RefObject } from 'react';

// Elementos que recebem refração nas bordas via filtro SVG
export const REFRACT_SELECTOR = '.pw-glass, .pw-glass-card, .pw-glass-pill, .pw-glass-control, .pw-glass-tab, .pw-glass-modal';
// Todos os elementos que recebem o reflexo animado do ponteiro
export const SHINE_SELECTOR = `${REFRACT_SELECTOR}, .pw-card`;

const MAX_CACHE_SIZE = 64;

/**
 * Hook escopado do efeito Liquid Glass do Painel Vivox
 * Adaptado com fidelidade às linhas 3200+ de Painel VIVOX Liquid Glass.html
 * - Reflexo deslizante com fade (--mx / --my / .lg-lit)
 * - Refração nas bordas em navegadores Chromium (mapa de lente convexa com aberração cromática RGB)
 * - Ciclo de vida com observers, cache limitado (sem memory leaks) e fallbacks acessíveis
 */
export function useLiquidGlass(
  target: RefObject<HTMLElement | null> | HTMLElement | null,
  isReady: boolean = true
) {
  useEffect(() => {
    if (!isReady) return;
    const container = target && 'current' in target ? target.current : target;
    if (!container) return;

    // Checagem de acessibilidade para movimentos e transparências reduzidas
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersReducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;

    // 1. Reflexo do ponteiro: desliza suavemente e desaparece devagar sem piscar
    let litEl: HTMLElement | null = null;
    const setLit = (el: HTMLElement | null) => {
      if (litEl === el) return;
      if (litEl) litEl.classList.remove('lg-lit');
      if (el && !prefersReducedMotion) el.classList.add('lg-lit');
      litEl = el;
    };

    // Um update por frame (rAF) e rect reaproveitado enquanto o ponteiro estiver no mesmo elemento
    let rafId: number | null = null;
    let pendingX = 0;
    let pendingY = 0;
    let pendingEl: HTMLElement | null = null;
    let rectEl: HTMLElement | null = null;
    let cachedRect: DOMRect | null = null;
    const invalidateRect = () => {
      cachedRect = null;
    };

    const flushPointer = () => {
      rafId = null;
      const el = pendingEl;
      if (!el) return;
      if (rectEl !== el || !cachedRect) {
        rectEl = el;
        cachedRect = el.getBoundingClientRect();
      }
      const r = cachedRect;
      if (r.width > 0 && r.height > 0) {
        const mx = (((pendingX - r.left) / r.width) * 100).toFixed(1) + '%';
        const my = (((pendingY - r.top) / r.height) * 100).toFixed(1) + '%';
        el.style.setProperty('--mx', mx);
        el.style.setProperty('--my', my);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      const targetEl = e.target as HTMLElement | null;
      const el = targetEl?.closest ? (targetEl.closest(SHINE_SELECTOR) as HTMLElement | null) : null;
      if (!el || !container.contains(el)) {
        pendingEl = null;
        setLit(null);
        return;
      }
      setLit(el);
      pendingEl = el;
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (rafId === null) rafId = requestAnimationFrame(flushPointer);
    };

    const handlePointerLeave = () => {
      pendingEl = null;
      setLit(null);
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('scroll', invalidateRect, { passive: true, capture: true });
    window.addEventListener('resize', invalidateRect, { passive: true });
    const stopPointer = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      pendingEl = null;
      window.removeEventListener('scroll', invalidateRect, true);
      window.removeEventListener('resize', invalidateRect);
    };

    // 2. Refração SVG: apenas navegadores Chromium suportam filtro SVG em backdrop-filter
    const ua = navigator.userAgent;
    const isChromium = /Chrome\/|Chromium\//.test(ua) && !/Firefox\//.test(ua);
    if (!isChromium || prefersReducedTransparency) {
      return () => {
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('pointerleave', handlePointerLeave);
        stopPointer();
        setLit(null);
      };
    }

    const NS = 'http://www.w3.org/2000/svg';
    let filterSvg = document.getElementById('pw-lg-filters') as SVGSVGElement | null;
    let createdSvg = false;
    if (!filterSvg) {
      filterSvg = document.createElementNS(NS, 'svg') as SVGSVGElement;
      filterSvg.id = 'pw-lg-filters';
      filterSvg.setAttribute('width', '0');
      filterSvg.setAttribute('height', '0');
      filterSvg.style.position = 'absolute';
      filterSvg.style.pointerEvents = 'none';
      filterSvg.setAttribute('aria-hidden', 'true');
      const defsEl = document.createElementNS(NS, 'defs');
      defsEl.id = 'pw-lg-defs';
      filterSvg.appendChild(defsEl);
      document.body.appendChild(filterSvg);
      createdSvg = true;
    }

    const defs = filterSvg.querySelector('defs') || filterSvg;
    const filterCache = new Map<string, string>();
    const elementFilters = new Map<HTMLElement, string>();
    const filterRefCount = new Map<string, number>();
    let filterCount = 0;

    // Mapa de deslocamento da lente com cantos arredondados (neutro no centro e puxando borda)
    function lensMap(w: number, h: number, r: number, depth: number): string {
      const s = Math.min(1, 420 / Math.max(w, h));
      const cw = Math.max(2, Math.round(w * s));
      const ch = Math.max(2, Math.round(h * s));
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      const img = ctx.createImageData(cw, ch);
      const d = img.data;
      const hw = w / 2;
      const hh = h / 2;
      const rr = Math.min(r, hw, hh);

      for (let j = 0; j < ch; j++) {
        const py = (j + 0.5) / s - hh;
        const qy = Math.abs(py) - (hh - rr);
        for (let i = 0; i < cw; i++) {
          const px = (i + 0.5) / s - hw;
          const qx = Math.abs(px) - (hw - rr);
          let dist: number, nx: number, ny: number;
          if (qx > 0 && qy > 0) {
            const len = Math.hypot(qx, qy) || 1;
            dist = rr - len;
            nx = (qx / len) * Math.sign(px);
            ny = (qy / len) * Math.sign(py);
          } else if (qx > qy) {
            dist = rr - qx;
            nx = Math.sign(px);
            ny = 0;
          } else {
            dist = rr - qy;
            nx = 0;
            ny = Math.sign(py);
          }
          const t = 1 - Math.min(Math.max(dist / depth, 0), 1);
          const m = t * t * (3 - 2 * t);
          const k = (j * cw + i) * 4;
          d[k] = 128 - nx * m * 127;
          d[k + 1] = 128 - ny * m * 127;
          d[k + 2] = 128;
          d[k + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      return canvas.toDataURL();
    }

    function channel(scale: number, matrix: string, name: string): string {
      return (
        '<feDisplacementMap in="SourceGraphic" in2="map" scale="' +
        scale +
        '" xChannelSelector="R" yChannelSelector="G" result="d' +
        name +
        '"/>' +
        '<feColorMatrix in="d' +
        name +
        '" type="matrix" values="' +
        matrix +
        '" result="' +
        name +
        '"/>'
      );
    }

    function filterFor(w: number, h: number, r: number): string {
      const depth = Math.max(8, Math.min(22, Math.min(w, h) * 0.34));
      const scale = Math.round(depth * 2.3);
      const key = `${w}x${h}x${r}`;
      const cached = filterCache.get(key);
      if (cached) return cached;

      // Limite de cache para evitar leaks: evict com segurança de referências ativas
      if (filterCache.size >= MAX_CACHE_SIZE) {
        let keyToEvict: string | null = null;
        for (const [k, cid] of filterCache.entries()) {
          if (!filterRefCount.has(cid) || (filterRefCount.get(cid) ?? 0) <= 0) {
            keyToEvict = k;
            break;
          }
        }
        if (!keyToEvict) {
          keyToEvict = filterCache.keys().next().value || null;
        }
        if (keyToEvict) {
          const oldId = filterCache.get(keyToEvict);
          if (oldId) {
            elementFilters.forEach((cid, elem) => {
              if (cid === oldId) {
                elem.style.removeProperty('--lg-filter');
                elementFilters.delete(elem);
              }
            });
            filterRefCount.delete(oldId);
            const oldFilterEl = defs.querySelector(`#${oldId}`);
            if (oldFilterEl) defs.removeChild(oldFilterEl);
          }
          filterCache.delete(keyToEvict);
        }
      }

      const id = 'pw-lg-f' + ++filterCount;
      const f = document.createElementNS(NS, 'filter');
      f.setAttribute('id', id);
      f.setAttribute('x', '0');
      f.setAttribute('y', '0');
      f.setAttribute('width', String(w));
      f.setAttribute('height', String(h));
      f.setAttribute('filterUnits', 'userSpaceOnUse');
      f.setAttribute('primitiveUnits', 'userSpaceOnUse');
      f.setAttribute('color-interpolation-filters', 'sRGB');

      // Aberração cromática sutil: canais R, G e B em escalas levemente desfasadas
      f.innerHTML =
        '<feImage href="' +
        lensMap(w, h, r, depth) +
        '" x="0" y="0" width="' +
        w +
        '" height="' +
        h +
        '" preserveAspectRatio="none" result="map"/>' +
        channel(scale, '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', 'r') +
        channel(Math.round(scale * 0.93), '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', 'g') +
        channel(Math.round(scale * 0.86), '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0', 'b') +
        '<feBlend in="r" in2="g" mode="screen" result="rg"/>' +
        '<feBlend in="rg" in2="b" mode="screen"/>';

      defs.appendChild(f);
      filterCache.set(key, id);
      return id;
    }

    // Tamanho arredondado da ultima aplicacao: evita recalcular se nada mudou
    const lastSize = new WeakMap<HTMLElement, string>();
    // Apenas elementos proximos da viewport recebem filtro
    const visible = new Set<HTMLElement>();

    function applyRefraction(el: HTMLElement) {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (!w || !h) return;
      const sizeKey = w + 'x' + h;
      if (lastSize.get(el) === sizeKey && elementFilters.has(el)) return;
      lastSize.set(el, sizeKey);
      const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const id = filterFor(w, h, Math.round(Math.min(r, w / 2, h / 2)));
      const prevId = elementFilters.get(el);
      if (prevId !== id) {
        if (prevId) {
          const count = (filterRefCount.get(prevId) || 1) - 1;
          if (count <= 0) filterRefCount.delete(prevId);
          else filterRefCount.set(prevId, count);
        }
        elementFilters.set(el, id);
        filterRefCount.set(id, (filterRefCount.get(id) || 0) + 1);
        el.style.setProperty('--lg-filter', `url(#${id})`);
      }
    }

    function releaseElement(el: HTMLElement) {
      const prevId = elementFilters.get(el);
      if (prevId) {
        const count = (filterRefCount.get(prevId) || 1) - 1;
        if (count <= 0) filterRefCount.delete(prevId);
        else filterRefCount.set(prevId, count);
        elementFilters.delete(el);
      }
      lastSize.delete(el);
      el.style.removeProperty('--lg-filter');
    }

    // Fila processada em lotes pequenos, um lote por frame
    const BATCH = 6;
    const queue = new Set<HTMLElement>();
    let rafQueueId: number | null = null;
    function processQueue() {
      rafQueueId = null;
      let n = 0;
      for (const element of queue) {
        queue.delete(element);
        if (visible.has(element) && container?.contains(element)) {
          applyRefraction(element);
          if (++n >= BATCH) break;
        }
      }
      if (queue.size > 0) rafQueueId = requestAnimationFrame(processQueue);
    }
    function scheduleRefraction(el: HTMLElement) {
      if (!visible.has(el)) return;
      queue.add(el);
      if (rafQueueId === null) rafQueueId = requestAnimationFrame(processQueue);
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            visible.add(el);
            scheduleRefraction(el);
          } else {
            visible.delete(el);
            queue.delete(el);
            releaseElement(el);
          }
        });
      },
      { rootMargin: '300px 0px' }
    );

    const ro = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        const sizeKey = Math.round(el.offsetWidth) + 'x' + Math.round(el.offsetHeight);
        if (lastSize.get(el) === sizeKey) return; // variacao sub-pixel ou disparo inicial redundante
        scheduleRefraction(el);
      });
    });

    function watch(el: HTMLElement) {
      io.observe(el);
      ro.observe(el);
    }
    function unwatch(el: HTMLElement) {
      io.unobserve(el);
      ro.unobserve(el);
      visible.delete(el);
      queue.delete(el);
      releaseElement(el);
    }

    function observeElements(root: Node) {
      if (root.nodeType !== 1) return;
      const el = root as HTMLElement;
      if (el.matches?.(REFRACT_SELECTOR)) watch(el);
      el.querySelectorAll?.(REFRACT_SELECTOR).forEach((child) => watch(child as HTMLElement));
    }

    // Passada inicial: o IntersectionObserver notifica so os visiveis, aplicados em lotes
    observeElements(container);

    // MutationObserver para observar troca de abas e novos nós dinâmicos
    const mo = new MutationObserver((records) => {
      records.forEach((rec) => {
        rec.addedNodes.forEach((node) => {
          observeElements(node);
        });
        rec.removedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const el = node as HTMLElement;
            if (el.matches?.(REFRACT_SELECTOR)) unwatch(el);
            el.querySelectorAll?.(REFRACT_SELECTOR).forEach((child) => unwatch(child as HTMLElement));
          }
        });
      });
    });

    mo.observe(container, { childList: true, subtree: true });

    const handleWindowResize = () => {
      visible.forEach((el) => scheduleRefraction(el));
    };
    window.addEventListener('resize', handleWindowResize, { passive: true });

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleWindowResize);
      stopPointer();
      setLit(null);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      if (rafQueueId !== null) {
        cancelAnimationFrame(rafQueueId);
        rafQueueId = null;
      }
      queue.clear();
      visible.clear();
      elementFilters.forEach((_id, elem) => {
        elem.style.removeProperty('--lg-filter');
      });
      elementFilters.clear();
      filterRefCount.clear();
      filterCache.forEach((id) => {
        const el = defs.querySelector(`#${id}`);
        if (el) defs.removeChild(el);
      });
      filterCache.clear();
      if (createdSvg && filterSvg && filterSvg.parentNode) {
        filterSvg.parentNode.removeChild(filterSvg);
      }
    };
  }, [target, isReady, target && 'current' in target ? target.current : null]);
}
