import { useId } from 'react';

/**
 * Logo "VIVOX" para fundo claro: o V da marca em dourado e as letras na cor do texto (currentColor).
 * A SistemaVivoxLogo foi desenhada para fundo preto; no menu branco o "SISTEMA" claro some.
 */
export function VivoxLogo({ className }: { className?: string }) {
  const p = 'vl' + useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 342 85" role="img" aria-label="VIVOX">
      <defs>
        <linearGradient id={`${p}g`} x1="24.4" y1="13.4" x2="75" y2="84.8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#CCB691" />
          <stop offset="1" stopColor="#876224" />
        </linearGradient>
      </defs>
      <path d="M11.0434 0H0L8.56097 22.7998L8.87321 21.6236C9.80997 18.0899 11.5378 14.8581 12.1415 11.2463C12.7504 7.58777 12.4381 3.75746 11.1475 0.291436L11.0382 0H11.0434Z" fill={`url(#${p}g)`} />
      <path d="M63.6009 0L37.3247 71.2928L17.252 16.8253L16.9449 16.0551L16.539 16.7941C12.667 23.7833 12.0686 32.1101 14.8945 39.6354C20.5098 54.582 26.12 69.5286 31.7301 84.4751H42.9192L74.6443 0H63.6009Z" fill={`url(#${p}g)`} />
      <path d="M151.84 72.401L125.57 0.208984H115.339L146.77 83.901L146.841 84.0888H156.482L188.101 0.208984H178.116L151.84 72.401Z" fill="currentColor" />
      <path d="M290.06 0L290.131 0.188477L310.702 34.042L331.273 0.188477L331.345 0H340.986L315.445 42.0498L341.025 84.0869H331.385L331.312 83.8994L310.741 50.0459L290.17 83.8994L290.099 84.0869H280.457L305.997 42.1143L280.418 0H290.06Z" fill="currentColor" />
      <path d="M99.8252 0.208984H90.6045V84.0888H99.8252V0.208984Z" fill="currentColor" />
      <path d="M275.669 41.7651C275.669 64.8313 256.97 83.5301 233.904 83.5301C210.838 83.5301 192.139 64.8313 192.139 41.7651C192.139 18.6989 210.838 0 233.904 0C256.97 0 275.669 18.6989 275.669 41.7651ZM201.08 41.7651C201.08 59.8932 215.776 74.5889 233.904 74.5889C252.032 74.5889 266.728 59.8932 266.728 41.7651C266.728 23.6369 252.032 8.94116 233.904 8.94116C215.776 8.94116 201.08 23.6369 201.08 41.7651Z" fill="currentColor" />
    </svg>
  );
}
