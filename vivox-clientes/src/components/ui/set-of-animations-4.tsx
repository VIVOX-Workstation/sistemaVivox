import React, { useRef, useEffect } from 'react';

// --- TYPE DEFINITIONS & CONSTANTS ---
type AnimationSetupFunction = (ctx: CanvasRenderingContext2D) => () => void;
const CANVAS_WIDTH = 180;
const CANVAS_HEIGHT = 180;
const GLOBAL_SPEED = 0.5;
const MONOCHROME_FILL = (opacity: number) => `rgba(199, 161, 95, ${Math.max(0, Math.min(1, opacity))})`; // Usando vivox-brand
const MONOCHROME_STROKE = (opacity: number) => `rgba(199, 161, 95, ${Math.max(0, Math.min(1, opacity))})`;
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// --- CORNER DECORATION SUB-COMPONENT ---
const Corner = ({ position, rotation, delay }: { position: string; rotation: string; delay: string }) => (
  <div
    className={`absolute z-10 h-4 w-4 text-[var(--vivox-brand)] opacity-50 transition-opacity duration-300 group-hover:opacity-100 ${position}`}
    style={{ transform: rotation, transitionDelay: delay }}
  >
    <svg viewBox="0 0 512 512" className="h-full w-full">
      <path
        fill="currentColor"
        d="M448,224 288,224 288,64 224,64 224,224 64,224 64,288 224,288 224,448 288,448 288,288 448,288"
      />
    </svg>
  </div>
);

// --- MAIN REUSABLE COMPONENT ---
interface CanvasAnimationProps {
  title?: string;
  animationId: string;
  className?: string;
}

export const CanvasAnimation: React.FC<CanvasAnimationProps> = ({ title, animationId, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // @ts-ignore
    const setupFunction = animationMap[animationId];
    if (!setupFunction) return;

    const cleanup = setupFunction(ctx);
    return cleanup;
  }, [animationId]);

  return (
    <div className={`group relative flex flex-col items-center overflow-visible p-2 transition-colors duration-300 ${className}`}>
      <Corner position="top-[-4px] left-[-4px]" rotation="rotate(0deg)" delay="0s" />
      <Corner position="top-[-4px] right-[-4px]" rotation="rotate(90deg)" delay="0.1s" />
      <Corner position="bottom-[-4px] left-[-4px]" rotation="rotate(-90deg)" delay="0.2s" />
      <Corner position="bottom-[-4px] right-[-4px]" rotation="rotate(180deg)" delay="0.3s" />
      {title && <div className="mb-[10px] text-center text-xs font-bold uppercase tracking-[0.5px] text-[var(--vivox-brand)]">{title}</div>}
      <div className="relative flex items-center justify-center w-full h-full">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-contain" />
      </div>
    </div>
  );
};

// --- ANIMATION LOGIC IMPLEMENTATIONS ---

const setup3DSphereScan: AnimationSetupFunction = (ctx) => {
  let frameId: number;
  let time = 0;
  let lastTime = 0;
  const centerX = CANVAS_WIDTH / 2, centerY = CANVAS_HEIGHT / 2, radius = CANVAS_WIDTH * 0.4, numDots = 250;
  const dots = Array.from({ length: numDots }, (_, i) => {
    const theta = Math.acos(1 - 2 * (i / numDots));
    const phi = Math.sqrt(numDots * Math.PI) * theta;
    return { x: radius * Math.sin(theta) * Math.cos(phi), y: radius * Math.sin(theta) * Math.sin(phi), z: radius * Math.cos(theta) };
  });

  const animate = (timestamp: number) => {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    time += deltaTime * 0.0005 * GLOBAL_SPEED;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const rotX = Math.sin(time * 0.3) * 0.5, rotY = time * 0.5;
    const easedTime = easeInOutCubic((Math.sin(time * 2.5) + 1) / 2);
    const scanLine = (easedTime * 2 - 1) * radius, scanWidth = 25;
    dots.forEach(dot => {
      let { x, y, z } = dot;
      let nX = x * Math.cos(rotY) - z * Math.sin(rotY), nZ = x * Math.sin(rotY) + z * Math.cos(rotY);
      x = nX; z = nZ;
      let nY = y * Math.cos(rotX) - z * Math.sin(rotX); nZ = y * Math.sin(rotX) + z * Math.cos(rotX);
      y = nY; z = nZ;
      const scale = (z + radius * 1.5) / (radius * 2.5);
      const pX = centerX + x, pY = centerY + y;
      const distToScan = Math.abs(y - scanLine);
      const scanInfluence = distToScan < scanWidth ? Math.cos((distToScan / scanWidth) * (Math.PI / 2)) : 0;
      const size = Math.max(0, scale * 2.0 + scanInfluence * 2.5);
      const opacity = Math.max(0, scale * 0.6 + scanInfluence * 0.4);
      ctx.beginPath();
      ctx.arc(pX, pY, size, 0, Math.PI * 2);
      ctx.fillStyle = MONOCHROME_FILL(opacity);
      ctx.fill();
    });
    frameId = requestAnimationFrame(animate);
  };
  frameId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frameId);
};

// Idle Version (Só girando, sem o scanner)
const setup3DSphereIdle: AnimationSetupFunction = (ctx) => {
  let frameId: number;
  let time = 0;
  let lastTime = 0;
  const centerX = CANVAS_WIDTH / 2, centerY = CANVAS_HEIGHT / 2, radius = CANVAS_WIDTH * 0.4, numDots = 250;
  const dots = Array.from({ length: numDots }, (_, i) => {
    const theta = Math.acos(1 - 2 * (i / numDots));
    const phi = Math.sqrt(numDots * Math.PI) * theta;
    return { x: radius * Math.sin(theta) * Math.cos(phi), y: radius * Math.sin(theta) * Math.sin(phi), z: radius * Math.cos(theta) };
  });

  const animate = (timestamp: number) => {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    time += deltaTime * 0.0005 * GLOBAL_SPEED;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const rotX = Math.sin(time * 0.3) * 0.5, rotY = time * 0.5;
    dots.forEach(dot => {
      let { x, y, z } = dot;
      let nX = x * Math.cos(rotY) - z * Math.sin(rotY), nZ = x * Math.sin(rotY) + z * Math.cos(rotY);
      x = nX; z = nZ;
      let nY = y * Math.cos(rotX) - z * Math.sin(rotX); nZ = y * Math.sin(rotX) + z * Math.cos(rotX);
      y = nY; z = nZ;
      const scale = (z + radius * 1.5) / (radius * 2.5);
      const pX = centerX + x, pY = centerY + y;
      
      const size = Math.max(0, scale * 2.0);
      const opacity = Math.max(0, scale * 0.6);
      ctx.beginPath();
      ctx.arc(pX, pY, size, 0, Math.PI * 2);
      ctx.fillStyle = MONOCHROME_FILL(opacity);
      ctx.fill();
    });
    frameId = requestAnimationFrame(animate);
  };
  frameId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frameId);
};

// --- ANIMATION MAP ---
const animationMap = {
  'sphere-scan': setup3DSphereScan,
  'sphere-idle': setup3DSphereIdle,
};
