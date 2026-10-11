import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import './FlowHome.css';

export default function FlowHome() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Flow VIVOX — O próximo passo começa aqui';
    return () => { document.title = previousTitle; };
  }, []);
  return (
    <div className="flow-home">
      <a className="flow-skip" href="#flow-main">Pular para o conteúdo</a>
      <header className="flow-header">
        <div className="flow-brand" aria-label="Flow VIVOX">
          <span>Flow</span>
          <img src="/brand/vivox-logo.svg" alt="VIVOX" width="472" height="117" />
        </div>
        <span className="flow-header-note">Feito para a nossa equipe.</span>
      </header>
      <main id="flow-main" className="flow-main">
        <h1>O próximo passo<br />começa no <span>Flow.</span></h1>
        <p>Um espaço para conectar ideias, pessoas e trabalho.<br className="flow-copy-break" /> Entre e siga em frente com a VIVOX.</p>
        <Link className="flow-enter" to="/login">
          <span>Entrar</span>
          <span className="flow-enter-icon"><ArrowUpRight size={22} strokeWidth={1.7} aria-hidden="true" /></span>
        </Link>
      </main>
      <svg className="flow-art" viewBox="0 0 1600 600" fill="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="flow-gold-line" x1="0" y1="400" x2="1600" y2="140" gradientUnits="userSpaceOnUse">
            <stop stopColor="#876224" stopOpacity="0.15" />
            <stop offset="0.48" stopColor="#CCB691" stopOpacity="0.8" />
            <stop offset="1" stopColor="#876224" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path d="M-100 330C180 100 400 540 740 340S1200 60 1700 270" stroke="url(#flow-gold-line)" strokeWidth="1.5" />
        <path d="M-100 360C180 130 400 570 740 370S1200 90 1700 300" stroke="url(#flow-gold-line)" strokeOpacity="0.65" />
        <path d="M-100 390C180 160 400 600 740 400S1200 120 1700 330" stroke="url(#flow-gold-line)" strokeOpacity="0.35" />
        <path className="flow-trace" d="M-100 330C180 100 400 540 740 340S1200 60 1700 270" stroke="#CCB691" strokeWidth="2" pathLength="100" strokeDasharray="5 95" />
      </svg>
      <footer className="flow-footer"><span>Ideias em movimento.</span><span>Flow VIVOX</span></footer>
    </div>
  );
}