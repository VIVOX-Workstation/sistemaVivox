import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cursosApi } from '../api/cursos';
import type { Curso } from '../types';
import { ChevronLeft, Plus, Edit2, Trash2, GripVertical, Eye, EyeOff, ImageIcon } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { CapaPositionPicker } from '../components/CapaPositionPicker';

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

interface SortableCursoProps {
  curso: Curso;
  onEdit: (curso: Curso) => void;
  onDelete: (id: string) => void;
}

function SortableCurso({ curso, onEdit, onDelete }: SortableCursoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: curso.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 bg-white p-4 rounded-xl border ${
        isDragging ? 'border-[#C7A15F] shadow-lg opacity-80' : 'border-[#EBE3D5] shadow-sm'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-[#B9AEA0] hover:text-[#8F8271] p-2">
        <GripVertical className="w-5 h-5" />
      </div>
      
      {curso.capaUrl ? (
        <img 
          src={curso.capaUrl} 
          alt={curso.titulo} 
          className="w-16 h-12 object-cover rounded-md bg-[#FAF7F2]" 
          style={{ objectPosition: `${curso.capaPosX ?? 50}% ${curso.capaPosY ?? 50}%` }}
        />
      ) : (
        <div className="w-16 h-12 bg-[#FAF7F2] rounded-md border border-[#EBE3D5] flex items-center justify-center">
          <span className="text-xs font-bold text-[#8F8271]">Sem Capa</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-[#1E1A16] truncate">{curso.titulo}</h3>
        <div className="flex items-center gap-2 mt-1">
          {curso.publicado ? (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded">
              <Eye className="w-3 h-3" /> Publicado
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8F8271] bg-[#F6F0E7] px-2 py-0.5 rounded">
              <EyeOff className="w-3 h-3" /> Rascunho
            </span>
          )}
          <span className="text-xs text-[#8F8271]">
            {curso.modulos?.length || 0} módulos
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to={`/educacional/admin/${curso.id}`}
          className="p-2 text-[#8F8271] hover:text-[#C7A15F] hover:bg-[#F6F0E7] rounded-lg transition-colors"
          title="Editar Conteúdo (Módulos/Aulas)"
        >
          <span className="text-sm font-semibold">Conteúdo</span>
        </Link>
        <button
          onClick={() => onEdit(curso)}
          className="p-2 text-[#8F8271] hover:text-[#1E1A16] hover:bg-[#F6F0E7] rounded-lg transition-colors"
          title="Editar Curso"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(curso.id)}
          className="p-2 text-[#8F8271] hover:text-[#B83B32] hover:bg-[#FCE8E6] rounded-lg transition-colors"
          title="Excluir Curso"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function EducacionalAdmin() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [publicado, setPublicado] = useState(false);
  
  // Capa State
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string>('');
  const [capaPosX, setCapaPosX] = useState(50);
  const [capaPosY, setCapaPosY] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const data = await cursosApi.getCursos();
      setCursos(data);
    } catch (error) {
      console.error('Erro ao buscar cursos', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setCursos((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        cursosApi.reordenarCursos(newItems.map(i => i.id)).catch(err => {
          console.error('Erro ao reordenar cursos', err);
          fetchCursos();
        });
        
        return newItems;
      });
    }
  };

  const openModal = (curso?: Curso) => {
    setCapaFile(null);
    if (curso) {
      setEditingCurso(curso);
      setTitulo(curso.titulo);
      setDescricao(curso.descricao || '');
      setPublicado(curso.publicado);
      setCapaPreview(curso.capaUrl || '');
      setCapaPosX(curso.capaPosX ?? 50);
      setCapaPosY(curso.capaPosY ?? 50);
    } else {
      setEditingCurso(null);
      setTitulo('');
      setDescricao('');
      setPublicado(false);
      setCapaPreview('');
      setCapaPosX(50);
      setCapaPosY(50);
    }
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
      let targetCursoId = editingCurso?.id;
      
      const cursoDataToSend = { 
        titulo, 
        descricao, 
        publicado,
        capaPosX,
        capaPosY
      };

      if (!targetCursoId) {
        const novoCurso = await cursosApi.createCurso(cursoDataToSend);
        targetCursoId = novoCurso.id;
        
        if (capaFile) {
          await cursosApi.uploadCursoCapa(targetCursoId, capaFile);
          if (capaPosX !== 50 || capaPosY !== 50) {
            await cursosApi.updateCurso(targetCursoId, { capaPosX, capaPosY });
          }
        }
      } else {
        if (capaFile) {
          await cursosApi.uploadCursoCapa(targetCursoId, capaFile);
        }
        await cursosApi.updateCurso(targetCursoId, cursoDataToSend);
      }

      setIsModalOpen(false);
      fetchCursos();
    } catch (error) {
      console.error('Erro ao salvar curso', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCurso = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este curso? Todas as aulas serão perdidas.')) {
      try {
        await cursosApi.deleteCurso(id);
        fetchCursos();
      } catch (error) {
        console.error('Erro ao excluir curso', error);
      }
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/educacional')}
            className="p-2 hover:bg-[#F6F0E7] rounded-lg transition-colors text-[#8F8271]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight">Gerenciar Cursos</h1>
            <p className="text-sm text-[#8F8271]">Administração do Vivox Educacional</p>
          </div>
        </div>
        
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Curso
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#C7A15F] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-20 text-[#8F8271] bg-white rounded-2xl border border-[#EBE3D5]">
          <p>Nenhum curso cadastrado.</p>
        </div>
      ) : (
        <div className="bg-[#FAF7F2] rounded-xl">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cursos.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {cursos.map(curso => (
                  <SortableCurso 
                    key={curso.id} 
                    curso={curso} 
                    onEdit={openModal} 
                    onDelete={deleteCurso} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !saving && setIsModalOpen(false)}
        title={editingCurso ? 'Editar Curso' : 'Novo Curso'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EBE3D5] flex flex-col items-center gap-4">
            <div className="w-full flex justify-between items-center">
              <label className="block text-sm font-semibold text-[#1E1A16]">Capa do Curso</label>
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
            <label className="block text-sm font-semibold text-[#1E1A16] mb-1">Título do Curso *</label>
            <Input 
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Formação em Gestão de Redes Sociais"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E1A16] mb-1">Descrição</label>
            <Textarea 
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descreva o objetivo do curso..."
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox"
              id="publicado"
              checked={publicado}
              onChange={e => setPublicado(e.target.checked)}
              className="w-4 h-4 text-[#C7A15F] rounded border-[#EBE3D5] focus:ring-[#C7A15F]"
              disabled={saving}
            />
            <label htmlFor="publicado" className="text-sm font-medium text-[#1E1A16] cursor-pointer">
              Curso publicado (visível para colaboradores)
            </label>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#EBE3D5]">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={saveCurso} disabled={saving || !titulo.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
