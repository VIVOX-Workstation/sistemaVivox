import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Kanban, Users, BarChart3, CalendarDays, Circle } from 'lucide-react';
import './FlowHome.css';
const areas = [
    { name: 'Clientes', text: 'Informações, serviços e planejamento em um só lugar.', icon: Users },
    { name: 'VVOX Sync', text: 'Demandas organizadas, da entrada à aprovação.', icon: Kanban },
    { name: 'Acompanhamento', text: 'Publicações e cronogramas para acompanhar a rotina.', icon: CalendarDays },
    { name: 'Analytics', text: 'Dados de performance para orientar o próximo passo.', icon: BarChart3 },
];
export default function FlowHome() {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = 'Flow VIVOX — O trabalho conectado';
        return () => { document.title = previousTitle; };
    }, []);
    return (<div className="flow-home">
      <a className="flow-skip" href="#flow-main">Pular para o conteúdo</a>
      <div className="flow-dark">
        <header className="flow-header flow-container">
          <div className="flow-brand" aria-label="Flow VIVOX">
            <span>Flow</span>
            <span className="flow-brand-divider" aria-hidden="true"/>
            <img src="/brand/vivox-logo.svg" alt="VIVOX" width="472" height="117"/>
          </div>
          <span className="flow-header-note">O nosso trabalho, conectado.</span>
        </header>
        <main id="flow-main">
          <section className="flow-hero flow-container" aria-labelledby="flow-heading">
            <div className="flow-intro">
              <h1 id="flow-heading">Tudo conectado.<br /><span>Para o trabalho<br className="flow-desktop-break"/> fluir.</span></h1>
              <p>O Flow VIVOX reúne clientes, demandas e resultados em um mesmo ambiente. Mais clareza para organizar a rotina e avançar juntos, do planejamento à entrega.</p>
              <Link className="flow-enter" to="/login">Entrar <ArrowRight size={19} aria-hidden="true"/></Link>
              <span className="flow-access-note">Acesse com sua conta VIVOX.</span>
            </div>
            <figure className="flow-preview">
              <div className="flow-preview-top"><span><Kanban size={16} aria-hidden="true"/> VVOX Sync</span><span className="flow-preview-label">Exemplo de fluxo</span></div>
              <div className="flow-board">
                <div className="flow-stage flow-stage-entry">
                  <div className="flow-stage-heading"><Circle size={8} fill="currentColor" aria-hidden="true"/><span>A fazer</span></div>
                  <div className="flow-task"><span className="flow-task-category">Planejamento</span><strong>Uma nova ideia</strong><p>Definir o próximo passo.</p><div className="flow-task-meta"><span>Briefing</span><span className="flow-task-avatar" aria-hidden="true">V</span></div></div>
                </div>
                <div className="flow-stage flow-stage-doing">
                  <div className="flow-stage-heading"><Circle size={8} fill="currentColor" aria-hidden="true"/><span>Em execução</span></div>
                  <div className="flow-task"><span className="flow-task-category">Produção</span><strong>Dar forma à ideia</strong><p>Criar, revisar e evoluir.</p><div className="flow-task-meta"><span>Em andamento</span><span className="flow-task-avatar" aria-hidden="true">V</span></div></div>
                </div>
                <div className="flow-stage flow-stage-done">
                  <div className="flow-stage-heading"><Check size={12} aria-hidden="true"/><span>Concluídas</span></div>
                  <div className="flow-task"><span className="flow-task-category">Entrega</span><strong>Pronto para seguir</strong><p>Uma entrega. Novos caminhos.</p><div className="flow-task-meta"><span><Check size={12} aria-hidden="true"/> Finalizado</span><span className="flow-task-avatar" aria-hidden="true">V</span></div></div>
                </div>
              </div>
              <figcaption><span className="flow-caption-line" aria-hidden="true"/> Cada demanda encontra seu próximo passo.</figcaption>
            </figure>
          </section>
          <section className="flow-overview" aria-labelledby="flow-overview-heading">
            <div className="flow-container">
              <div className="flow-overview-title"><h2 id="flow-overview-heading">Uma visão do todo.<br /><span>Um lugar para cada detalhe.</span></h2><p>Da relação com o cliente à organização das entregas, as ferramentas da equipe se encontram aqui.</p></div>
              <div className="flow-areas">{areas.map(({ name, text, icon: Icon }) => <div className="flow-area" key={name}><Icon size={22} strokeWidth={1.6} aria-hidden="true"/><h3>{name}</h3><p>{text}</p></div>)}</div>
            </div>
          </section>
        </main>
      </div>
      <footer className="flow-footer flow-container"><span>Flow VIVOX</span><span>Feito para a nossa equipe. Para o nosso dia a dia.</span></footer>
    </div>);
}
