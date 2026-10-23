import { useContext } from 'react';
import { DemoContext } from './contextDef';

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error('useDemo deve ser usado dentro de um DemoProvider');
  }
  return ctx;
}
