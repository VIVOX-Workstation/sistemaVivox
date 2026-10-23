import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowRight, BarChart3, BookOpen, Check, CheckCircle2, ClipboardCheck, Download, Gift, GraduationCap, Handshake,
  LayoutDashboard, LayoutGrid, Minus, Play, PlayCircle, Server, Sparkles, Trophy, Users,
} from 'lucide-react';
import { HeroParallax } from '../../components/ui/hero-parallax';
import type { ItemParallax } from '../../components/ui/hero-parallax';
import type { DocumentoProposta } from './types';
import { secaoParaLanding } from './landingBlocos';
import type { Bloco, SecaoLanding } from './landingBlocos';
import './landing.css';

interface PropostaLandingProps {
  documento: DocumentoProposta;
  onVerDemo: () => void;
}

const ICONES: [RegExp, typeof Sparkles][] = [
  [/dashboard|indicador/i, BarChart3],
  [/gest[aã]o|painel/i, LayoutDashboard],
  [/experi[eê]ncia|aluno/i, GraduationCap],
  [/avalia/i, ClipboardCheck],
  [/gamifica|pr[eê]mio/i, Trophy],
  [/galeria/i, LayoutGrid],
  [/v[ií]deo/i, PlayCircle],
  [/curso|aula/i, BookOpen],
  [/loja|recompensa/i, Gift],
  [/inclu[ií]do/i, CheckCircle2],
  [/responsabilidade/i, Handshake],
  [/infraestrutura|hospedagem/i, Server],
];
const iconeDe = (titulo: string) => ICONES.find(([re]) => re.test(titulo))?.[1] ?? Sparkles;

const formatarData = (iso: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : null);

// Prints da demo (public/demos/<demo>/prints) para o hero em parallax: 3 fileiras de 5.
// As duas primeiras, mais à vista no topo, mostram o Portal do aluno; o painel fica na última.
const PRINTS_DEMO: Record<string, ItemParallax[]> = {
  ensino: [
    ['01-aluno-inicio', 'Portal do aluno · Início'],
    ['02-aluno-curso', 'Portal do aluno · Curso'],
    ['11-aluno-inicio-claro', 'Portal do aluno · Tema claro'],
    ['03-aluno-recompensas', 'Portal do aluno · Recompensas'],
    ['04-aluno-avaliacao', 'Portal do aluno · Avaliação'],
    ['12-aluno-curso-claro', 'Portal do aluno · Curso, tema claro'],
    ['13-aluno-recompensas-claro', 'Portal do aluno · Recompensas, tema claro'],
    ['01-aluno-inicio', 'Portal do aluno · Início em destaque'],
    ['14-aluno-avaliacao-claro', 'Portal do aluno · Avaliação, tema claro'],
    ['05-aluno-login', 'Portal do aluno · Login'],
    ['06-painel-dashboard', 'Painel · Dashboard'],
    ['07-painel-cursos', 'Painel · Cursos e aulas'],
    ['08-painel-videos', 'Painel · Vídeos'],
    ['09-painel-alunos', 'Painel · Alunos'],
    ['10-painel-premios', 'Painel · Prêmios e resgates'],
  ].map(([arquivo, title]) => ({ title, thumbnail: `/demos/ensino/prints/${arquivo}.jpg` })),
};

// Telas desenhadas em CSS: ilustram a plataforma sem depender de imagens externas.
function TelaPortal() {
  return (
    <div className="vxl-tela vxl-tela-portal" aria-hidden="true">
      <div className="vxl-tela-barra"><i /><i /><i /><span>Portal do Aluno</span></div>
      <div className="vxl-tela-corpo">
        <aside className="vxl-tela-menu">
          <b className="vxl-tela-logo" />
          {[0, 1, 2, 3].map(i => <span key={i} className={i === 0 ? 'ativo' : ''} />)}
        </aside>
        <div className="vxl-tela-conteudo">
          <div className="vxl-tela-banner">
            <small>Continue de onde parou</small>
            <strong>Liderança Estratégica</strong>
            <em>Módulo 1 · Aula 3</em>
            <div className="vxl-tela-progresso"><span style={{ width: '62%' }} /></div>
            <button type="button" tabIndex={-1}><Play size={10} fill="currentColor" /> Assistir</button>
          </div>
          <div className="vxl-tela-linha-titulo"><span>Meus cursos</span><span className="vxl-tela-pontos"><Trophy size={10} /> 250 pts</span></div>
          <div className="vxl-tela-capas">
            {['a', 'b', 'c', 'd'].map(c => <div key={c} className={`vxl-capa vxl-capa-${c}`}><span /></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function TelaAdmin() {
  return (
    <div className="vxl-tela vxl-tela-admin" aria-hidden="true">
      <div className="vxl-tela-barra"><i /><i /><i /><span>Painel Administrativo</span></div>
      <div className="vxl-tela-corpo">
        <aside className="vxl-tela-menu">
          <b className="vxl-tela-logo" />
          {[0, 1, 2, 3, 4].map(i => <span key={i} className={i === 0 ? 'ativo' : ''} />)}
        </aside>
        <div className="vxl-tela-conteudo">
          <div className="vxl-tela-kpis">
            {[['Alunos ativos', '248'], ['Conclusão', '71%'], ['Pontos', '18,4k'], ['Resgates', '6']].map(([r, v]) => (
              <div key={r}><small>{r}</small><strong>{v}</strong></div>
            ))}
          </div>
          <div className="vxl-tela-grafico">
            {[38, 52, 45, 66, 58, 74, 69, 88, 80, 92].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}
          </div>
          <div className="vxl-tela-tabela">
            {[['Mariana S.', 82], ['João P.', 64], ['Ana L.', 45]].map(([n, p]) => (
              <div key={n as string}><span className="vxl-tela-avatar" /><em>{n}</em><div className="vxl-tela-progresso"><span style={{ width: `${p}%` }} /></div><b>{p}%</b></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function telaDaSecao(titulo: string): ReactNode {
  if (/administrativ/i.test(titulo)) return <TelaAdmin />;
  if (/aluno/i.test(titulo)) return <TelaPortal />;
  return null;
}

function Destaque({ titulo, html }: { titulo: string; html: string }) {
  // "Rótulo: descrição<br>Rótulo: descrição" vira um cartão por ambiente.
  const partes = html.split(/<br\s*\/?>/i).map(parte => {
    const tmp = document.createElement('div');
    tmp.innerHTML = parte;
    const rotulo = (tmp.querySelector('.strong, strong')?.textContent ?? '').replace(/:\s*$/, '').trim();
    const total = (tmp.textContent ?? '').trim();
    return { rotulo, texto: rotulo ? total.slice(total.indexOf(rotulo) + rotulo.length).replace(/^\s*:\s*/, '') : total };
  }).filter(p => p.texto);
  if (partes.length > 1 && partes.every(p => p.rotulo)) {
    return (
      <div className="vxl-ambientes">
        {titulo && <p className="vxl-ambientes-titulo">{titulo}</p>}
        <div className="vxl-ambientes-grade">
          {partes.map(p => {
            const Icone = iconeDe(p.rotulo);
            return (
              <article key={p.rotulo} className="vxl-ambiente vxl-revelar">
                <span className="vxl-icone"><Icone size={20} /></span>
                <h3>{p.rotulo}</h3>
                <p>{p.texto}</p>
              </article>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="vxl-nota vxl-revelar">
      <span className="vxl-nota-icone"><Sparkles size={16} /></span>
      <div>{titulo && <strong>{titulo}</strong>}<p dangerouslySetInnerHTML={{ __html: html }} /></div>
    </div>
  );
}

function BlocoLanding({ bloco }: { bloco: Bloco }) {
  switch (bloco.tipo) {
    case 'faixa':
      return null; // exibida no topo do plano
    case 'cabecalho':
      return (
        <header className="vxl-cabecalho vxl-revelar">
          {bloco.rotulo && <span className="vxl-rotulo">{bloco.rotulo.replace(/^\d+\s*\/\s*/, '')}</span>}
          <h2>{bloco.linhas.join(' ')}</h2>
          {bloco.texto && <p>{bloco.texto}</p>}
        </header>
      );
    case 'destaque':
      return <Destaque titulo={bloco.titulo} html={bloco.html} />;
    case 'rotulo':
      return <p className="vxl-divisor"><span>{bloco.texto}</span></p>;
    case 'cartoes':
      return (
        <div className={`vxl-cartoes vxl-cartoes-${Math.min(bloco.cartoes.length, 4)}`}>
          {bloco.cartoes.map(c => {
            const Icone = iconeDe(c.titulo);
            return (
              <article key={c.titulo} className="vxl-cartao vxl-revelar">
                <div className="vxl-cartao-topo"><span className="vxl-icone"><Icone size={18} /></span><h3>{c.titulo}</h3></div>
                <ul>{c.itens.map(item => <li key={item}><Check size={14} />{item}</li>)}</ul>
              </article>
            );
          })}
        </div>
      );
    case 'numeros':
      return (
        <div className="vxl-numeros">
          {bloco.numeros.map(n => <div key={n.rotulo} className="vxl-revelar"><strong>{n.valor}</strong><span>{n.rotulo}</span></div>)}
        </div>
      );
    case 'passos':
      return (
        <ol className="vxl-passos">
          {bloco.passos.map(p => (
            <li key={p.numero + p.titulo} className="vxl-revelar">
              <span className="vxl-passo-num">{p.numero}</span>
              <h4>{p.titulo}</h4>
              <p>{p.texto}</p>
            </li>
          ))}
        </ol>
      );
    case 'nota':
      return (
        <div className={`vxl-nota vxl-revelar ${bloco.icone === '!' ? 'vxl-nota-alerta' : ''}`}>
          <span className="vxl-nota-icone">{bloco.icone}</span>
          <p dangerouslySetInnerHTML={{ __html: bloco.html }} />
        </div>
      );
    case 'valores':
      return (
        <div className="vxl-valores">
          {bloco.valores.map(v => (
            <div key={v.rotulo} className={`vxl-valor vxl-revelar ${v.suave ? '' : 'vxl-valor-forte'}`}>
              <small>{v.rotulo}</small><strong>{v.valor}</strong><span>{v.dica}</span>
            </div>
          ))}
        </div>
      );
    case 'tabela':
      return (
        <div className="vxl-tabela-rolagem vxl-revelar">
          <table className="vxl-tabela">
            <thead><tr>{bloco.cabecalho.map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {bloco.linhas.map((linha, i) => (
                <tr key={i}>
                  {linha.map((cel, j) => (
                    <td key={j}>
                      {cel.tipo === 'sim' ? <span className="vxl-sim"><Check size={13} />{cel.texto}</span>
                        : cel.tipo === 'nao' ? <span className="vxl-nao"><Minus size={13} />{cel.texto}</span> : cel.texto}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'precos':
      return (
        <div className="vxl-precos">
          {bloco.precos.map(p => (
            <article key={p.titulo} className={`vxl-preco vxl-revelar ${p.destaque ? 'vxl-preco-destaque' : ''}`}>
              {p.destaque && <span className="vxl-preco-selo">Experiência completa</span>}
              <small>{p.rotulo}</small>
              <h3>{p.titulo}</h3>
              <strong>{p.valor}</strong>
              <p>{p.texto}</p>
            </article>
          ))}
        </div>
      );
    case 'condicoes':
      return (
        <div className="vxl-condicoes vxl-revelar">
          {bloco.titulo && <h3>{bloco.titulo}</h3>}
          {bloco.paragrafos.map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p }} />)}
        </div>
      );
    case 'html':
      return <div className="vxl-prosa" dangerouslySetInnerHTML={{ __html: bloco.html }} />;
  }
}

function SecaoDaLanding({ secao, indice }: { secao: SecaoLanding; indice: number }) {
  const faixa = secao.blocos.find(b => b.tipo === 'faixa');
  const tela = telaDaSecao(secao.titulo);
  const [cabecalho, ...resto] = secao.blocos.filter(b => b.tipo !== 'faixa');
  const lado = indice % 2 === 0 ? 'vxl-lado-dir' : 'vxl-lado-esq';

  if (faixa && faixa.tipo === 'faixa') {
    return (
      <section id={`vxl-secao-${indice}`} className="vxl-secao vxl-secao-plano">
        <div className="vxl-container">
          <div className="vxl-plano">
            <div className="vxl-plano-faixa"><span>{faixa.id}</span><em>{faixa.selo}</em></div>
            {secao.blocos.filter(b => b.tipo !== 'faixa').map((b, i) => <BlocoLanding key={i} bloco={b} />)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={`vxl-secao-${indice}`} className={`vxl-secao ${indice % 2 ? 'vxl-secao-alt' : ''}`}>
      <div className="vxl-container">
        {tela ? (
          <div className={`vxl-dividida ${lado}`}>
            <div className="vxl-dividida-texto"><BlocoLanding bloco={cabecalho} /></div>
            <div className="vxl-dividida-tela vxl-revelar">{tela}</div>
          </div>
        ) : <BlocoLanding bloco={cabecalho} />}
        {resto.map((b, i) => <BlocoLanding key={i} bloco={b} />)}
      </div>
    </section>
  );
}

export function PropostaLanding({ documento, onVerDemo }: PropostaLandingProps) {
  const [baixando, setBaixando] = useState(false);
  const [progresso, setProgresso] = useState('');
  const [erroDownload, setErroDownload] = useState('');
  const raiz = useRef<HTMLDivElement>(null);

  const secoes = useMemo(() => documento.secoes.map(secaoParaLanding), [documento.secoes]);
  const validade = formatarData(documento.validade);

  // Números e frentes do projeto sobem para o topo; o restante segue na ordem da proposta.
  const numeros = secoes.flatMap(s => s.blocos).find(b => b.tipo === 'numeros');
  const frentes = secoes.flatMap(s => s.blocos).find(b => b.tipo === 'cartoes');
  const secoesExibidas = secoes.map(s => ({ ...s, blocos: s.blocos.filter(b => b !== numeros) }));

  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.add('vxl-animar');
    const obs = new IntersectionObserver(entradas => {
      for (const e of entradas) if (e.isIntersecting) { e.target.classList.add('vxl-visivel'); obs.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px' });
    el.querySelectorAll('.vxl-revelar').forEach(n => obs.observe(n));
    return () => obs.disconnect();
  }, [secoes]);

  const baixar = async () => {
    if (baixando) return;
    setBaixando(true);
    setErroDownload('');
    setProgresso('Preparando PDF…');
    try {
      const { baixarProposta } = await import('./baixarProposta');
      await baixarProposta(documento, (pagina, total) => setProgresso(`Gerando PDF: ${pagina} de ${total}`));
    } catch {
      setErroDownload('Não foi possível gerar o PDF.');
    } finally {
      setProgresso('');
      setBaixando(false);
    }
  };

  const prints = documento.demo ? PRINTS_DEMO[documento.demo] : undefined;
  const textoHero = (
    <div className="vxl-hero-texto">
      <span className="vxl-pilula">
        <Sparkles size={13} />
        Proposta comercial{documento.destinatario ? ` · ${documento.destinatario}` : ''}
      </span>
      <h1>{documento.titulo}</h1>
      <p className="vxl-hero-sub">{documento.apresentacao}</p>
      <div className="vxl-hero-acoes">
        <button type="button" className="vxl-botao vxl-botao-primario" onClick={onVerDemo}>
          <Play size={15} fill="currentColor" /> Experimentar a demo
        </button>
        <button type="button" className="vxl-botao vxl-botao-fantasma" disabled={baixando} onClick={baixar}>
          <Download size={15} /> {baixando ? progresso || 'Gerando PDF…' : 'Baixar PDF'}
        </button>
      </div>
      {erroDownload && <p className="vxl-erro" role="alert">{erroDownload}</p>}
      {frentes && frentes.tipo === 'cartoes' && (
        <ul className="vxl-hero-lista">
          {frentes.cartoes.map(c => <li key={c.titulo}><CheckCircle2 size={15} />{c.titulo}</li>)}
        </ul>
      )}
    </div>
  );

  return (
    <div ref={raiz} className="vxl-landing" style={{ '--vxl-marca': documento.corDestaque || '#91672b' } as CSSProperties}>
      <section className={`vxl-hero ${prints ? 'vxl-hero-parallax' : ''}`}>
        <div className="vxl-hero-brilho" aria-hidden="true" />
        {prints ? (
          <HeroParallax products={prints} onSelect={onVerDemo} header={<div className="vxl-container">{textoHero}</div>} />
        ) : (
          <div className="vxl-container vxl-hero-grade">
            {textoHero}
            <div className="vxl-hero-telas">
              <button type="button" className="vxl-hero-tela-principal" onClick={onVerDemo} aria-label="Abrir a demo da plataforma">
                <TelaPortal />
                <span className="vxl-hero-play"><Play size={22} fill="currentColor" /></span>
              </button>
              <div className="vxl-hero-tela-secundaria"><TelaAdmin /></div>
            </div>
          </div>
        )}
        {(numeros?.tipo === 'numeros' || validade) && (
          <div className="vxl-container">
            <div className="vxl-faixa-numeros">
              {numeros?.tipo === 'numeros' && numeros.numeros.map(n => (
                <div key={n.rotulo}><strong>{n.valor}</strong><span>{n.rotulo}</span></div>
              ))}
              {validade && <div><strong className="vxl-faixa-data">{validade}</strong><span>Validade da proposta</span></div>}
            </div>
          </div>
        )}
      </section>

      <nav className="vxl-indice" aria-label="Seções da proposta">
        <div className="vxl-container vxl-indice-trilho">
          {secoes.map((s, i) => (
            <a key={i} href={`#vxl-secao-${i}`}>
              {(s.blocos.find(b => b.tipo === 'faixa') as Extract<Bloco, { tipo: 'faixa' }> | undefined)?.id || s.titulo.replace(/\.$/, '')}
            </a>
          ))}
        </div>
      </nav>

      {secoesExibidas.map((s, i) => <SecaoDaLanding key={i} secao={s} indice={i} />)}

      <section className="vxl-cta">
        <div className="vxl-cta-arco" aria-hidden="true" />
        <div className="vxl-container vxl-cta-conteudo vxl-revelar">
          <span className="vxl-pilula"><PlayCircle size={13} /> Demo interativa</span>
          <h2>Veja a plataforma funcionando antes de decidir.</h2>
          <p>Entre como aluno, assista a uma aula, responda o questionário, ganhe pontos e resgate um prêmio. Depois, aprove o resgate no Painel Administrativo.</p>
          <div className="vxl-hero-acoes">
            <button type="button" className="vxl-botao vxl-botao-primario" onClick={onVerDemo}>
              Abrir a demo <ArrowRight size={15} />
            </button>
            <button type="button" className="vxl-botao vxl-botao-fantasma" disabled={baixando} onClick={baixar}>
              <Download size={15} /> Baixar PDF
            </button>
          </div>
        </div>
      </section>

      <footer className="vxl-rodape">
        <div className="vxl-container vxl-rodape-linha">
          <strong>VIVOX</strong>
          <span>Proposta preparada para {documento.destinatario || 'o cliente'}{validade ? ` · válida até ${validade}` : ''}</span>
          <span><Users size={12} /> Dados da demo são fictícios</span>
        </div>
      </footer>
    </div>
  );
}
