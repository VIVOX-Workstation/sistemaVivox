import React, { useState, useRef, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';

interface CapaPositionPickerProps {
  imageUrl: string;
  posX: number;
  posY: number;
  onChange: (x: number, y: number) => void;
}

export function CapaPositionPicker({ imageUrl, posX, posY, onChange }: CapaPositionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startObjectPos, setStartObjectPos] = useState({ x: posX, y: posY });

  useEffect(() => {
    if (!isDragging) {
      setStartObjectPos({ x: posX, y: posY });
    }
  }, [posX, posY, isDragging]);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
    setStartObjectPos({ x: posX, y: posY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current || !imgRef.current) return;

    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;

    const containerRect = containerRef.current.getBoundingClientRect();
    const naturalWidth = imgRef.current.naturalWidth;
    const naturalHeight = imgRef.current.naturalHeight;
    if (!naturalWidth || !naturalHeight) return;

    // object-cover deixa a <img> do mesmo tamanho do container (getBoundingClientRect
    // nao reflete o crop interno), entao calculamos o tamanho "renderizado" manualmente
    // a partir da proporcao natural da imagem para achar o quanto ela excede o container.
    const containerAspect = containerRect.width / containerRect.height;
    const imageAspect = naturalWidth / naturalHeight;

    let renderedWidth: number;
    let renderedHeight: number;
    if (imageAspect > containerAspect) {
      renderedHeight = containerRect.height;
      renderedWidth = containerRect.height * imageAspect;
    } else {
      renderedWidth = containerRect.width;
      renderedHeight = containerRect.width / imageAspect;
    }

    // Calcula a porcentagem movida em relacao ao tamanho excedente da imagem
    const maxDeltaX = renderedWidth - containerRect.width;
    const maxDeltaY = renderedHeight - containerRect.height;

    let newPosX = startObjectPos.x;
    let newPosY = startObjectPos.y;

    if (maxDeltaX > 0) {
      const percentX = (deltaX / maxDeltaX) * 100;
      newPosX = Math.max(0, Math.min(100, startObjectPos.x - percentX));
    }

    if (maxDeltaY > 0) {
      const percentY = (deltaY / maxDeltaY) * 100;
      newPosY = Math.max(0, Math.min(100, startObjectPos.y - percentY));
    }

    onChange(Math.round(newPosX), Math.round(newPosY));
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Event Listeners Globais para suave drag fora do elemento
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleMove(e.clientX, e.clientY);
      }
    };
    const onMouseUp = () => handleEnd();

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove, { passive: false });
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, startPos, startObjectPos]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        className={`relative w-48 h-48 overflow-hidden rounded-xl border-2 select-none touch-none ${
          isDragging ? 'border-[#C7A15F] cursor-grabbing' : 'border-[#EBE3D5] cursor-grab'
        }`}
        onMouseDown={(e: ReactMouseEvent) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e: ReactTouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Preview Capa"
          draggable={false}
          className="w-full h-full object-cover pointer-events-none select-none"
          style={{ objectPosition: `${posX}% ${posY}%` }}
        />
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      </div>
      <p className="text-xs text-[#8F8271] text-center max-w-[200px]">
        Arraste a imagem para ajustar o foco da capa.
      </p>
    </div>
  );
}
