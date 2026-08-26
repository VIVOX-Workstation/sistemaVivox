import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cursosApi } from '../api/cursos';
import type { Curso, Modulo, Aula } from '../types';
import { ChevronLeft, Plus, Edit2, Trash2, GripVertical, FileVideo, ImageIcon } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
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

function SortableAula({ aula, onEdit, onDelete }: { aula: Aula, onEdit: (a: Aula) => void, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: aula.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 bg-[#FAF7F2] p-3 rounded-lg border ${isDragging ? 'border-[#C7A15F] shadow-md opacity-90' : 'border-[#EBE3D5]'}`}>
      <div {...attributes} {...listeners} className="cursor-grab text-[#B9AEA0] hover:text-[#8F8271]">
        <GripVertical className="w-4 h-4" />
      </div>
      
      {aula.capaUrl ? (
        <img 
          src={aula.capaUrl} 
          alt="Capa" 
          className="w-12 h-12 rounded object-cover"
          style={{ objectPosition: `${aula.capaPosX ?? 50}% ${aula.capaPosY ?? 50}%` }}
        />
      ) : (
        <div className="w-12 h-12 rounded bg-[#EBE3D5] flex items-center justify-center">
          <FileVideo className="w-5 h-5 text-[#8F8271]" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-[#1E1A16] truncate">{aula.titulo}</h4>
        {aula.duracaoSeg ? (
          <span className="text-xs text-[#8F8271]">{Math.floor(aula.duracaoSeg / 60)} min</span>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onEdit(aula)} className="p-1.5 text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#EBE3D5] rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(aula.id)} className="p-1.5 text-[#8F8271] hover:text-[#B83B32] hover:bg-[#FCE8E6] rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function SortableModulo({ 
  modulo, 
  onEditModulo, 
  onDeleteModulo, 
  onAddAula, 
  onEditAula, 
  onDeleteAula,
  onReorderAulas
}: { 
  modulo: Modulo, 
  onEditModulo: (m: Modulo) => void, 
  onDeleteModulo: (id: string) => void,
  onAddAula: (moduloId: string) => void,
  onEditAula: (a: Aula) => void,
  onDeleteAula: (id: string) => void,
  onReorderAulas: (moduloId: string, event: DragEndEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: modulo.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div ref={setNodeRef} style={style} className={`bg-white rounded-xl border ${isDragging ? 'border-[#C7A15F] shadow-xl opacity-90' : 'border-[#EBE3D5] shadow-sm'}`}>
      <div className="flex items-center gap-3 p-4 border-b border-[#EBE3D5] bg-[#FAF7F2] rounded-t-xl">
        <div {...attributes} {...listeners} className="cursor-grab text-[#B9AEA0] hover:text-[#8F8271]">
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#1E1A16] truncate">{modulo.titulo}</h3>
          <span className="text-xs text-[#8F8271]">{modulo.aulas?.length || 0} aulas</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onAddAula(modulo.id)} className="text-xs font-semibold px-2 py-1 bg-white border border-[#EBE3D5] text-[#1E1A16] hover:bg-[#EBE3D5] rounded transition-colors">
            + Aula
          </button>
          <button onClick={() => onEditModulo(modulo)} className="p-1.5 text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#EBE3D5] rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => onDeleteModulo(modulo.id)} className="p-1.5 text-[#8F8271] hover:text-[#B83B32] hover:bg-[#FCE8E6] rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      
      <div className="p-4 bg-white rounded-b-xl">
        {modulo.aulas?.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onReorderAulas(modulo.id, e)}>
            <SortableContext items={modulo.aulas.map(a => a.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {modulo.aulas.map(aula => (
                  <SortableAula key={aula.id} aula={aula} onEdit={onEditAula} onDelete={onDeleteAula} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-4 text-sm text-[#8F8271]">Nenhuma aula neste módulo.</div>
        )}
      </div>
    </div>
  );
}

export function EducacionalCursoEditor() {
  const { cursoId } = useParams<{ cursoId: string }>();
  const navigate = useNavigate();
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

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#C7A15F] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!curso) {
    return <div className="text-center py-20 text-[#8F8271]">Curso não encontrado.</div>;
  }

  return (
    <div className="flex flex-col h-full space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#EBE3D5] shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/educacional/admin')} className="p-2 hover:bg-[#F6F0E7] rounded-lg transition-colors text-[#8F8271]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1E1A16] tracking-tight">{curso.titulo}</h1>
            <p className="text-sm text-[#8F8271]">Editor de Conteúdo</p>
          </div>
        </div>
        <Button onClick={() => openModuloModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Módulo
        </Button>
      </div>

      <div className="bg-[#FAF7F2] rounded-xl flex-1">
        {curso.modulos?.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndModulos}>
            <SortableContext items={curso.modulos.map(m => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {curso.modulos.map(modulo => (
                  <SortableModulo 
                    key={modulo.id} 
                    modulo={modulo} 
                    onEditModulo={openModuloModal}
                    onDeleteModulo={deleteModulo}
                    onAddAula={(mId) => openAulaModal(mId)}
                    onEditAula={(a) => openAulaModal(modulo.id, a)}
                    onDeleteAula={deleteAula}
                    onReorderAulas={handleDragEndAulas}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-12 text-[#8F8271] bg-white rounded-xl border border-[#EBE3D5]">
            <p>Nenhum módulo criado.</p>
          </div>
        )}
      </div>

      <Modal isOpen={moduloModalOpen} onClose={() => !saving && setModuloModalOpen(false)} title={editingModulo ? 'Editar Módulo' : 'Novo Módulo'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1E1A16] mb-1">Título do Módulo *</label>
            <Input 
              value={moduloData.titulo}
              onChange={e => setModuloData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ex: Introdução"
              disabled={saving}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setModuloModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={saveModulo} disabled={saving || !moduloData.titulo.trim()}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={aulaModalOpen} onClose={() => !saving && setAulaModalOpen(false)} title={editingAula ? 'Editar Aula' : 'Nova Aula'}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EBE3D5] flex flex-col items-center gap-4">
            <div className="w-full flex justify-between items-center">
              <label className="block text-sm font-semibold text-[#1E1A16]">Capa da Aula</label>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold px-3 py-1.5 bg-white border border-[#EBE3D5] text-[#1E1A16] hover:bg-[#EBE3D5] rounded transition-colors flex items-center gap-1"
                disabled={saving}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                {capaPreview ? 'Trocar Imagem' : 'Selecionar Imagem'}
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleCapaFileChange}
              />
            </div>
            
            {capaPreview ? (
              <CapaPositionPicker 
                imageUrl={capaPreview}
                posX={capaPosX}
                posY={capaPosY}
                onChange={(x, y) => {
                  setCapaPosX(x);
                  setCapaPosY(y);
                }}
              />
            ) : (
              <div className="w-48 h-48 rounded-xl border-2 border-dashed border-[#D3C7B6] flex flex-col items-center justify-center text-[#8F8271]">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs">Sem capa</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1E1A16] mb-1">Título da Aula *</label>
            <Input 
              value={aulaTitulo}
              onChange={e => setAulaTitulo(e.target.value)}
              placeholder="Ex: Aula 01"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E1A16] mb-1">URL do Vídeo (YouTube/Vimeo) *</label>
            <Input 
              value={aulaVideoUrl}
              onChange={e => setAulaVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E1A16] mb-1">Duração do Vídeo</label>
            {detectingDuration ? (
              <div className="flex items-center gap-2 text-[#8F8271] text-sm h-10 px-3 border border-transparent">
                <div className="w-4 h-4 border-2 border-[#C7A15F] border-t-transparent rounded-full animate-spin"></div>
                Detectando duração...
              </div>
            ) : aulaDuracaoSeg > 0 && !durationError ? (
              <div className="flex items-center text-[#1E1A16] font-semibold text-sm h-10 px-3 bg-[#EBE3D5] rounded-lg border border-[#D3C7B6]">
                {Math.floor(aulaDuracaoSeg / 60)}:{(aulaDuracaoSeg % 60).toString().padStart(2, '0')} ({aulaDuracaoSeg}s)
              </div>
            ) : durationError ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#B83B32]">Não foi possível detectar a duração automaticamente.</p>
                <Input 
                  type="number"
                  value={aulaDuracaoSeg}
                  onChange={e => setAulaDuracaoSeg(parseInt(e.target.value) || 0)}
                  placeholder="Duração manual em segundos"
                  disabled={saving}
                />
              </div>
            ) : (
              <div className="text-sm text-[#8F8271] h-10 px-3 flex items-center border border-transparent">
                Insira a URL para detectar a duração.
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E1A16] mb-1">Descrição</label>
            <Textarea 
              value={aulaDescricao}
              onChange={e => setAulaDescricao(e.target.value)}
              disabled={saving}
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#EBE3D5]">
            <Button variant="outline" onClick={() => setAulaModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={saveAula} disabled={saving || !aulaTitulo.trim() || !aulaVideoUrl.trim()}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
