import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { cursosApi } from '../api/cursos';
import type { Curso } from '../types';
import { Plus, Pencil, Trash2, GripVertical, ImageIcon } from 'lucide-react';
import { CapaPositionPicker } from '../components/CapaPositionPicker';
import { VxDialog } from '../components/clean/VxDialog';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Gerenciar cursos no layout clean (canvas › CursosAdmin). CRUD e reordenação de /cursos.

interface SortableCursoProps {
  curso: Curso;
  onEdit: (curso: Curso) => void;
  onDelete: (id: string) => void;
}

function SortableCurso({ curso, onEdit, onDelete }: SortableCursoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: curso.id });
  const aulas = curso.modulos?.reduce((s, m) => s + (m.aulas?.length || 0), 0) || 0;

  return (
    <div
      ref={setNodeRef}
      className="row"
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, position: 'relative', background: isDragging ? 'var(--soft)' : undefined }}
    >
      <button className="ib sm" type="button" aria-label={`Arrastar ${curso.titulo}`} style={{ cursor: 'grab' }} {...attributes} {...listeners}>
        <GripVertical className="i" aria-hidden="true" />
      </button>
      {curso.capaUrl ? (
        <img src={curso.capaUrl} alt="" style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 8, objectPosition: `${curso.capaPosX ?? 50}% ${curso.capaPosY ?? 50}%` }} />
      ) : (
        <span className="mono" style={{ width: 64, height: 40 }}><ImageIcon className="i" aria-hidden="true" /></span>
      )}
      <div className="t">
        <b>{curso.titulo}</b>
        <small>{curso.modulos?.length || 0} módulos · {aulas} {aulas === 1 ? 'aula' : 'aulas'}</small>
      </div>
      <span className={curso.publicado ? 'bd ok' : 'bd plain'}>{curso.publicado ? 'Publicado' : 'Rascunho'}</span>
      <Link className="btn sec sm" to={`/educacional/admin/${curso.id}`}>Conteúdo</Link>
      <button className="ib sm" type="button" aria-label="Editar curso" title="Editar curso" onClick={() => onEdit(curso)}><Pencil className="i" aria-hidden="true" /></button>
      <button className="ib sm" type="button" aria-label="Excluir curso" title="Excluir curso" onClick={() => onDelete(curso.id)}><Trash2 className="i" aria-hidden="true" /></button>
    </div>
  );
}

export function EducacionalAdmin() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [publicado, setPublicado] = useState(false);
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string>('');
  const [capaPosX, setCapaPosX] = useState(50);
  const [capaPosY, setCapaPosY] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      setCursos(await cursosApi.getCursos());
    } catch (error) {
      console.error('Erro ao buscar cursos', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCursos((items) => {
        const novos = arrayMove(items, items.findIndex((i) => i.id === active.id), items.findIndex((i) => i.id === over.id));
        cursosApi.reordenarCursos(novos.map((i) => i.id)).catch((err) => {
          console.error('Erro ao reordenar cursos', err);
          fetchCursos();
        });
        return novos;
      });
    }
  };

  const openModal = (curso?: Curso) => {
    setCapaFile(null);
    setErro('');
    setEditingCurso(curso ?? null);
    setTitulo(curso?.titulo ?? '');
    setDescricao(curso?.descricao || '');
    setPublicado(curso?.publicado ?? false);
    setCapaPreview(curso?.capaUrl || '');
    setCapaPosX(curso?.capaPosX ?? 50);
    setCapaPosY(curso?.capaPosY ?? 50);
    setIsModalOpen(true);
  };

  const handleCapaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapaFile(file);
      setCapaPreview(URL.createObjectURL(file));
      setCapaPosX(50);
      setCapaPosY(50);
    }
  };

  const saveCurso = async () => {
    if (!titulo.trim()) return;
    try {
      setSaving(true);
      setErro('');
      let targetCursoId = editingCurso?.id;
      const dados = { titulo, descricao, publicado, capaPosX, capaPosY };
      if (!targetCursoId) {
        const novoCurso = await cursosApi.createCurso(dados);
        targetCursoId = novoCurso.id;
        if (capaFile) {
          await cursosApi.uploadCursoCapa(targetCursoId, capaFile);
          if (capaPosX !== 50 || capaPosY !== 50) await cursosApi.updateCurso(targetCursoId, { capaPosX, capaPosY });
        }
      } else {
        if (capaFile) await cursosApi.uploadCursoCapa(targetCursoId, capaFile);
        await cursosApi.updateCurso(targetCursoId, dados);
      }
      setIsModalOpen(false);
      fetchCursos();
    } catch (error) {
      console.error('Erro ao salvar curso', error);
      setErro('Não foi possível salvar o curso.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCurso = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este curso? Todas as aulas serão perdidas.')) return;
    try {
      await cursosApi.deleteCurso(id);
      fetchCursos();
    } catch (error) {
      console.error('Erro ao excluir curso', error);
    }
  };

  return (
    <div className="vxp">
      <div className="pg" style={{ maxWidth: 1000 }}>
        <div className="ph">
          <div>
            <span className="kick">Vivox Educacional</span>
            <h1 style={{ marginTop: 6 }}>Gerenciar cursos</h1>
            <p>Arraste para mudar a ordem em que os cursos aparecem para a equipe.</p>
          </div>
          <div className="acts">
            <Link className="btn gh" to="/educacional">Ver como aluno</Link>
            <button className="btn pri" type="button" onClick={() => openModal()}><Plus className="i" aria-hidden="true" />Novo curso</button>
          </div>
        </div>

        {loading ? (
          <div className="card animate-pulse" style={{ height: 240 }} aria-busy="true" />
        ) : cursos.length === 0 ? (
          <div className="card empty"><b>Nenhum curso cadastrado</b><span>Crie o primeiro curso para a equipe.</span></div>
        ) : (
          <section className="card">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={cursos.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                {cursos.map((curso) => (
                  <SortableCurso key={curso.id} curso={curso} onEdit={openModal} onDelete={deleteCurso} />
                ))}
              </SortableContext>
            </DndContext>
          </section>
        )}
      </div>

      <VxDialog open={isModalOpen} onClose={() => !saving && setIsModalOpen(false)} title={editingCurso ? 'Editar curso' : 'Novo curso'}>
        <div className="fld">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label>Capa do curso</label>
            <button className="btn gh sm" type="button" onClick={() => fileInputRef.current?.click()} disabled={saving}>
              <ImageIcon className="i" aria-hidden="true" />{capaPreview ? 'Trocar imagem' : 'Escolher imagem'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleCapaFileChange} />
          </div>
          {capaPreview ? (
            <CapaPositionPicker imageUrl={capaPreview} posX={capaPosX} posY={capaPosY} onChange={(x, y) => { setCapaPosX(x); setCapaPosY(y); }} />
          ) : (
            <div style={{ height: 120, borderRadius: 12, border: '1px dashed var(--ln2)', display: 'grid', placeItems: 'center', color: 'var(--ink3)', fontSize: 12.5 }}>Sem capa</div>
          )}
        </div>
        <div className="fld">
          <label htmlFor="c-tit">Título *</label>
          <input id="c-tit" className="inp" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Formação em gestão de redes sociais" disabled={saving} />
        </div>
        <div className="fld">
          <label htmlFor="c-desc">Descrição</label>
          <textarea id="c-desc" className="inp" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Objetivo do curso" disabled={saving} />
        </div>
        <label className="row" style={{ padding: 0, border: 0, cursor: 'pointer' }}>
          <input type="checkbox" checked={publicado} onChange={(e) => setPublicado(e.target.checked)} disabled={saving} />
          <span>Curso publicado (visível para a equipe)</span>
        </label>
        {erro && <p role="alert" style={{ color: 'var(--bad)', fontSize: 12.5 }}>{erro}</p>}
        <div className="acts" style={{ justifyContent: 'flex-end' }}>
          <button className="btn sec" type="button" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancelar</button>
          <button className="btn pri" type="button" onClick={saveCurso} disabled={saving || !titulo.trim()}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </VxDialog>
    </div>
  );
}
