import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Lock, Mail } from 'lucide-react';

interface LoginVivoxProps {
  onSubmit: (data: { email: string; senha: string; lembrar: boolean }) => void | Promise<void>;
  /** Pedido de nova senha: a tela envia o e-mail e a mensagem para o suporte. */
  onForgotPassword?: (data: { email: string; mensagem: string }) => void | Promise<void>;
  onGoogleSignIn?: () => void;
  loading?: boolean;
  error?: string | null;
  defaultEmail?: string;
  onSupportClick?: () => void;
}

type View = 'login' | 'forgot' | 'sent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_HINT = 'Confira o e-mail. Exemplo: nome@vivoxmarketing.com.br';

/** Logo "G" do Google em SVG, sem depender de um ícone genérico. */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

/** Logo VIVOX: o "V" em dourado e o restante na cor do texto. */
function VivoxLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 342 85" role="img" aria-label="VIVOX">
      <defs>
        <linearGradient id="vlg-gold" x1="24.4498" y1="13.4474" x2="74.9795" y2="84.7594" gradientUnits="userSpaceOnUse">
          <stop stopColor="#CCB691" />
          <stop offset="1" stopColor="#876224" />
        </linearGradient>
      </defs>
      <path d="M11.0434 0H0L8.56097 22.7998L8.87321 21.6236C9.80997 18.0899 11.5378 14.8581 12.1415 11.2463C12.7504 7.58777 12.4381 3.75746 11.1475 0.291436L11.0382 0H11.0434Z" fill="url(#vlg-gold)" />
      <path d="M63.6009 3.4149e-06L37.3247 71.2928L17.252 16.8253L16.9449 16.0551L16.539 16.7941C12.667 23.7833 12.0686 32.1101 14.8945 39.6354C20.5098 54.582 26.12 69.5286 31.7301 84.4751H42.9192L74.6443 3.4149e-06H63.6009Z" fill="url(#vlg-gold)" />
      <path d="M151.84 72.401L125.57 0.208984H115.339L146.77 83.901L146.841 84.0888H156.482L188.101 0.208984H178.116L151.84 72.401Z" fill="currentColor" />
      <path d="M290.06 0L290.131 0.188477L310.702 34.042L331.273 0.188477L331.345 0H340.986L315.445 42.0498L341.025 84.0869H331.385L331.312 83.8994L310.741 50.0459L290.17 83.8994L290.099 84.0869H280.457L305.997 42.1143L280.418 0H290.06Z" fill="currentColor" />
      <path d="M99.8252 0.208984H90.6045V84.0888H99.8252V0.208984Z" fill="currentColor" />
      <path d="M275.669 41.7651C275.669 64.8313 256.97 83.5301 233.904 83.5301C210.838 83.5301 192.139 64.8313 192.139 41.7651C192.139 18.6989 210.838 0 233.904 0C256.97 0 275.669 18.6989 275.669 41.7651ZM201.08 41.7651C201.08 59.8932 215.776 74.5889 233.904 74.5889C252.032 74.5889 266.728 59.8932 266.728 41.7651C266.728 23.6369 252.032 8.94116 233.904 8.94116C215.776 8.94116 201.08 23.6369 201.08 41.7651Z" fill="currentColor" />
    </svg>
  );
}

const CSS = `
.vlg{--vlg-ink:#080706;--vlg-card:rgba(19,17,14,.74);--vlg-field:#12100d;--vlg-line:rgba(204,182,145,.14);--vlg-line-strong:rgba(204,182,145,.34);
  --vlg-text:#f4efe6;--vlg-muted:#9b9386;--vlg-gold:#ccb691;--vlg-glow:204,182,145;--vlg-danger:#ff7a6b;
  position:fixed;inset:0;overflow:auto;background:var(--vlg-ink);color:var(--vlg-text);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
.vlg *{box-sizing:border-box}
.vlg [hidden]{display:none!important}
.vlg-stage{position:relative;min-height:100%;display:grid;grid-template-columns:minmax(0,1fr);place-items:center;padding:40px 16px;isolation:isolate;overflow:hidden}
.vlg-grid{position:absolute;inset:0;z-index:-3;background-image:linear-gradient(to right,rgba(204,182,145,.07) 1px,transparent 1px),linear-gradient(to bottom,rgba(204,182,145,.07) 1px,transparent 1px);background-size:96px 96px;background-position:center top;-webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 38%,#000 10%,transparent 75%);mask-image:radial-gradient(ellipse 70% 60% at 50% 38%,#000 10%,transparent 75%)}
.vlg-dust{position:absolute;inset:0;z-index:-3;background-image:radial-gradient(rgba(204,182,145,.55) 1px,transparent 1.4px);background-size:54px 54px;opacity:.16;-webkit-mask-image:radial-gradient(ellipse 60% 50% at 50% 40%,#000 0%,transparent 80%);mask-image:radial-gradient(ellipse 60% 50% at 50% 40%,#000 0%,transparent 80%)}
.vlg-light{position:absolute;left:50%;top:42%;width:min(980px,140vw);aspect-ratio:1;z-index:-2;pointer-events:none;transform:translate(calc(-50% + var(--vlg-px,0px)),calc(-50% + var(--vlg-py,0px)))}
.vlg-light i{position:absolute;inset:0;border-radius:50%;background:radial-gradient(closest-side,rgba(var(--vlg-glow),.30),rgba(var(--vlg-glow),.10) 45%,transparent 72%);filter:blur(30px);animation:vlg-breathe 7s ease-in-out infinite}
.vlg-light i+i{inset:28%;background:radial-gradient(closest-side,rgba(255,226,170,.34),rgba(var(--vlg-glow),.08) 60%,transparent 75%);filter:blur(24px);animation-delay:-3.5s}
@keyframes vlg-breathe{0%,100%{opacity:.55;transform:scale(.92)}50%{opacity:1;transform:scale(1.06)}}
.vlg-vignette{position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 90% 80% at 50% 45%,transparent 40%,rgba(0,0,0,.72) 100%)}
.vlg-wrap{width:100%;min-width:0;max-width:400px;display:grid;gap:26px;justify-items:center}
.vlg-logo{display:block;height:34px;width:auto;color:var(--vlg-text);filter:drop-shadow(0 0 22px rgba(var(--vlg-glow),.25))}
.vlg-top{position:absolute;top:0;left:0;right:0;display:flex;justify-content:flex-end;padding:16px 20px}
.vlg-card{position:relative;width:100%;padding:30px 28px 26px;border-radius:20px;background:var(--vlg-card);border:1px solid var(--vlg-line);-webkit-backdrop-filter:blur(18px) saturate(1.2);backdrop-filter:blur(18px) saturate(1.2);box-shadow:0 30px 80px -30px rgba(0,0,0,.9),0 0 0 1px rgba(0,0,0,.4),0 0 60px -20px rgba(var(--vlg-glow),.28);animation:vlg-rise .7s cubic-bezier(.2,.8,.2,1) both,vlg-halo 7s ease-in-out infinite}
.vlg-card::before{content:"";position:absolute;left:14%;right:14%;top:-1px;height:1px;background:linear-gradient(90deg,transparent,rgba(var(--vlg-glow),.9),transparent)}
@keyframes vlg-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes vlg-halo{0%,100%{box-shadow:0 30px 80px -30px rgba(0,0,0,.9),0 0 0 1px rgba(0,0,0,.4),0 0 40px -22px rgba(var(--vlg-glow),.18)}50%{box-shadow:0 30px 80px -30px rgba(0,0,0,.9),0 0 0 1px rgba(0,0,0,.4),0 0 70px -16px rgba(var(--vlg-glow),.38)}}
.vlg-pane{display:grid;gap:18px;animation:vlg-swap .35s cubic-bezier(.2,.8,.2,1) both}
@keyframes vlg-swap{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.vlg h1{margin:0;font-weight:600;font-size:22px;letter-spacing:-.01em;text-wrap:balance}
.vlg-sub{margin:-10px 0 0;color:var(--vlg-muted);font-size:13.5px}
.vlg form{display:grid;gap:16px}
.vlg-fld{display:grid;gap:7px}
.vlg-fld label{font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--vlg-muted)}
.vlg-opt{font-weight:500;color:#6f685d}
.vlg-inp{position:relative;display:flex;align-items:center;height:46px;border-radius:12px;background:var(--vlg-field);border:1px solid var(--vlg-line);transition:border-color .2s,box-shadow .2s}
.vlg-inp:hover{border-color:var(--vlg-line-strong)}
.vlg-inp:focus-within{border-color:rgba(var(--vlg-glow),.75);box-shadow:0 0 0 4px rgba(var(--vlg-glow),.12)}
.vlg-inp.bad{border-color:rgba(255,122,107,.7);box-shadow:0 0 0 4px rgba(255,122,107,.1)}
.vlg-inp.area{height:auto;align-items:stretch}
.vlg-ic{width:17px;height:17px;flex:none;margin-left:14px;color:var(--vlg-muted);transition:color .2s}
.vlg-inp:focus-within .vlg-ic{color:var(--vlg-gold)}
.vlg-inp input,.vlg-inp textarea{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--vlg-text);font:inherit;font-size:14.5px}
.vlg-inp input{height:100%;padding:0 14px 0 11px}
.vlg-inp textarea{padding:12px 14px;resize:none;line-height:1.45;font-size:14px}
.vlg-inp input::placeholder,.vlg-inp textarea::placeholder{color:#6c665c}
.vlg-inp input:disabled{opacity:.6}
.vlg-inp input:-webkit-autofill{-webkit-text-fill-color:var(--vlg-text);box-shadow:0 0 0 40px var(--vlg-field) inset;caret-color:var(--vlg-text)}
.vlg-eye{width:42px;height:100%;flex:none;display:grid;place-items:center;border:0;background:transparent;color:var(--vlg-muted);cursor:pointer;border-radius:0 12px 12px 0}
.vlg-eye:hover{color:var(--vlg-text)}
.vlg-err{margin:0;font-size:12px;color:var(--vlg-danger)}
.vlg-alert{padding:10px 12px;border-radius:10px;border:1px solid rgba(255,122,107,.4);background:rgba(255,122,107,.08);color:var(--vlg-danger);font-size:13px}
.vlg-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.vlg-chk{display:inline-flex;align-items:center;gap:9px;color:var(--vlg-muted);font-size:13px;cursor:pointer;user-select:none}
.vlg-chk input{position:absolute;opacity:0;width:1px;height:1px}
.vlg-box{width:18px;height:18px;border-radius:6px;border:1px solid var(--vlg-line-strong);background:var(--vlg-field);display:grid;place-items:center;transition:background .2s,border-color .2s}
.vlg-box svg{width:12px;height:12px;color:var(--vlg-ink);opacity:0;transform:scale(.6);transition:opacity .15s,transform .15s}
.vlg-chk input:checked+.vlg-box{background:var(--vlg-gold);border-color:var(--vlg-gold)}
.vlg-chk input:checked+.vlg-box svg{opacity:1;transform:none}
.vlg-chk input:focus-visible+.vlg-box{box-shadow:0 0 0 4px rgba(var(--vlg-glow),.2)}
.vlg-link{padding:0;border:0;background:none;color:var(--vlg-gold);font:inherit;font-size:13px;font-weight:600;cursor:pointer;border-radius:6px;text-decoration:underline;text-decoration-color:transparent;text-underline-offset:4px;transition:text-decoration-color .2s,color .2s}
.vlg-link:hover{color:#e6d3b0;text-decoration-color:currentColor}
.vlg-link:focus-visible,.vlg-eye:focus-visible,.vlg-btn:focus-visible,.vlg-ghost:focus-visible{outline:2px solid rgba(var(--vlg-glow),.8);outline-offset:3px}
.vlg-btn{position:relative;overflow:hidden;height:48px;border:0;border-radius:12px;cursor:pointer;background:linear-gradient(180deg,#dcc7a0,#b99a62);color:#14100a;font:inherit;font-size:14.5px;font-weight:700;letter-spacing:.01em;box-shadow:0 10px 30px -10px rgba(var(--vlg-glow),.55),inset 0 1px 0 rgba(255,255,255,.35);transition:transform .15s,box-shadow .25s,filter .2s;display:inline-flex;align-items:center;justify-content:center;gap:9px}
.vlg-btn::after{content:"";position:absolute;inset:0;transform:translateX(-120%);background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transition:transform .7s}
.vlg-btn:hover{filter:brightness(1.06);box-shadow:0 14px 38px -10px rgba(var(--vlg-glow),.7),inset 0 1px 0 rgba(255,255,255,.4)}
.vlg-btn:hover::after{transform:translateX(120%)}
.vlg-btn:active{transform:translateY(1px) scale(.995)}
.vlg-btn:disabled{cursor:default;filter:saturate(.7) brightness(.9)}
.vlg-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(20,16,10,.25);border-top-color:#14100a;animation:vlg-turn .7s linear infinite}
@keyframes vlg-turn{to{transform:rotate(360deg)}}
.vlg-ghost{height:44px;border-radius:12px;border:1px solid var(--vlg-line);background:var(--vlg-field);color:var(--vlg-text);font:inherit;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:9px;transition:border-color .2s}
.vlg-ghost:hover{border-color:var(--vlg-line-strong)}
.vlg-or{position:relative;text-align:center;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#6f685d}
.vlg-or::before{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:var(--vlg-line)}
.vlg-or span{position:relative;padding:0 10px;background:#13110e}
.vlg-back{justify-self:start;display:inline-flex;align-items:center;gap:6px}
.vlg-back svg{width:15px;height:15px}
.vlg-done{display:grid;gap:14px;justify-items:start}
.vlg-tick{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:rgba(var(--vlg-glow),.12);border:1px solid var(--vlg-line-strong);color:var(--vlg-gold)}
.vlg-tick svg{width:20px;height:20px}
.vlg-foot{color:#6f685d;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase}
.vlg-sup{height:36px;padding:0 14px;border-radius:10px;border:1px solid var(--vlg-line);background:rgba(19,17,14,.6);color:var(--vlg-text);font:inherit;font-size:13px;cursor:pointer;transition:border-color .2s}
.vlg-sup:hover{border-color:var(--vlg-line-strong)}
@media (max-width:440px){.vlg-card{padding:24px 20px 22px;border-radius:18px}.vlg h1{font-size:20px}.vlg-logo{height:30px}}
@media (prefers-reduced-motion:reduce){.vlg-light i,.vlg-card,.vlg-pane,.vlg-spin{animation:none!important}.vlg-light i{opacity:.8}.vlg-btn::after{display:none}}
`;

export default function LoginVivox({
  onSubmit,
  onForgotPassword,
  onGoogleSignIn,
  loading = false,
  error = null,
  defaultEmail = '',
  onSupportClick,
}: LoginVivoxProps) {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState(defaultEmail);
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(Boolean(defaultEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [errEmail, setErrEmail] = useState('');
  const [errSenha, setErrSenha] = useState('');

  const [recEmail, setRecEmail] = useState('');
  const [recMsg, setRecMsg] = useState('');
  const [recErr, setRecErr] = useState('');
  const [recAlert, setRecAlert] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  const lightRef = useRef<HTMLDivElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const senhaRef = useRef<HTMLInputElement | null>(null);
  const recRef = useRef<HTMLInputElement | null>(null);

  // A luz acompanha o cursor de leve (desligado com "reduzir movimento").
  useEffect(() => {
    const el = lightRef.current;
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      el.style.setProperty('--vlg-px', `${cx.toFixed(1)}px`);
      el.style.setProperty('--vlg-py', `${cy.toFixed(1)}px`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 60;
      ty = (e.clientY / window.innerHeight - 0.5) * 40;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const openForgot = () => {
    setRecEmail(EMAIL_RE.test(email.trim()) ? email.trim() : '');
    setRecErr('');
    setRecAlert(null);
    setView('forgot');
    window.setTimeout(() => recRef.current?.focus(), 30);
  };

  const backToLogin = () => {
    setView('login');
    window.setTimeout(() => emailRef.current?.focus(), 30);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const mail = email.trim();
    let ok = true;
    if (!mail) {
      setErrEmail('Digite o seu e-mail.');
      ok = false;
    } else if (!EMAIL_RE.test(mail)) {
      setErrEmail(EMAIL_HINT);
      ok = false;
    } else setErrEmail('');
    if (!senha) {
      setErrSenha('Digite a sua senha.');
      ok = false;
    } else setErrSenha('');
    if (!ok) {
      (EMAIL_RE.test(mail) ? senhaRef.current : emailRef.current)?.focus();
      return;
    }
    void onSubmit({ email: mail, senha, lembrar });
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (recLoading) return;
    const mail = recEmail.trim();
    if (!EMAIL_RE.test(mail)) {
      setRecErr(mail ? EMAIL_HINT : 'Digite o seu e-mail.');
      recRef.current?.focus();
      return;
    }
    setRecErr('');
    setRecAlert(null);
    setRecLoading(true);
    try {
      await onForgotPassword?.({ email: mail, mensagem: recMsg.trim() });
      setView('sent');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setRecAlert(msg || 'Não foi possível enviar o pedido agora. Tente de novo em instantes.');
    } finally {
      setRecLoading(false);
    }
  };

  return (
    // data-theme="dark" força o tema escuro apenas nesta tela.
    <section data-theme="dark" className="vlg">
      <style>{CSS}</style>
      <main className="vlg-stage">
        <div className="vlg-grid" aria-hidden="true" />
        <div className="vlg-dust" aria-hidden="true" />
        <div className="vlg-light" ref={lightRef} aria-hidden="true">
          <i />
          <i />
        </div>
        <div className="vlg-vignette" aria-hidden="true" />

        {onSupportClick && (
          <div className="vlg-top">
            <button type="button" className="vlg-sup" onClick={onSupportClick}>
              Suporte
            </button>
          </div>
        )}

        <div className="vlg-wrap">
          <VivoxLogo className="vlg-logo" />

          <div className="vlg-card" aria-live="polite">
            {view === 'login' && (
              <div className="vlg-pane">
                <h1>Entrar no sistema</h1>
                <p className="vlg-sub">Sistema de gestão VIVOX. Entre com o seu e-mail e a sua senha.</p>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="vlg-fld">
                    <label htmlFor="vlg-email">E-mail</label>
                    <div className={`vlg-inp${errEmail ? ' bad' : ''}`}>
                      <Mail className="vlg-ic" aria-hidden="true" />
                      <input
                        id="vlg-email"
                        ref={emailRef}
                        type="email"
                        inputMode="email"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        disabled={loading}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrEmail(''); }}
                        placeholder="nome@vivoxmarketing.com.br"
                        aria-describedby={errEmail ? 'vlg-err-email' : undefined}
                      />
                    </div>
                    {errEmail && <p className="vlg-err" id="vlg-err-email" role="alert">{errEmail}</p>}
                  </div>

                  <div className="vlg-fld">
                    <label htmlFor="vlg-senha">Senha</label>
                    <div className={`vlg-inp${errSenha ? ' bad' : ''}`}>
                      <Lock className="vlg-ic" aria-hidden="true" />
                      <input
                        id="vlg-senha"
                        ref={senhaRef}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        disabled={loading}
                        value={senha}
                        onChange={(e) => { setSenha(e.target.value); setErrSenha(''); }}
                        placeholder="••••••••"
                        aria-describedby={errSenha ? 'vlg-err-senha' : undefined}
                      />
                      <button
                        type="button"
                        className="vlg-eye"
                        aria-label={showPassword ? 'Ocultar a senha' : 'Mostrar a senha'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errSenha && <p className="vlg-err" id="vlg-err-senha" role="alert">{errSenha}</p>}
                  </div>

                  <div className="vlg-row">
                    <label className="vlg-chk" htmlFor="vlg-lembrar">
                      <input id="vlg-lembrar" type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
                      <span className="vlg-box"><Check strokeWidth={3} /></span>
                      Manter conectado
                    </label>
                    <button type="button" className="vlg-link" onClick={openForgot}>
                      Esqueci minha senha
                    </button>
                  </div>

                  {error && <div role="alert" className="vlg-alert">{error}</div>}

                  <button type="submit" className="vlg-btn" disabled={loading}>
                    {loading ? (<><span className="vlg-spin" aria-hidden="true" />Entrando…</>) : 'Entrar'}
                  </button>

                  {onGoogleSignIn && (
                    <>
                      <div className="vlg-or"><span>ou</span></div>
                      <button type="button" className="vlg-ghost" onClick={onGoogleSignIn}>
                        <GoogleIcon className="h-4 w-4" />
                        Continuar com Google
                      </button>
                    </>
                  )}
                </form>
              </div>
            )}

            {view === 'forgot' && (
              <div className="vlg-pane">
                <button type="button" className="vlg-link vlg-back" onClick={backToLogin}>
                  <ArrowLeft aria-hidden="true" />
                  Voltar
                </button>
                <h1>Esqueci minha senha</h1>
                <p className="vlg-sub">Envie um pedido ao suporte. A equipe ajuda você a criar uma nova senha.</p>
                <form onSubmit={handleForgot} noValidate>
                  <div className="vlg-fld">
                    <label htmlFor="vlg-rec-email">E-mail</label>
                    <div className={`vlg-inp${recErr ? ' bad' : ''}`}>
                      <Mail className="vlg-ic" aria-hidden="true" />
                      <input
                        id="vlg-rec-email"
                        ref={recRef}
                        type="email"
                        inputMode="email"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        disabled={recLoading}
                        value={recEmail}
                        onChange={(e) => { setRecEmail(e.target.value); setRecErr(''); }}
                        placeholder="nome@vivoxmarketing.com.br"
                      />
                    </div>
                    {recErr && <p className="vlg-err" role="alert">{recErr}</p>}
                  </div>
                  <div className="vlg-fld">
                    <label htmlFor="vlg-rec-msg">Mensagem <span className="vlg-opt">(opcional)</span></label>
                    <div className="vlg-inp area">
                      <textarea
                        id="vlg-rec-msg"
                        rows={3}
                        maxLength={300}
                        disabled={recLoading}
                        value={recMsg}
                        onChange={(e) => setRecMsg(e.target.value)}
                        placeholder="Conte o que aconteceu, se quiser"
                      />
                    </div>
                  </div>
                  {recAlert && <div role="alert" className="vlg-alert">{recAlert}</div>}
                  <button type="submit" className="vlg-btn" disabled={recLoading}>
                    {recLoading ? (<><span className="vlg-spin" aria-hidden="true" />Enviando…</>) : 'Enviar ao suporte'}
                  </button>
                </form>
              </div>
            )}

            {view === 'sent' && (
              <div className="vlg-pane vlg-done">
                <span className="vlg-tick"><Check aria-hidden="true" strokeWidth={2.4} /></span>
                <h1>Pedido enviado ao suporte</h1>
                <p className="vlg-sub" style={{ margin: 0 }}>
                  O suporte vai entrar em contato com <b>{recEmail.trim()}</b> para ajudar com a nova senha.
                </p>
                <button type="button" className="vlg-link" onClick={backToLogin}>
                  Voltar para a entrada
                </button>
              </div>
            )}
          </div>

          <p className="vlg-foot">VIVOX · Agência &amp; Produtora</p>
        </div>
      </main>
    </section>
  );
}
