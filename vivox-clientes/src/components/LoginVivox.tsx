import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { cn } from '../utils/cn';

interface LoginVivoxProps {
  onSubmit: (data: { email: string; senha: string; lembrar: boolean }) => void | Promise<void>;
  onGoogleSignIn?: () => void;
  loading?: boolean;
  error?: string | null;
  defaultEmail?: string;
  onSupportClick?: () => void;
}

/** Logo "G" do Google em SVG — evita depender de um ícone genérico. */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

export default function LoginVivox({
  onSubmit,
  onGoogleSignIn,
  loading = false,
  error = null,
  defaultEmail = '',
  onSupportClick,
}: LoginVivoxProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(Boolean(defaultEmail));
  const [showPassword, setShowPassword] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    type P = { x: number; y: number; v: number; o: number };
    let ps: P[] = [];
    let raf = 0;

    const make = (): P => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      v: Math.random() * 0.25 + 0.05,
      o: Math.random() * 0.35 + 0.15,
    });

    const init = () => {
      ps = [];
      const count = Math.floor((canvas.width * canvas.height) / 9000);
      for (let i = 0; i < count; i++) ps.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 40;
          p.v = Math.random() * 0.25 + 0.05;
          p.o = Math.random() * 0.35 + 0.15;
        }
        // Partículas na cor da marca VIVOX
        ctx.fillStyle = `rgba(199, 161, 95, ${p.o})`;
        ctx.fillRect(p.x, p.y, 0.7, 2.2);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener('resize', onResize);
    init();
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    void onSubmit({ email, senha, lembrar });
  };

  const fieldClass =
    'w-full h-11 rounded-[var(--vivox-radius-sm)] border border-[var(--vivox-border)] bg-[var(--vivox-background)] ' +
    'pl-10 pr-3 text-sm text-[var(--vivox-text)] placeholder:text-[var(--vivox-text-subtle)] ' +
    'outline-none transition-shadow duration-[var(--vivox-motion-ui)] ' +
    'focus:border-[var(--vivox-brand)] focus:shadow-[0_0_0_3px_var(--vivox-brand-soft)] ' +
    'disabled:cursor-not-allowed disabled:opacity-60';

  return (
    // data-theme="dark" força o tema escuro apenas nesta tela — o restante do app
    // continua seguindo o tema definido no <body> (index.html).
    <section
      data-theme="dark"
      className="fixed inset-0 overflow-auto bg-[var(--vivox-background)] text-[var(--vivox-text)]"
    >
      <style>{`
        .vivox-accent-lines{position:absolute;inset:0;pointer-events:none;opacity:.7}
        .vivox-hline,.vivox-vline{position:absolute;background:var(--vivox-border);will-change:transform,opacity}
        .vivox-hline{left:0;right:0;height:1px;transform:scaleX(0);transform-origin:50% 50%;animation:vivoxDrawX .8s cubic-bezier(.22,.61,.36,1) forwards}
        .vivox-vline{top:0;bottom:0;width:1px;transform:scaleY(0);transform-origin:50% 0%;animation:vivoxDrawY .9s cubic-bezier(.22,.61,.36,1) forwards}
        .vivox-hline:nth-child(1){top:18%;animation-delay:.12s}
        .vivox-hline:nth-child(2){top:50%;animation-delay:.22s}
        .vivox-hline:nth-child(3){top:82%;animation-delay:.32s}
        .vivox-vline:nth-child(4){left:22%;animation-delay:.42s}
        .vivox-vline:nth-child(5){left:50%;animation-delay:.54s}
        .vivox-vline:nth-child(6){left:78%;animation-delay:.66s}
        .vivox-hline::after,.vivox-vline::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(199,161,95,.35),transparent);opacity:0;animation:vivoxShimmer .9s ease-out forwards}
        .vivox-hline:nth-child(1)::after{animation-delay:.12s}
        .vivox-hline:nth-child(2)::after{animation-delay:.22s}
        .vivox-hline:nth-child(3)::after{animation-delay:.32s}
        .vivox-vline:nth-child(4)::after{animation-delay:.42s}
        .vivox-vline:nth-child(5)::after{animation-delay:.54s}
        .vivox-vline:nth-child(6)::after{animation-delay:.66s}
        @keyframes vivoxDrawX{0%{transform:scaleX(0);opacity:0}60%{opacity:.95}100%{transform:scaleX(1);opacity:.7}}
        @keyframes vivoxDrawY{0%{transform:scaleY(0);opacity:0}60%{opacity:.95}100%{transform:scaleY(1);opacity:.7}}
        @keyframes vivoxShimmer{0%{opacity:0}35%{opacity:.3}100%{opacity:0}}

        .vivox-card-animate{opacity:0;transform:translateY(20px);animation:vivoxFadeUp .8s cubic-bezier(.22,.61,.36,1) .4s forwards}
        @keyframes vivoxFadeUp{to{opacity:1;transform:translateY(0)}}

        .vivox-spinner{width:16px;height:16px;border-radius:999px;border:2px solid currentColor;border-top-color:transparent;animation:vivoxSpin .7s linear infinite}
        @keyframes vivoxSpin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Vinheta sutil */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(80%_60%_at_50%_30%,rgba(199,161,95,0.07),transparent_60%)]" />

      {/* Linhas de destaque animadas */}
      <div className="vivox-accent-lines">
        <div className="vivox-hline" />
        <div className="vivox-hline" />
        <div className="vivox-hline" />
        <div className="vivox-vline" />
        <div className="vivox-vline" />
        <div className="vivox-vline" />
      </div>

      {/* Partículas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-60 mix-blend-screen"
      />

      {/* Cabeçalho */}
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between border-b border-[var(--vivox-border)]/80 px-6 py-4">
        <span className="text-xs uppercase tracking-[0.22em] text-[var(--vivox-text-muted)]">
          Sistema <span className="text-[var(--vivox-brand)]">VIVOX</span>
        </span>
        <button
          type="button"
          onClick={onSupportClick}
          className="inline-flex h-9 items-center rounded-[var(--vivox-radius-sm)] border border-[var(--vivox-border)] bg-[var(--vivox-surface)] px-3 text-sm text-[var(--vivox-text)] transition-colors duration-[var(--vivox-motion-ui)] hover:border-[var(--vivox-border-strong)] hover:bg-[var(--vivox-surface-raised)]"
        >
          <span className="mr-2">Suporte</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </header>

      {/* Card centralizado */}
      <div className="grid min-h-full w-full place-items-center px-4 py-24">
        <div className="vivox-card-animate w-full max-w-sm rounded-[var(--vivox-radius-md)] border border-[var(--vivox-border)] bg-[var(--vivox-surface)]/80 shadow-[var(--vivox-shadow-panel)] backdrop-blur supports-[backdrop-filter]:bg-[var(--vivox-surface)]/70">
          <div className="space-y-1.5 p-6 pb-4">
            <h1 className="text-2xl font-semibold leading-none tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-[var(--vivox-text-muted)]">
              Acesse o painel VIVOX para acompanhar clientes, serviços e performance.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 p-6 pt-0">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium text-[var(--vivox-text-muted)]">
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vivox-text-subtle)]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@vivox.com.br"
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="senha" className="text-sm font-medium text-[var(--vivox-text-muted)]">
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vivox-text-subtle)]" />
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className={cn(fieldClass, 'pr-10')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[var(--vivox-radius-sm)] p-2 text-[var(--vivox-text-subtle)] transition-colors hover:text-[var(--vivox-text)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label
                htmlFor="lembrar"
                className="flex cursor-pointer items-center gap-2 text-sm text-[var(--vivox-text-muted)]"
              >
                <input
                  id="lembrar"
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="h-4 w-4 cursor-pointer appearance-none rounded-[4px] border border-[var(--vivox-border-strong)] bg-[var(--vivox-background)] transition-colors checked:border-[var(--vivox-brand)] checked:bg-[var(--vivox-brand)] checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%231d160b%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%2220 6 9 17 4 12%22/></svg>')] checked:bg-[length:12px_12px] checked:bg-center checked:bg-no-repeat"
                />
                Lembrar de mim
              </label>
              <a
                href="#"
                className="text-sm text-[var(--vivox-text-muted)] transition-colors hover:text-[var(--vivox-brand)]"
              >
                Esqueceu a senha?
              </a>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-[var(--vivox-radius-sm)] border border-[var(--vivox-danger)]/50 bg-[var(--vivox-danger)]/10 p-3 text-sm text-[var(--vivox-danger)]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--vivox-radius-sm)] bg-[var(--vivox-brand)] text-sm font-semibold text-[var(--vivox-on-brand)] transition-colors duration-[var(--vivox-motion-ui)] hover:bg-[var(--vivox-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="vivox-spinner" />
                  Entrando...
                </>
              ) : (
                'Entrar no sistema'
              )}
            </button>

            <div className="relative">
              <div className="h-px w-full bg-[var(--vivox-border)]" />
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--vivox-surface)] px-2 text-[11px] uppercase tracking-widest text-[var(--vivox-text-subtle)]">
                ou
              </span>
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--vivox-radius-sm)] border border-[var(--vivox-border)] bg-[var(--vivox-background)] text-sm text-[var(--vivox-text)] transition-colors duration-[var(--vivox-motion-ui)] hover:border-[var(--vivox-border-strong)] hover:bg-[var(--vivox-surface-raised)]"
            >
              <GoogleIcon className="h-4 w-4" />
              Continuar com Google
            </button>
          </form>

          <div className="flex flex-col items-center gap-2 p-6 pt-0 text-sm text-[var(--vivox-text-muted)]">
            <div>
              Ainda não tem acesso?
              <a className="ml-1 text-[var(--vivox-text)] hover:underline" href="#">
                Fale com o administrador
              </a>
            </div>
            <span className="text-[10px] tracking-wide text-[var(--vivox-text-subtle)]">
              VIVOX — Agência &amp; Produtora
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
