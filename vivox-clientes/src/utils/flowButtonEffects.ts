import type { PointerEvent } from 'react';

export function updateFlowButton(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse' || event.currentTarget.matches(':disabled') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const button = event.currentTarget;
  const bounds = button.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  button.style.setProperty('--flow-light-x', `${x}px`);
  button.style.setProperty('--flow-light-y', `${y}px`);
  button.style.setProperty('--flow-nudge-x', `${(x / bounds.width - .5) * 6}px`);
  button.style.setProperty('--flow-nudge-y', `${(y / bounds.height - .5) * 6}px`);
}

export function resetFlowButton(event: { currentTarget: HTMLElement }) {
  event.currentTarget.style.setProperty('--flow-nudge-x', '0px');
  event.currentTarget.style.setProperty('--flow-nudge-y', '0px');
}