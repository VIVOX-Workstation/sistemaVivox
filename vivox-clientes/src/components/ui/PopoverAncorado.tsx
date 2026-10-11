import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopoverAncoradoProps {
  /** Elemento que abre o popover; o popover alinha pela borda direita dele */
  ancoraRef: React.RefObject<HTMLElement | null>;
  aberto: boolean;
  onFechar: () => void;
  children: React.ReactNode;
}

const MARGEM = 8;

/**
 * Popover renderizado no <body> (portal) com posição fixa calculada a partir da âncora.
 * Os painéis pw-glass-panel criam contextos de empilhamento próprios (isolation/backdrop-filter),
 * e o menu lateral fica por cima do conteúdo: dentro deles, nenhum z-index resolve.
 * Também mantém o popover dentro da largura da tela em telas estreitas.
 */
export function PopoverAncorado({ ancoraRef, aberto, onFechar, children }: PopoverAncoradoProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

  const posicionar = useCallback(() => {
    const ancora = ancoraRef.current;
    const pop = popoverRef.current;
    if (!ancora || !pop) return;
    const r = ancora.getBoundingClientRect();
    const largura = pop.offsetWidth;
    const left = Math.min(Math.max(r.right - largura, MARGEM), window.innerWidth - largura - MARGEM);
    const top = r.bottom + MARGEM;
    setPos({ top, left: Math.max(left, MARGEM), maxHeight: window.innerHeight - top - MARGEM });
  }, [ancoraRef]);

  useLayoutEffect(() => {
    if (!aberto) {
      setPos(null);
      return;
    }
    posicionar();
  }, [aberto, posicionar]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (popoverRef.current?.contains(alvo) || ancoraRef.current?.contains(alvo)) return;
      onFechar();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('resize', posicionar);
      window.removeEventListener('scroll', posicionar, true);
    };
  }, [aberto, onFechar, ancoraRef, posicionar]);

  if (!aberto) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[70] overflow-y-auto"
      // Primeiro render invisível só para medir a largura, depois posiciona
      style={pos ? { top: pos.top, left: pos.left, maxHeight: pos.maxHeight } : { top: 0, left: 0, visibility: 'hidden' }}
    >
      {children}
    </div>,
    document.body,
  );
}
