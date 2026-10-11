/**
 * Adapted from Kokonut UI Background Paths by @dorianbaffier.
 * Source: https://github.com/kokonut-labs/kokonutui/blob/main/components/kokonutui/background-paths.tsx
 * Distributed under MIT; see FlowingPaths.LICENSE.txt.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';

interface Point {
  x: number;
  y: number;
}


// Path generation function
function generateAestheticPath(
  index: number,
  position: number,
  type: "primary" | "secondary" | "accent"
): string {
  const baseAmplitude =
    type === "primary" ? 150 : type === "secondary" ? 100 : 60;
  const phase = index * 0.2;
  const points: Point[] = [];
  const segments = type === "primary" ? 10 : type === "secondary" ? 8 : 6;

  const startX = 2400;
  const startY = 800;
  const endX = -2400;
  const endY = -800 + index * 25;

  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const eased = 1 - (1 - progress) ** 2;

    const baseX = startX + (endX - startX) * eased;
    const baseY = startY + (endY - startY) * eased;

    const amplitudeFactor = 1 - eased * 0.3;
    const wave1 =
      Math.sin(progress * Math.PI * 3 + phase) *
      (baseAmplitude * 0.7 * amplitudeFactor);
    const wave2 =
      Math.cos(progress * Math.PI * 4 + phase) *
      (baseAmplitude * 0.3 * amplitudeFactor);
    const wave3 =
      Math.sin(progress * Math.PI * 2 + phase) *
      (baseAmplitude * 0.2 * amplitudeFactor);

    points.push({
      x: baseX * position,
      y: baseY + wave1 + wave2 + wave3,
    });
  }

  const pathCommands = points.map((point: Point, i: number) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prevPoint = points[i - 1];
    const tension = 0.4;
    const cp1x = prevPoint.x + (point.x - prevPoint.x) * tension;
    const cp1y = prevPoint.y;
    const cp2x = prevPoint.x + (point.x - prevPoint.x) * (1 - tension);
    const cp2y = point.y;
    return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  });

  return pathCommands.join(" ");
}


const paths = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  d: generateAestheticPath(i, 1, 'primary'),
  opacity: 0.15 + i * 0.018,
  width: 1.4 + i * 0.12,
}));

export default function FlowingPaths() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  const active = inView && visible && !reducedMotion;
  return (
    <svg ref={ref} className="flow-art" viewBox="-2400 -800 4800 1600"
      preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="flow-ribbon-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#876224" />
          <stop offset="0.5" stopColor="#CCB691" />
          <stop offset="1" stopColor="#B89455" />
        </linearGradient>
      </defs>
      {paths.map((path) => active ? (
        <motion.path key={path.id} d={path.d}
          stroke="url(#flow-ribbon-gold)" strokeWidth={path.width}
          strokeLinecap="round" initial={false}
          animate={active ? { y: [0, -28, 0], pathOffset: [0, 1], opacity: [path.opacity, path.opacity + 0.12, path.opacity] } : { y: 0, pathOffset: 0, opacity: path.opacity }}
          style={{ pathLength: reducedMotion ? 1 : 0.62, pathSpacing: 0.38 }}
          transition={active ? {
            y: { duration: 10 + path.id * 0.15, repeat: Infinity, ease: 'easeInOut' },
            pathOffset: { duration: 16 + path.id * 0.3, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 10 + path.id * 0.15, repeat: Infinity, ease: 'easeInOut' },
          } : { duration: 0 }}
        />
      ) : (
        <path key={path.id} d={path.d} stroke="url(#flow-ribbon-gold)"
          strokeWidth={path.width} strokeLinecap="round" opacity={path.opacity} />
      ))}
    </svg>
  );
}
