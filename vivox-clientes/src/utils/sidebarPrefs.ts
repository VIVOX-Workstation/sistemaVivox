import { useCallback, useEffect, useState } from 'react';

/**
 * Preferências da barra lateral (ficam neste navegador).
 * - collapsed: barra recolhida (só ícones)
 * - glow: luz dourada que pulsa no topo da barra
 */
export interface SidebarPrefs {
  collapsed: boolean;
  glow: boolean;
}

const KEY_COLLAPSED = '@Vivox:sidebarCollapsed';
const KEY_GLOW = '@Vivox:sidebarGlow';
const EVENT = 'vivox:sidebar-prefs';

function read(): SidebarPrefs {
  try {
    return {
      collapsed: localStorage.getItem(KEY_COLLAPSED) === 'true',
      glow: localStorage.getItem(KEY_GLOW) !== 'false',
    };
  } catch {
    return { collapsed: false, glow: true };
  }
}

function write(next: Partial<SidebarPrefs>) {
  try {
    if (next.collapsed !== undefined) localStorage.setItem(KEY_COLLAPSED, String(next.collapsed));
    if (next.glow !== undefined) localStorage.setItem(KEY_GLOW, String(next.glow));
  } catch {
    /* sem armazenamento: a preferência vale só até recarregar */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Lê e altera as preferências da barra lateral; Layout e Configurações ficam em sincronia. */
export function useSidebarPrefs() {
  const [prefs, setPrefs] = useState<SidebarPrefs>(read);

  useEffect(() => {
    const sync = () => setPrefs(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const update = useCallback((next: Partial<SidebarPrefs>) => {
    setPrefs((prev) => ({ ...prev, ...next }));
    write(next);
  }, []);

  return { prefs, update };
}
