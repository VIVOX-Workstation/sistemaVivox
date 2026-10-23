import { DemoProvider } from './DemoContext';
import { useDemo } from './useDemo';
import { PortalAluno } from './PortalAluno';
import { PainelAdmin } from './PainelAdmin';
import { QuizModal } from './QuizModal';
import { GraduationCap, ShieldCheck, Info } from 'lucide-react';
import type { DocumentoProposta } from '../../types';
import './demo.css';

function DemoEnsinoContent({ documento }: { documento: DocumentoProposta }) {
  const { state, dispatch } = useDemo();

  return (
    <div className="vxd-demo-shell" style={{ '--vxd-primary': documento.corDestaque } as React.CSSProperties}>
      {/* Faixa discreta de dados fictícios */}
      <div className="vxd-discreet-strip">
        <div className="vxd-discreet-inner">
          <span className="vxd-discreet-badge"><Info size={13} /> Demonstração com dados fictícios</span>
          <span className="vxd-discreet-text">
            Navegação interativa 100% no navegador • O estado é reiniciado ao recarregar a página (sem cookies ou localStorage)
          </span>
        </div>
      </div>

      {/* Barra de Seleção de Ambiente (Aluno vs Admin) */}
      <div className="vxd-env-selector-bar">
        <div className="vxd-env-selector-inner">
          <div className="vxd-env-brand">
            <span className="vxd-env-title">Plataforma de Ensino Online</span>
            <span className="vxd-env-badge">Ambiente de Demonstração</span>
          </div>

          <div className="vxd-env-switcher" role="tablist" aria-label="Selecione o ambiente da demonstração">
            <button
              type="button"
              role="tab"
              aria-selected={state.ambiente === 'aluno'}
              className={`vxd-switcher-btn ${state.ambiente === 'aluno' ? 'vxd-switcher-active' : ''}`}
              onClick={() => dispatch({ type: 'SET_AMBIENTE', ambiente: 'aluno' })}
            >
              <GraduationCap size={16} />
              <span>Portal do Aluno</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={state.ambiente === 'admin'}
              className={`vxd-switcher-btn ${state.ambiente === 'admin' ? 'vxd-switcher-active' : ''}`}
              onClick={() => dispatch({ type: 'SET_AMBIENTE', ambiente: 'admin' })}
            >
              <ShieldCheck size={16} />
              <span>Painel Administrativo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visualização Ativa */}
      <main className="vxd-main-viewport">
        {state.ambiente === 'aluno' ? <PortalAluno /> : <PainelAdmin />}
      </main>

      {/* Modal de Avaliação / Quiz */}
      <QuizModal />
    </div>
  );
}

export default function DemoEnsino({ documento }: { documento: DocumentoProposta }) {
  return (
    <DemoProvider>
      <DemoEnsinoContent documento={documento} />
    </DemoProvider>
  );
}
