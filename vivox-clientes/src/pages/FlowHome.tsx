import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import './FlowHome.css';
import FlowingPaths from '../components/FlowingPaths';
import FlowNavigation from '../components/FlowNavigation';
import { updateFlowButton, resetFlowButton } from '../utils/flowButtonEffects';

export default function FlowHome() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'VIVOX Flow — Visão integrada';
    return () => { document.title = previousTitle; };
  }, []);
  return (
    <div className="flow-home">
      <a className="flow-skip" href="#flow-main">Pular para o conteúdo</a>
      <header className="flow-header">
        <div className="flow-brand" aria-label="VIVOX Flow">
          <img src="/brand/vivox-logo.svg" alt="VIVOX" width="472" height="117" />
          <span>Flow</span>
        </div>
        <FlowNavigation />
      </header>
      <main id="flow-main" className="flow-main">
        <h1>Visão integrada.<br /><span>Execução alinhada.</span></h1>
        <p>O ambiente de trabalho da VIVOX para conectar pessoas e prioridades.<br className="flow-copy-break" /> Clareza de direção, continuidade na execução.</p>
        <Link className="flow-enter" to="/login" onPointerMove={updateFlowButton} onPointerLeave={resetFlowButton} onBlur={resetFlowButton}>
          <span>Entrar</span>
          <span className="flow-enter-icon"><ArrowUpRight size={22} strokeWidth={1.7} aria-hidden="true" /></span>
        </Link>
      </main>
      <FlowingPaths />
      <footer className="flow-footer"><span>Uma visão comum.</span><span>VIVOX Flow</span></footer>
    </div>
  );
}