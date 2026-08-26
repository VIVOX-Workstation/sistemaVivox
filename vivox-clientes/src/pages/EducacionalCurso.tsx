import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { educacionalApi } from '../api/cursos';
import type { Curso, Modulo, Aula } from '../types';
import { toEmbedUrl } from '../utils/videoEmbed';
import { ChevronLeft, CheckCircle2, Circle, PlayCircle, ChevronDown, ChevronRight } from 'lucide-react';

export function EducacionalCurso() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModulos, setExpandedModulos] = useState<Record<string, boolean>>({});
  
  const aulaParam = searchParams.get('aula');
  const [aulaAtual, setAulaAtual] = useState<Aula | null>(null);

  useEffect(() => {
    if (id) {
      fetchCurso(id);
    }
  }, [id]);

  useEffect(() => {
    if (curso && curso.modulos?.length > 0) {
      let foundAula = null;
      let parentModulo = null;

      if (aulaParam) {
        for (const mod of curso.modulos) {
          const a = mod.aulas?.find(a => a.id === aulaParam);
          if (a) {
            foundAula = a;
            parentModulo = mod;
            break;
          }
        }
      }

      if (!foundAula) {
        // Fallback para a primeira aula do primeiro módulo
        foundAula = curso.modulos[0]?.aulas?.[0] || null;
        parentModulo = curso.modulos[0];
      }

      setAulaAtual(foundAula);
      
      if (parentModulo && !expandedModulos[parentModulo.id]) {
        setExpandedModulos(prev => ({ ...prev, [parentModulo.id]: true }));
      }
    }
  }, [curso, aulaParam]);

  const fetchCurso = async (cursoId: string) => {
    try {
      setLoading(true);
      const data = await educacionalApi.getCursoById(cursoId);
      setCurso(data);
      
      // Expande o primeiro módulo por padrão se não tiver aula selecionada
      if (data.modulos?.length > 0 && !aulaParam) {
        setExpandedModulos({ [data.modulos[0].id]: true });
      }
    } catch (error) {
      console.error('Erro ao buscar curso', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModulo = (moduloId: string) => {
    setExpandedModulos(prev => ({
      ...prev,
      [moduloId]: !prev[moduloId]
    }));
  };

  const handleSelectAula = (aula: Aula) => {
    setSearchParams({ aula: aula.id });
  };

  const handleConcluirAula = async () => {
    if (!aulaAtual || !id) return;
    
    try {
      if (aulaAtual.progresso?.concluidoEm) {
        await educacionalApi.desmarcarAula(aulaAtual.id);
      } else {
        await educacionalApi.concluirAula(aulaAtual.id);
      }
      
      // Atualiza estado local para refletir imediatamente
      setAulaAtual(prev => prev ? {
        ...prev,
        progresso: prev.progresso?.concluidoEm 
          ? { ...prev.progresso, concluidoEm: null } 
          : { id: '', aulaId: prev.id, usuarioId: '', concluidoEm: new Date().toISOString(), createdAt: '', updatedAt: '' }
      } : null);

      // Rebusca o curso para atualizar progresso total e arvore
      fetchCurso(id);
    } catch (error) {
      console.error('Erro ao concluir aula', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 h-full items-center">
        <div className="w-8 h-8 border-4 border-[#C7A15F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg text-[#8F8271]">Curso não encontrado.</p>
        <button onClick={() => navigate('/educacional')} className="mt-4 text-[#C7A15F] underline">Voltar</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] -m-8">
      {/* Header */}
      <div className="h-16 px-6 border-b border-[#EBE3D5] bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/educacional')}
            className="p-2 hover:bg-[#F6F0E7] rounded-lg transition-colors text-[#8F8271]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#1E1A16] line-clamp-1">{curso.titulo}</h1>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-[#EBE3D5] rounded-full h-1.5">
                <div 
                  className="bg-[#C7A15F] h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${curso.progressoPercentual || 0}%` }}
                ></div>
              </div>
              <span className="text-xs text-[#8F8271] font-medium">{curso.progressoPercentual || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Player */}
        <div className="flex-1 overflow-y-auto bg-[#FAF7F2] p-6 lg:p-8">
          {aulaAtual ? (
            <div className="max-w-5xl mx-auto">
              <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6 shadow-lg">
                <iframe
                  src={toEmbedUrl(aulaAtual.videoUrl)}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-white p-6 rounded-xl border border-[#EBE3D5] shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-[#1E1A16] mb-2">{aulaAtual.titulo}</h2>
                  {aulaAtual.descricao && (
                    <p className="text-[#6B6154] whitespace-pre-wrap">{aulaAtual.descricao}</p>
                  )}
                </div>
                
                <button
                  onClick={handleConcluirAula}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors shrink-0 ${
                    aulaAtual.progresso?.concluidoEm
                      ? 'bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]'
                      : 'bg-[#24201A] text-[#F6F0E7] hover:bg-[#2C271F] border border-[#4A4032]'
                  }`}
                >
                  {aulaAtual.progresso?.concluidoEm ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Concluída
                    </>
                  ) : (
                    <>
                      <Circle className="w-5 h-5" />
                      Marcar como concluída
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#8F8271]">
              Selecione uma aula no menu lateral
            </div>
          )}
        </div>

        {/* Sidebar - Módulos */}
        <div className="w-80 bg-white border-l border-[#EBE3D5] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#EBE3D5] bg-[#FAF7F2]">
            <h3 className="font-bold text-[#1E1A16]">Conteúdo do Curso</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {curso.modulos?.map((modulo, index) => {
              const isExpanded = expandedModulos[modulo.id];
              const aulasConcluidas = modulo.aulas?.filter(a => a.progresso?.concluidoEm).length || 0;
              const totalAulasModulo = modulo.aulas?.length || 0;

              return (
                <div key={modulo.id} className="border-b border-[#EBE3D5]">
                  <button
                    onClick={() => toggleModulo(modulo.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-[#FAF7F2] transition-colors"
                  >
                    <div className="text-left pr-4">
                      <div className="text-xs font-semibold text-[#8F8271] mb-1">MÓDULO {index + 1}</div>
                      <div className="font-bold text-[#1E1A16] line-clamp-2">{modulo.titulo}</div>
                      <div className="text-xs text-[#6B6154] mt-1">
                        {aulasConcluidas}/{totalAulasModulo} aulas
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[#8F8271] shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[#8F8271] shrink-0" />
                    )}
                  </button>

                  {isExpanded && modulo.aulas && (
                    <div className="bg-[#FAF7F2] py-2">
                      {modulo.aulas.map((aula, aulaIndex) => {
                        const isAtiva = aulaAtual?.id === aula.id;
                        const isConcluida = !!aula.progresso?.concluidoEm;

                        return (
                          <button
                            key={aula.id}
                            onClick={() => handleSelectAula(aula)}
                            className={`w-full flex items-start gap-3 p-3 pl-4 transition-colors ${
                              isAtiva ? 'bg-[#EBE3D5]' : 'hover:bg-[#F6F0E7]'
                            }`}
                          >
                            <div className="mt-1 shrink-0">
                              {isConcluida ? (
                                <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                              ) : isAtiva ? (
                                <PlayCircle className="w-4 h-4 text-[#C7A15F]" />
                              ) : (
                                <Circle className="w-4 h-4 text-[#B9AEA0]" />
                              )}
                            </div>
                            
                            {/* Capa Thumbnail */}
                            {aula.capaUrl ? (
                              <img 
                                src={aula.capaUrl} 
                                alt={aula.titulo}
                                className="w-12 h-8 rounded shrink-0 object-cover bg-[#EBE3D5]"
                                style={{ objectPosition: `${aula.capaPosX ?? 50}% ${aula.capaPosY ?? 50}%` }}
                              />
                            ) : (
                              <div className="w-12 h-8 rounded bg-[#EBE3D5] shrink-0 flex items-center justify-center">
                                <PlayCircle className="w-4 h-4 text-[#B9AEA0]" />
                              </div>
                            )}

                            <div className="text-left flex-1 min-w-0">
                              <div className={`text-xs truncate ${isAtiva ? 'font-bold text-[#1E1A16]' : 'font-medium text-[#4A4032]'}`}>
                                {aulaIndex + 1}. {aula.titulo}
                              </div>
                              {aula.duracaoSeg ? (
                                <div className="text-[10px] font-semibold text-[#8F8271] mt-0.5">
                                  {Math.floor(aula.duracaoSeg / 60)} min
                                </div>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
