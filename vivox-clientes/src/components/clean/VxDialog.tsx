import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

// Diálogo do layout clean (.ov/.dlg). Precisa estar dentro de um elemento .vxp.

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  lg?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

export function VxDialog({ open, onClose, title, subtitle, lg, children, footer }: Props) {
  const tid = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="ov" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`dlg${lg ? ' lg' : ''}`} role="dialog" aria-modal="true" aria-labelledby={tid}>
        <div className="dlg-h">
          <div>
            <h2 id={tid}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="ib sm" type="button" aria-label="Fechar" onClick={onClose}>
            <X className="i" aria-hidden="true" />
          </button>
        </div>
        <div className="dlg-b">{children}</div>
        {footer && <div className="dlg-f">{footer}</div>}
      </div>
    </div>
  );
}
