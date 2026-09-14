import compression from 'compression';

export function workspaceCompression() {
  return compression({ threshold: 1024, level: 4 });
}
