import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cursosApi } from '../api/cursos';
import type { Curso, Modulo, Aula } from '../types';
import { Plus, Pencil, Trash2, GripVertical, FileVideo, ImageIcon } from 'lucide-react';
import { VxDialog } from '../components/clean/VxDialog';
import { CapaPositionPicker } from '../components/CapaPositionPicker';
import { detectVimeoDuration, detectYouTubeDuration, extractYouTubeId } from '../utils/durationDetection';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableAula({ aula, onEdit, onDelete }: { aula: Aula; onEdit: (a: Aula) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: aula.id });
  return (
    <div
      ref={setNodeRef}
      className="row"
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, position: 'relative', background: isDragging ? 'var(--soft)' : undefined, padding: '10px 16px' }}
    >
      <button className="ib sm" type="button" aria-label={`Arrastar ${aula.titulo}`} style={{ cursor: 'grab' }} {...attributes} {...listeners}>
        <GripVertical className="i" aria-hidden="true" />
      </button>
      {aula.capaUrl ? (
        <img src={aula.capaUrl} alt="" style={{ width: 48, height: 32, borderRadius: 6, objectFit: 'cover', objectPosition: `${aula.capaPosX ?? 50}% ${aula.capaPosY ?? 50}%` }} />
      ) : (
        <span className="mono" style={{ width: 48, height: 32 }}><FileVideo className="i" aria-hidden="true" /></span>
      )}
      <div className="t">
        <b>{aula.titulo}</b>
        {aula.duracaoSeg ? <small>{Math.floor(aula.duracaoSeg / 60)} min</small> : null}
      </div>
      <button className="ib sm" type="button" aria-label="Editar aula" onClick={() => onEdit(aula)}><Pencil className="i" aria-hidden="true" /></button>
      <button className="ib sm" type="button" aria-label="Excluir aula" onClick={() => onDelete(aula.id)}><Trash2 className="i" aria-hidden="true" /></button>
    </div>
  );
}

function SortableModulo({
  modulo,
  indice,
  onEditModulo,
  onDeleteModulo,
  onAddAula,
  onEditAula,
  onDeleteAula,
  onReorderAulas,
}: {
  modulo: Modulo;
  indice: number;
  onEditModulo: (m: Modulo) => void;
  onDeleteModulo: (id: string) => void;
  onAddAula: (moduloId: string) => void;
  onEditAula: (a: Aula) => void;
  onDeleteAula: (id: string) => void;
  onReorderAulas: (moduloId: string, event: DragEndEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: modulo.id });
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  return (
    <section
      ref={setNodeRef}
      className="card"
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, position: 'relative', overflow: 'hidden', boxShadow: isDragging ? '0 12px 30px -14px rgba(40,25,5,.4)' : undefined }}
    >
      <div className="ch" style={{ background: 'var(--soft)', justifyContent: 'flex-start' }}>
        <button className="ib sm" type="button" aria-label={`Arrastar ${modulo.titulo}`} style={{ cursor: 'grab' }} {...attributes} {...listeners}>
          <GripVertical className="i" aria-hidden="true" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="kick">Módulo {indice + 1}</span>
          <h2 style={{ marginTop: 2 }}>{modulo.titulo}</h2>
        </div>
        <span className="mut" style={{ fontSize: 12.5 }}>{modulo.aulas?.length || 0} aulas</span>
        <button className="btn sec sm" type="button" onClick={() => onAddAula(modulo.id)}><Plus className="i" aria-hidden="true" />Aula</button>
        <button className="ib sm" type="button" aria-label="Editar módulo" onClick={() => onEditModulo(modulo)}><Pencil className="i" aria-hidden="true" /></button>
        <button className="ib sm" type="button" aria-label="Excluir módulo" onClick={() => onDeleteModulo(modulo.id)}><Trash2 className="i" aria-hidden="true" /></button>
      </div>
      {modulo.aulas?.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onReorderAulas(modulo.id, e)}>
          <SortableContext items={modulo.aulas.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            {modulo.aulas.map((aula) => (
              <SortableAula key={aula.id} aula={aula} onEdit={onEditAula} onDelete={onDeleteAula} />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <div className="cp mut" style={{ fontSize: 12.5 }}>Nenhuma aula neste módulo.</div>
      )}
    </section>
  );
}

export function EducacionalCursoEditor() {
  const { cursoId } = useParams<{ cursoId: string }>();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);

  // Modais state
  const [moduloModalOpen, setModuloModalOpen] = useState(false);
  const [aulaModalOpen, setAulaModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingModulo, setEditingModulo] = useState<Modulo | null>(null);
  const [moduloData, setModuloData] = useState({ titulo: '' });

  const [editingAula, setEditingAula] = useState<Aula | null>(null);
  const [activeModuloId, setActiveModuloId] = useState<string>('');
  
  // Aula Form Data
  const [aulaTitulo, setAulaTitulo] = useState('');
  const [aulaDescricao, setAulaDescricao] = useState('');
  const [aulaVideoUrl, setAulaVideoUrl] = useState('');
  const [aulaDuracaoSeg, setAulaDuracaoSeg] = useState(0);
  const [detectingDuration, setDetectingDuration] = useState(false);
  const [durationError, setDurationError] = useState(false);
  
  // Capa State
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string>('');
  const [capaPosX, setCapaPosX] = useState(50);
  const [capaPosY, setCapaPosY] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (cursoId) fetchCurso();
  }, [cursoId]);

  useEffect(() => {
    if (!aulaVideoUrl.trim() || !aulaModalOpen || editingAula?.videoUrl === aulaVideoUrl) return;

    const timer = setTimeout(async () => {
      setDetectingDuration(true);
      setDurationError(false);

      try {
        let duration = null;
        if (aulaVideoUrl.includes('vimeo.com')) {
          duration = await detectVimeoDuration(aulaVideoUrl);
        } else {
          const ytId = extractYouTubeId(aulaVideoUrl);
          if (ytId) {
            duration = await detectYouTubeDuration(ytId);
          }
        }
        
        if (duration && duration > 0) {
          setAulaDuracaoSeg(duration);
        } else {
          setDurationError(true);
        }
      } catch (e) {
        setDurationError(true);
      } finally {
        setDetectingDuration(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [aulaVideoUrl, aulaModalOpen]);

  const fetchCurso = async () => {
    try {
      setLoading(true);
      if (!cursoId) return;
      const data = await cursosApi.getCurso(cursoId);
      setCurso(data);
    } catch (error) {
      console.error('Erro ao buscar curso', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEndModulos = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && curso) {
      const oldIndex = curso.modulos.findIndex(m => m.id === active.id);
      const newIndex = curso.modulos.findIndex(m => m.id === over.id);
      const newModulos = arrayMove(curso.modulos, oldIndex, newIndex);
      
      setCurso({ ...curso, modulos: newModulos });
      
      cursosApi.reordenarModulos(curso.id, newModulos.map(m => m.id)).catch(err => {
        console.error('Erro reordenar modulos', err);
        fetchCurso();
      });
    }
  };

  const handleDragEndAulas = async (moduloId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && curso) {
      const modulo = curso.modulos.find(m => m.id === moduloId);
      if (!modulo) return;

      const oldIndex = modulo.aulas.findIndex(a => a.id === active.id);
      const newIndex = modulo.aulas.findIndex(a => a.id === over.id);
      const newAulas = arrayMove(modulo.aulas, oldIndex, newIndex);

      const newModulos = curso.modulos.map(m => m.id === moduloId ? { ...m, aulas: newAulas } : m);
      setCurso({ ...curso, modulos: newModulos });

      cursosApi.reordenarAulas(moduloId, newAulas.map(a => a.id)).catch(err => {
        console.error('Erro reordenar aulas', err);
        fetchCurso();
      });
    }
  };

  const openModuloModal = (modulo?: Modulo) => {
    if (modulo) {
      setEditingModulo(modulo);
      setModuloData({ titulo: modulo.titulo });
    } else {
      setEditingModulo(null);
      setModuloData({ titulo: '' });
    }
    setModuloModalOpen(true);
  };

  const saveModulo = async () => {
    if (!moduloData.titulo.trim() || !cursoId) return;
    setSaving(true);
    try {
      if (editingModulo) {
        await cursosApi.updateModulo(editingModulo.id, moduloData);
      } else {
        await cursosApi.createModulo(cursoId, moduloData);
      }
      setModuloModalOpen(false);
      fetchCurso();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const deleteModulo = async (id: string) => {
    if (window.confirm('Tem certeza? Todas as aulas deste módulo serão excluídas.')) {
      await cursosApi.deleteModulo(id);
      fetchCurso();
    }
  };

  const openAulaModal = (moduloId: string, aula?: Aula) => {
    setActiveModuloId(moduloId);
    setCapaFile(null);
    setDetectingDuration(false);
    setDurationError(false);
    if (aula) {
      setEditingAula(aula);
      setAulaTitulo(aula.titulo);
      setAulaDescricao(aula.descricao || '');
      setAulaVideoUrl(aula.videoUrl);
      setAulaDuracaoSeg(aula.duracaoSeg || 0);
      setCapaPreview(aula.capaUrl || '');
      setCapaPosX(aula.capaPosX ?? 50);
      setCapaPosY(aula.capaPosY ?? 50);
    } else {
      setEditingAula(null);
      setAulaTitulo('');
      setAulaDescricao('');
      setAulaVideoUrl('');
      setAulaDuracaoSeg(0);
      setCapaPreview('');
      setCapaPosX(50);
      setCapaPosY(50);
    }
    setAulaModalOpen(true);
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

  const saveAula = async () => {
    if (!aulaTitulo.trim() || !aulaVideoUrl.trim()) return;
    setSaving(true);
    try {
      let targetAulaId = editingAula?.id;
      
      const aulaDataToSend = { 
        titulo: aulaTitulo, 
        descricao: aulaDescricao, 
        videoUrl: aulaVideoUrl, 
        duracaoSeg: aulaDuracaoSeg,
        capaPosX,
        capaPosY
      };

      if (!targetAulaId) {
        // Criar aula nova primeiro
        const novaAula = await cursosApi.createAula(activeModuloId, aulaDataToSend);
        targetAulaId = novaAula.id;
        
        if (capaFile) {
          await cursosApi.uploadAulaCapa(targetAulaId, capaFile);
          // Se a posicao foi alterada diferente de 50, atualiza
          if (capaPosX !== 50 || capaPosY !== 50) {
            await cursosApi.updateAula(targetAulaId, { capaPosX, capaPosY });
          }
        }
      } else {
        // Aula Existente
        if (capaFile) {
          await cursosApi.uploadAulaCapa(targetAulaId, capaFile);
        }
        await cursosApi.updateAula(targetAulaId, aulaDataToSend);
      }
      
      setAulaModalOpen(false);
      fetchCurso();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const deleteAula = async (id: string) => {
    if (window.confirm('Excluir esta aula?')) {
      await cursosApi.deleteAula(id);
      fetchCurso();
    }
  };

  if (loading || !curso) {
    return (
      <div className="vxp">
        <div className="pg" style={{ maxWidth: 1000 }}>
          {loading ? (
            <div className="card animate-pulse" style={{ height: 280 }} aria-busy="true" />
          ) : (
            <div className="card empty"><b>Curso não encontrado.</b><Link className="btn sec sm" to="/educacional/admin">Voltar</Link></div>
          )}
        </div>
      </div>
    );
  }

  const fmtDur = (seg: number) => `${Math.floor(seg / 60)}:${(seg % 60).toString().padStart(2, '0')}`;

  return (
    <div className="vxp">
      <div className="pg" style={{ maxWidth: 1000 }}>
        <div className="ph">
          <div>
            <span className="kick">Editor de conteúdo</span>
            <h1 style={{ marginTop: 6 }}>{curso.titulo}</h1>
            <p>Arraste módulos e aulas para mudar a ordem.</p>
          </div>
          <div className="acts">
            <Link className="btn gh" to="/educacional/admin">Voltar aos cursos</Link>
            <button className="btn pri" type="button" onClick={() => openModuloModal()}><Plus className="i" aria-hidden="true" />Novo módulo</button>
          </div>
        </div>

        {curso.modulos?.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndModulos}>
            <SortableContext items={curso.modulos.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              {curso.modulos.map((modulo, mi) => (
                <SortableModulo
                  key={modulo.id}
                  modulo={modulo}
                  indice={mi}
                  onEditModulo={openModuloModal}
                  onDeleteModulo={deleteModulo}
                  onAddAula={(mId) => openAulaModal(mId)}
                  onEditAula={(a) => openAulaModal(modulo.id, a)}
                  onDeleteAula={deleteAula}
                  onReorderAulas={handleDragEndAulas}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="card empty"><b>Nenhum módulo criado</b><span>Crie o primeiro módulo e adicione as aulas.</span></div>
        )}
      </div>

      <VxDialog open={moduloModalOpen} onClose={() => !saving && setModuloModalOpen(false)} title={editingModulo ? 'Editar módulo' : 'Novo módulo'}>
        <div className="fld">
          <label htmlFor="m-tit">Título do módulo *</label>
          <input id="m-tit" className="inp" value={moduloData.titulo} onChange={(e) => setModuloData((prev) => ({ ...prev, titulo: e.target.value }))} placeholder="Ex.: Introdução" disabled={saving} />
        </div>
        <div className="acts" style={{ justifyContent: 'flex-end' }}>
          <button className="btn sec" type="button" onClick={() => setModuloModalOpen(false)} disabled={saving}>Cancelar</button>
          <button className="btn pri" type="button" onClick={saveModulo} disabled={saving || !moduloData.titulo.trim()}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </VxDialog>

      <VxDialog open={aulaModalOpen} onClose={() => !saving && setAulaModalOpen(false)} title={editingAula ? 'Editar aula' : 'Nova aula'}>
        <div className="fld">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label>Capa da aula</label>
            <button className="btn gh sm" type="button" onClick={() => fileInputRef.current?.click()} disabled={saving}>
              <ImageIcon className="i" aria-hidden="true" />{capaPreview ? 'Trocar imagem' : 'Escolher imagem'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleCapaFileChange} />
          </div>
          {capaPreview ? (
            <CapaPositionPicker imageUrl={capaPreview} posX={capaPosX} posY={capaPosY} onChange={(x, y) => { setCapaPosX(x); setCapaPosY(y); }} />
          ) : (
            <div style={{ height: 100, borderRadius: 12, border: '1px dashed var(--ln2)', display: 'grid', placeItems: 'center', color: 'var(--ink3)', fontSize: 12.5 }}>Sem capa</div>
          )}
        </div>
        <div className="fld">
          <label htmlFor="a-tit">Título da aula *</label>
          <input id="a-tit" className="inp" value={aulaTitulo} onChange={(e) => setAulaTitulo(e.target.value)} placeholder="Ex.: Aula 01" disabled={saving} />
        </div>
        <div className="fld">
          <label htmlFor="a-url">Vídeo (YouTube ou Vimeo) *</label>
          <input id="a-url" className="inp" value={aulaVideoUrl} onChange={(e) => setAulaVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." disabled={saving} />
        </div>
        <div className="fld">
          <label htmlFor="a-dur">Duração</label>
          {detectingDuration ? (
            <small>Detectando a duração...</small>
          ) : aulaDuracaoSeg > 0 && !durationError ? (
            <input id="a-dur" className="inp" value={`${fmtDur(aulaDuracaoSeg)} (${aulaDuracaoSeg}s)`} readOnly />
          ) : durationError ? (
            <>
              <small style={{ color: 'var(--bad)' }}>Não deu para detectar a duração. Informe em segundos.</small>
              <input id="a-dur" className="inp" type="number" value={aulaDuracaoSeg} onChange={(e) => setAulaDuracaoSeg(parseInt(e.target.value) || 0)} disabled={saving} />
            </>
          ) : (
            <small>Cole o endereço do vídeo para detectar a duração.</small>
          )}
        </div>
        <div className="fld">
          <label htmlFor="a-desc">Descrição</label>
          <textarea id="a-desc" className="inp" rows={3} value={aulaDescricao} onChange={(e) => setAulaDescricao(e.target.value)} disabled={saving} />
        </div>
        <div className="acts" style={{ justifyContent: 'flex-end' }}>
          <button className="btn sec" type="button" onClick={() => setAulaModalOpen(false)} disabled={saving}>Cancelar</button>
          <button className="btn pri" type="button" onClick={saveAula} disabled={saving || !aulaTitulo.trim() || !aulaVideoUrl.trim()}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </VxDialog>
    </div>
  );
}
