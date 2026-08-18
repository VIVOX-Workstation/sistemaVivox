import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  FLOW_D,
  FLOW_LETTERS,
  IVOX_LETTERS,
  VIEWBOX_H,
  VIEWBOX_W,
  V_D,
  V_INNER_STROKE_D,
} from './vivox-logo-paths';

interface VivoxIntroProps {
  /** Chamado quando a animação (ou o skip) termina. */
  onComplete?: () => void;
}

/** Atrasos da animação, em segundos. */
const V_IN_DELAY = 0.15; // V surge no centro da tela
const V_MOVE_DELAY = 1.15; // V desliza para a esquerda
const IVOX_DELAYS = [2.0, 2.12, 2.24, 2.36]; // I, V, O, X
const FLOW_DELAYS = [3.05, 3.2, 3.35, 3.5]; // F, l, o, w
const FLOW_DRAW_DUR = 1; // duração do traço de cada letra
const FLOW_ART_DELAY = FLOW_DELAYS[3] + FLOW_DRAW_DUR - 0.15; // preenchimento entra ao fim do traço
const TOTAL_MS = 5400; // fim da animação -> início do fade de saída
const EXIT_MS = 500;

/** Deslocamento inicial do V (centro do viewBox menos o centro do glifo). Ajustado em runtime. */
const V_SHIFT_FALLBACK = 837.9;

/**
 * Tela de abertura do Sistema VIVOX.
 * Sequência: o V dourado surge centralizado -> desliza para a esquerda ->
 * IVOX entra letra a letra -> "Flow" é desenhado traço a traço e depois preenchido.
 */
export default function VivoxIntro({ onComplete }: VivoxIntroProps) {
  const [exiting, setExiting] = useState(false);
  const doneRef = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const vRef = useRef<SVGPathElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Mede o glifo do V para centralizá-lo com precisão, mesmo se o logo mudar.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    const v = vRef.current;
    if (!svg || !v) return;
    const box = v.getBBox();
    const shift = VIEWBOX_W / 2 - (box.x + box.width / 2);
    svg.style.setProperty('--vx-shift', `${shift}px`);
  }, []);

  const finish = useCallback((exitMs: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setExiting(true);
    window.setTimeout(() => onCompleteRef.current?.(), exitMs);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hold = reduced ? 400 : TOTAL_MS;
    const timer = window.setTimeout(() => finish(EXIT_MS), hold);
    return () => window.clearTimeout(timer);
  }, [finish]);

  // Clique ou tecla pula a introdução.
  useEffect(() => {
    const skip = () => finish(220);
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [finish]);

  return (
    <section
      data-theme="dark"
      onClick={() => finish(220)}
      className={`fixed inset-0 z-50 grid place-items-center bg-[var(--vivox-background)] transition-opacity ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${EXIT_MS}ms` }}
    >
      <style>{`
        /* O V dourado: surge no centro da tela e depois desliza para o seu lugar */
        .vx-v1{
          opacity:0;
          transform-box:fill-box;
          transform-origin:50% 50%;
          transform:translateX(var(--vx-shift)) scale(.94);
          animation:vxVIn .8s cubic-bezier(.22,.61,.36,1) ${V_IN_DELAY}s forwards,
                    vxGlow 1.5s ease-out ${V_IN_DELAY}s,
                    vxVMove .8s cubic-bezier(.62,0,.2,1) ${V_MOVE_DELAY}s forwards;
        }
        @keyframes vxVIn{
          from{opacity:0;transform:translateX(var(--vx-shift)) scale(.94)}
          to{opacity:1;transform:translateX(var(--vx-shift)) scale(1)}
        }
        @keyframes vxVMove{
          from{transform:translateX(var(--vx-shift)) scale(1)}
          to{transform:translateX(0) scale(1)}
        }
        @keyframes vxGlow{
          0%{filter:drop-shadow(0 0 0 rgba(242,211,159,0))}
          35%{filter:drop-shadow(0 0 30px rgba(242,211,159,.55))}
          100%{filter:drop-shadow(0 0 0 rgba(242,211,159,0))}
        }

        /* Letras de IVOX: sobem e aparecem */
        .vx-letter{
          opacity:0;
          transform-box:fill-box;
          transform-origin:50% 90%;
          transform:translateY(18px) scale(.96);
          animation:vxRise .55s cubic-bezier(.22,.61,.36,1) forwards;
        }
        @keyframes vxRise{to{opacity:1;transform:translateY(0) scale(1)}}

        /* Flow: primeiro o contorno é desenhado letra a letra... */
        .vx-flow-trace{
          fill:none;
          stroke:#F2D39F;
          stroke-width:1.5;
          vector-effect:non-scaling-stroke;
          stroke-dasharray:1;
          stroke-dashoffset:1;
          animation:vxDraw ${FLOW_DRAW_DUR}s cubic-bezier(.45,0,.25,1) forwards,
                    vxTraceOut .5s ease-out forwards;
        }
        @keyframes vxDraw{to{stroke-dashoffset:0}}
        @keyframes vxTraceOut{to{stroke-opacity:0}}

        /* ...e depois a arte preenchida aparece por cima */
        .vx-flow-art{
          opacity:0;
          animation:vxArtIn .6s ease-out ${FLOW_ART_DELAY}s forwards;
        }
        @keyframes vxArtIn{to{opacity:1}}
      `}</style>

      {/* Vinheta sutil */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_55%_at_50%_50%,rgba(242,211,159,0.07),transparent_65%)]" />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="VIVOX Flow"
        className="w-[min(43vw,440px)] overflow-visible"
        style={{ ['--vx-shift' as string]: `${V_SHIFT_FALLBACK}px` }}
      >
        <defs>
          <linearGradient
            id="vxIvoxGrad"
            x1="972.329"
            y1="-116.801"
            x2="911.607"
            y2="218"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFF9ED" stopOpacity="0.38" />
            <stop offset="1" stopColor="white" />
          </linearGradient>

          <linearGradient
            id="vxVGrad"
            x1="487.767"
            y1="-32.2078"
            x2="449.455"
            y2="264.313"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFEBC8" />
            <stop offset="1" stopColor="#AF8948" />
          </linearGradient>

          <radialGradient
            id="vxVGlow"
            cx="0"
            cy="0"
            r="1"
            gradientTransform="matrix(49.6708 64.9399 -268.539 251.89 222.272 1.81832)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopOpacity="0" />
          </radialGradient>

          <linearGradient
            id="vxFlowGrad"
            x1="2783.92"
            y1="-34.1331"
            x2="2772.08"
            y2="269.398"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFEBC8" />
            <stop offset="1" stopColor="#AF8948" />
          </linearGradient>

          <radialGradient
            id="vxFlowGlow"
            cx="0"
            cy="0"
            r="1"
            gradientTransform="matrix(165.88 65.4832 -896.813 253.998 1897.28 0.177696)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopOpacity="0" />
          </radialGradient>

          {/* Máscara que recorta o contorno interno do V */}
          <mask id="vxVInnerMask" fill="white">
            <path d={V_D} />
          </mask>
        </defs>

        {/* ---- IVOX ---- */}
        {IVOX_LETTERS.map((d, i) => (
          <path
            key={i}
            className="vx-letter"
            style={{ animationDelay: `${IVOX_DELAYS[i]}s` }}
            d={d}
            fill="url(#vxIvoxGrad)"
            stroke="white"
          />
        ))}

        {/* ---- V dourado: abre a sequência no centro da tela ---- */}
        <g className="vx-v1">
          <path ref={vRef} d={V_D} fill="url(#vxVGrad)" />
          <path d={V_D} fill="url(#vxVGlow)" style={{ mixBlendMode: 'color-dodge' }} />
          <path d={V_INNER_STROKE_D} fill="#CBA769" mask="url(#vxVInnerMask)" />
        </g>

        {/* ---- Flow: contorno traçado letra a letra ---- */}
        {FLOW_LETTERS.map((d, i) => (
          <path
            key={i}
            className="vx-flow-trace"
            pathLength={1}
            style={{ animationDelay: `${FLOW_DELAYS[i]}s, ${FLOW_ART_DELAY}s` }}
            d={d}
          />
        ))}

        {/* ---- Flow: arte preenchida ---- */}
        <g className="vx-flow-art">
          <path d={FLOW_D} fill="#F2D39F" />
          <path d={FLOW_D} fill="url(#vxFlowGrad)" />
          <path d={FLOW_D} fill="url(#vxFlowGlow)" style={{ mixBlendMode: 'color-dodge' }} />
          <path d={FLOW_D} stroke="#CBA769" fill="none" />
        </g>
      </svg>
    </section>
  );
}
