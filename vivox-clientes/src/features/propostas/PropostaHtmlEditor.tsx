import { useEffect, useRef, useState } from 'react';
import { conteudoSecao, paginaHtml } from './documentoHtml';
import type { SecaoProposta } from './types';
import { corDaProposta } from './modeloLegado';

export function PropostaHtmlEditor({ secao, cor, disabled, onChange }: { secao: SecaoProposta; cor: string; disabled: boolean; onChange: (html: string) => void }) {
  cor = corDaProposta(cor);
  const frame = useRef<HTMLIFrameElement>(null);
  const ultimoEmitido = useRef(secao.html);
  const callback = useRef(onChange);
  callback.current = onChange;
  const [fonte, setFonte] = useState(() => paginaHtml(`<section id="editor" class="section">${conteudoSecao(secao, true)}</section>`, cor, 'body{background:white}.section{padding:24px}#editor:focus{outline:2px solid var(--primary);outline-offset:-2px}'));
  useEffect(() => {
    if (secao.html === ultimoEmitido.current) return;
    ultimoEmitido.current = secao.html;
    setFonte(paginaHtml(`<section id="editor" class="section">${conteudoSecao(secao, true)}</section>`, cor, 'body{background:white}.section{padding:24px}'));
  }, [secao, cor]);
  useEffect(() => {
    const iframe = frame.current;
    let remover: (() => void) | undefined;
    const preparar = () => {
      remover?.();
      const editor = iframe?.contentDocument?.getElementById('editor');
      if (!editor) return;
      editor.contentEditable = String(!disabled);
      editor.setAttribute('role', 'textbox');
      editor.setAttribute('aria-label', `Conteúdo: ${secao.titulo}`);
      editor.setAttribute('aria-multiline', 'true');
      editor.ownerDocument.documentElement.style.setProperty('--primary', cor);
      const titulo = editor.querySelector('h2');
      if (titulo) titulo.textContent = secao.titulo;
      const input = () => { ultimoEmitido.current = editor.innerHTML; callback.current(editor.innerHTML); };
      editor.addEventListener('input', input);
      const paste = (event: ClipboardEvent) => {
        event.preventDefault();
        const selection = iframe?.contentWindow?.getSelection();
        if (!selection?.rangeCount) return;
        const range = selection.getRangeAt(0); range.deleteContents();
        const texto = editor.ownerDocument.createTextNode(event.clipboardData?.getData('text/plain') || '');
        range.insertNode(texto); range.setStartAfter(texto); range.collapse(true);
        selection.removeAllRanges(); selection.addRange(range); input();
      };
      editor.addEventListener('paste', paste);
      remover = () => { editor.removeEventListener('input', input); editor.removeEventListener('paste', paste); };
    };
    iframe?.addEventListener('load', preparar); preparar();
    return () => { iframe?.removeEventListener('load', preparar); remover?.(); };
  }, [fonte, disabled, secao.titulo, cor]);
  useEffect(() => {
    const titulo = frame.current?.contentDocument?.querySelector('h2');
    if (titulo) titulo.textContent = secao.titulo;
  }, [secao.titulo]);
  return <iframe ref={frame} className="proposta-html-editor" title={`Editar seção: ${secao.titulo}`}
    sandbox="allow-same-origin" referrerPolicy="no-referrer" srcDoc={fonte} />;
}
