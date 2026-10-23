import { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// pdf.js no lugar de <iframe>: o Android não mostra PDF em iframe e o iOS só a 1ª página.
GlobalWorkerOptions.workerSrc = worker;

/**
 * Páginas do PDF em canvas, na largura do contêiner. Cada página só é desenhada quando
 * chega perto da tela, então propostas longas não travam o celular.
 */
export function PdfPaginas({ fonte, maxPaginas, className, onCarregado, onErro, onPagina }: {
  fonte: string;
  maxPaginas?: number;
  className?: string;
  onCarregado?: (paginas: number) => void;
  onErro?: () => void;
  onPagina?: (pagina: number) => void;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [proporcoes, setProporcoes] = useState<number[]>([]);
  const avisos = useRef({ onCarregado, onErro });
  useEffect(() => { avisos.current = { onCarregado, onErro }; });

  useEffect(() => {
    let cancelado = false;
    const tarefa = getDocument({ url: fonte, isEvalSupported: false });
    tarefa.promise.then(async documento => {
      const total = Math.min(documento.numPages, maxPaginas ?? documento.numPages);
      // Altura de cada página antes de desenhar: o leitor não pula enquanto carrega.
      const lidas = await Promise.all(Array.from({ length: total }, async (_, i) => {
        const vista = (await documento.getPage(i + 1)).getViewport({ scale: 1 });
        return vista.height / vista.width;
      }));
      if (cancelado) return;
      setProporcoes(lidas); setPdf(documento);
      avisos.current.onCarregado?.(documento.numPages);
    }).catch(() => { if (!cancelado) avisos.current.onErro?.(); });
    return () => { cancelado = true; void tarefa.destroy(); };
  }, [fonte, maxPaginas]);

  return (
    <div className={className}>
      {pdf && proporcoes.map((proporcao, i) => (
        <PaginaPdf key={i} pdf={pdf} numero={i + 1} proporcao={proporcao} onVisivel={onPagina} />
      ))}
    </div>
  );
}

function PaginaPdf({ pdf, numero, proporcao, onVisivel }: {
  pdf: PDFDocumentProxy;
  numero: number;
  proporcao: number;
  onVisivel?: (pagina: number) => void;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [perto, setPerto] = useState(false);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const perto = new IntersectionObserver(([e]) => { if (e.isIntersecting) setPerto(true); }, { rootMargin: '800px 0px' });
    // Página que ocupa o meio da tela vira a "atual" do contador.
    const meio = new IntersectionObserver(([e]) => { if (e.isIntersecting) onVisivel?.(numero); }, { rootMargin: '-50% 0px -50% 0px' });
    const tamanho = new ResizeObserver(([e]) => setLargura(Math.round(e.contentRect.width)));
    perto.observe(el); meio.observe(el); tamanho.observe(el);
    return () => { perto.disconnect(); meio.disconnect(); tamanho.disconnect(); };
  }, [numero, onVisivel]);

  useEffect(() => {
    if (!perto || !largura || !canvas.current) return;
    let tarefa: { cancel: () => void; promise: Promise<void> } | null = null;
    let cancelado = false;
    void pdf.getPage(numero).then(pagina => {
      if (cancelado || !canvas.current) return;
      const base = pagina.getViewport({ scale: 1 });
      const densidade = Math.min(window.devicePixelRatio || 1, 2);
      const vista = pagina.getViewport({ scale: (largura / base.width) * densidade });
      const el = canvas.current;
      el.width = Math.floor(vista.width); el.height = Math.floor(vista.height);
      const ctx = el.getContext('2d');
      if (!ctx) return;
      tarefa = pagina.render({ canvasContext: ctx, viewport: vista });
      tarefa.promise.catch(() => { /* cancelada ao redimensionar */ });
    });
    return () => { cancelado = true; tarefa?.cancel(); };
  }, [pdf, numero, perto, largura]);

  return (
    <div ref={caixa} className="ppdf-pagina" style={{ aspectRatio: `1 / ${proporcao}` }} data-pagina={numero}>
      <canvas ref={canvas} aria-label={`Página ${numero}`} role="img" />
    </div>
  );
}
