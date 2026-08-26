import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { educacionalApi } from '../api/cursos';
import type { Curso } from '../types';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Settings, PlayCircle } from 'lucide-react';

export function EducacionalHome() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const data = await educacionalApi.getCursosPublicados();
      setCursos(data);
    } catch (error) {
      console.error('Erro ao buscar cursos', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#24201A] flex items-center justify-center border border-[#4A4032] shadow-sm">
            <GraduationCap className="w-5 h-5 text-[#C7A15F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E1A16] tracking-tight">Vivox Educacional</h1>
            <p className="text-sm text-[#8F8271]">Cursos e trilhas de aprendizado</p>
          </div>
        </div>

        {user?.role === 'ADMIN' && (
          <Link
            to="/educacional/admin"
            className="flex items-center gap-2 px-4 py-2 bg-[#24201A] text-[#F6F0E7] rounded-lg text-sm font-semibold hover:bg-[#2C271F] transition-colors border border-[#4A4032]"
          >
            <Settings className="w-4 h-4 text-[#C7A15F]" />
            Gerenciar Cursos
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#C7A15F] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : cursos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#8F8271]">
          <GraduationCap className="w-16 h-16 mb-4 text-[#D3C7B6]" />
          <p className="text-lg font-semibold text-[#6B6154]">Nenhum curso disponível no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((curso) => {
            const totalAulas = curso.modulos?.reduce((acc, mod) => acc + (mod.aulas?.length || 0), 0) || 0;
            
            return (
              <Link
                key={curso.id}
                to={`/educacional/curso/${curso.id}`}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border border-[#EBE3D5] flex flex-col group cursor-pointer"
              >
                <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 bg-[#FAF7F2] flex items-center justify-center border border-[#EBE3D5]">
                  {curso.capaUrl ? (
                    <img
                      src={curso.capaUrl}
                      alt={curso.titulo}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      style={{ objectPosition: `${curso.capaPosX ?? 50}% ${curso.capaPosY ?? 50}%` }}
                    />
                  ) : (
                    <GraduationCap className="w-12 h-12 text-[#D3C7B6]" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-[#1E1A16] mb-1 line-clamp-2">
                    {curso.titulo}
                  </h3>
                  {curso.descricao && (
                    <p className="text-sm text-[#8F8271] line-clamp-2 mb-4">
                      {curso.descricao}
                    </p>
                  )}
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="text-[#6B6154] bg-[#F6F0E7] px-2 py-1 rounded-md">
                        {totalAulas} {totalAulas === 1 ? 'aula' : 'aulas'}
                      </span>
                      <span className="text-[#C7A15F]">
                        {curso.progressoPercentual || 0}% Concluído
                      </span>
                    </div>
                    
                    <div className="w-full bg-[#F6F0E7] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#C7A15F] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${curso.progressoPercentual || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
