import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Check, PlayCircle } from 'lucide-react';
import { educacionalApi } from '../api/cursos';
import type { Curso, Aula } from '../types';
import { toEmbedUrl } from '../utils/videoEmbed';

// Player do curso no layout clean (canvas › Curso). GET do curso com progresso; marcar/desmarcar aula.

const minutos = (seg?: number | null) => (seg ? `${Math.max(1, Math.round(seg / 60))} min` : '');

export function EducacionalCurso() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const aulaParam = searchParams.get('aula');

  const fetchCurso = async (cursoId: string, silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      setCurso(await educacionalApi.getCursoById(cursoId));
    } catch (error) {
      console.error('Erro ao buscar curso', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCurso(id);
  }, [id]);

  // Lista plana de aulas na ordem do curso, com o nome do módulo
  const plano = useMemo(
    () =>
      (curso?.modulos || []).flatMap((m, mi) =>
        (m.aulas || []).map((a) => ({ aula: a, modulo: `Módulo ${mi + 1} · ${m.titulo}` })),
      ),
    [curso],
  );
  const idx = Math.max(0, plano.findIndex((p) => p.aula.id === aulaParam));
  const atual = plano[idx];
  const aulaAtual: Aula | undefined = atual?.aula;
  const feitas = plano.filter((p) => p.aula.progresso?.concluidoEm).length;

  const ir = (i: number) => {
    const alvo = plano[i];
    if (alvo) setSearchParams({ aula: alvo.aula.id });
  };

  const alternarConcluida = async () => {
    if (!aulaAtual || !id) return;
    setSalvando(true);
    try {
      if (aulaAtual.progresso?.concluidoEm) await educacionalApi.desmarcarAula(aulaAtual.id);
      else await educacionalApi.concluirAula(aulaAtual.id);
      await fetchCurso(id, true);
    } catch (error) {
      console.error('Erro ao concluir aula', error);
    } finally {
      setSalvando(false);
    }
  };

  if (loading || !curso) {
    return (
      <div className="vxp">
        <div className="pg">
          {loading ? (
            <div className="animate-pulse" aria-busy="true" style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0,2.2fr) minmax(0,1fr)' }}>
              <div className="card" style={{ aspectRatio: '16/9' }} />
              <div className="card" style={{ height: 320 }} />
            </div>
          ) : (
            <div className="card empty">
              <b>Curso não encontrado.</b>
              <Link className="btn sec sm" to="/educacional">Voltar aos cursos</Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  const concluida = !!aulaAtual?.progresso?.concluidoEm;

  return (
    <div className="vxp">
      <div className="pg" style={{ maxWidth: 1320 }}>
        <div className="ph" style={{ marginBottom: -4 }}>
          <div>
            <span className="kick">Vivox Educacional</span>
            <h1 style={{ marginTop: 6 }}>{curso.titulo}</h1>
          </div>
          <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="meta" style={{ justifyContent: 'space-between' }}><span>Seu progresso</span><b style={{ color: 'var(--ink)' }}>{curso.progressoPercentual ?? 0}%</b></div>
            <div className="bar"><i style={{ width: `${curso.progressoPercentual ?? 0}%` }} /></div>
          </div>
        </div>

        <div className="grid vxp-curso" style={{ alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {aulaAtual ? (
              <>
                <div className="player">
                  <iframe src={toEmbedUrl(aulaAtual.videoUrl)} title={aulaAtual.titulo} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <span className="kick">{atual.modulo}</span>
                    <h2 style={{ fontSize: 22, fontWeight: 650, marginTop: 6 }}>{aulaAtual.titulo}</h2>
                    {aulaAtual.duracaoSeg ? <p className="mut" style={{ marginTop: 4 }}>{minutos(aulaAtual.duracaoSeg)} de vídeo</p> : null}
                  </div>
                  <div className="acts">
                    <button className="btn sec" type="button" onClick={alternarConcluida} disabled={salvando}>
                      {concluida ? <><Check className="i" aria-hidden="true" />Concluída</> : 'Marcar como concluída'}
                    </button>
                    <button className="btn sec" type="button" onClick={() => ir(idx - 1)} disabled={idx === 0}>Anterior</button>
                    <button className="btn pri" type="button" onClick={() => ir(idx + 1)} disabled={idx >= plano.length - 1}>Próxima aula</button>
                  </div>
                </div>
                {aulaAtual.descricao && <p style={{ maxWidth: 680, color: 'var(--ink2)', whiteSpace: 'pre-wrap' }}>{aulaAtual.descricao}</p>}
              </>
            ) : (
              <div className="card empty"><b>Este curso ainda não tem aulas.</b></div>
            )}
          </div>

          <section className="card" style={{ overflow: 'hidden' }}>
            <div className="ch"><h2>Conteúdo do curso</h2><span className="mut" style={{ fontSize: 12.5 }}>{feitas} de {plano.length}</span></div>
            {(curso.modulos || []).map((m, mi) => (
              <div key={m.id}>
                <div className="mod-t">Módulo {mi + 1} · {m.titulo}</div>
                {(m.aulas || []).map((a) => {
                  const i = plano.findIndex((p) => p.aula.id === a.id);
                  const ok = !!a.progresso?.concluidoEm;
                  return (
                    <button key={a.id} className={i === idx ? 'au on' : 'au'} type="button" onClick={() => ir(i)} aria-current={i === idx ? 'true' : undefined}>
                      <span className={ok ? 'ck2 ok' : 'ck2'}>{ok ? <Check className="i" aria-hidden="true" /> : i === idx ? <PlayCircle className="i" aria-hidden="true" /> : null}</span>
                      <span>{a.titulo}</span>
                      <small>{minutos(a.duracaoSeg)}</small>
                    </button>
                  );
                })}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
