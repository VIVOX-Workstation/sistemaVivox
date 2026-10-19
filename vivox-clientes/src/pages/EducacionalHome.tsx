import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Settings2 } from 'lucide-react';
import { educacionalApi } from '../api/cursos';
import type { Curso } from '../types';
import { useAuth } from '../context/AuthContext';

// Vivox Educacional no layout clean (canvas › Educacional). Cursos publicados de /educacional.

const CORES = ['#5E4A2E', '#3E5468', '#4F5E44', '#6A4A52', '#4A4E66'];

const duracao = (seg: number) => {
  if (!seg) return null;
  const min = Math.round(seg / 60);
  return min >= 60 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}min` : `${min}min`;
};

export function EducacionalHome() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = async () => {
    setLoading(true);
    setErro(false);
    try {
      setCursos(await educacionalApi.getCursosPublicados());
    } catch (error) {
      console.error('Erro ao buscar cursos', error);
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="vxp">
      <div className="pg">
        <div className="ph">
          <div>
            <h1>Vivox Educacional</h1>
            <p>Cursos e treinamentos internos da equipe.</p>
          </div>
          {user?.role === 'ADMIN' && (
            <div className="acts">
              <Link className="btn sec" to="/educacional/admin"><Settings2 className="i" aria-hidden="true" />Gerenciar cursos</Link>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid g3 animate-pulse" aria-busy="true">{[1, 2, 3].map((i) => <div key={i} className="card" style={{ height: 300 }} />)}</div>
        ) : erro ? (
          <div className="card empty">
            <b>Não foi possível carregar os cursos.</b>
            <button className="btn pri sm" type="button" onClick={carregar}>Tentar de novo</button>
          </div>
        ) : cursos.length === 0 ? (
          <div className="card empty">
            <b>Nenhum curso disponível no momento</b>
            <span>Os cursos publicados pela administração aparecem aqui.</span>
          </div>
        ) : (
          <div className="grid g3">
            {cursos.map((c, i) => {
              const aulas = c.modulos?.flatMap((m) => m.aulas || []) || [];
              const feitas = aulas.filter((a) => a.progresso?.concluidoEm).length;
              const pct = c.progressoPercentual ?? (aulas.length ? Math.round((feitas / aulas.length) * 100) : 0);
              const dur = duracao(aulas.reduce((s, a) => s + (a.duracaoSeg || 0), 0));
              return (
                <Link className="card cs" key={c.id} to={`/educacional/curso/${c.id}`}>
                  <div className="cv" style={{ background: CORES[i % CORES.length] }}>
                    {c.capaUrl ? (
                      <img src={c.capaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${c.capaPosX ?? 50}% ${c.capaPosY ?? 50}%` }} />
                    ) : (
                      <GraduationCap className="i" aria-hidden="true" />
                    )}
                  </div>
                  <div className="cs-b">
                    <span className="kick">{aulas.length} {aulas.length === 1 ? 'aula' : 'aulas'}{dur ? ` · ${dur}` : ''}</span>
                    <b>{c.titulo}</b>
                    {c.descricao && <p>{c.descricao}</p>}
                    <div className="bar" style={{ marginTop: 4 }}><i style={{ width: `${pct}%` }} /></div>
                    <small className="mut" style={{ fontSize: 12 }}>
                      {pct >= 100
                        ? 'Concluído'
                        : feitas > 0
                        ? `${feitas} de ${aulas.length} aulas assistidas`
                        : pct > 0
                        ? `${pct}% concluído`
                        : 'Não iniciado'}
                    </small>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
