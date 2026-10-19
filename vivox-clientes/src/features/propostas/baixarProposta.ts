import type { DocumentoProposta } from './types';
import { htmlDoSlide, slidesDaProposta } from './documentoHtml';

// O download é gerado no navegador a partir do mesmo conteúdo do visualizador.
// Nenhum dado da proposta é enviado para serviços externos.
export async function baixarProposta(documento: DocumentoProposta, progresso: (pagina: number, total: number) => void) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const slides = slidesDaProposta(documento);
  let pdf: InstanceType<typeof jsPDF> | undefined;
  const iframe = document.createElement('iframe');
  iframe.title = 'Preparando download da proposta';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('sandbox', 'allow-same-origin');
  iframe.referrerPolicy = 'no-referrer';
  Object.assign(iframe.style, { position: 'fixed', left: '-12000px', top: '0', width: '1120px', height: '900px', border: '0', pointerEvents: 'none' });
  document.body.appendChild(iframe);
  try {
    for (let index = 0; index < slides.length; index++) {
      progresso(index + 1, slides.length);
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => { iframe.onload = null; reject(new Error('Tempo esgotado ao carregar a página do PDF.')); }, 30000);
        iframe.onload = () => { window.clearTimeout(timeout); resolve(); };
        iframe.srcdoc = htmlDoSlide(slides[index], documento.corDestaque,
          '.document{width:1120px;max-width:none}.section{padding:48px}');
      });
      const doc = iframe.contentDocument;
      const pagina = doc?.querySelector<HTMLElement>('.document');
      if (!doc || !pagina) throw new Error('Página indisponível para exportação.');
      await doc.fonts.ready;
      await Promise.all(Array.from(doc.images).map(img => img.decode()));
      const altura = Math.ceil(pagina.getBoundingClientRect().height);
      // Limita o tamanho do canvas. Seções muito longas geram páginas adicionais.
      for (let inicio = 0; inicio < altura;) {
        let fim = Math.min(inicio + 1600, altura);
        if (fim < altura) {
          const topo = pagina.getBoundingClientRect().top;
          const limites = Array.from(pagina.querySelectorAll('p,li,tr,.feature,.step,.pricing-card,.terms'))
            .map(el => Math.floor(el.getBoundingClientRect().top - topo))
            .filter(y => y > inicio + 800 && y <= fim);
          if (limites.length) fim = Math.max(...limites);
        }
        const canvas = await html2canvas(pagina, { scale: 1.5, backgroundColor: '#ffffff', logging: false,
          width: 1120, height: fim - inicio, y: inicio, windowWidth: 1120, windowHeight: 900,
          useCORS: false, allowTaint: false });
        const larguraMm = 297;
        const alturaMm = larguraMm * canvas.height / canvas.width;
        const orientacao = alturaMm > larguraMm ? 'portrait' : 'landscape';
        if (!pdf) pdf = new jsPDF({ orientation: orientacao, unit: 'mm', format: [larguraMm, alturaMm], compress: true });
        else pdf.addPage([larguraMm, alturaMm], orientacao);
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, larguraMm, alturaMm);
        canvas.width = 0; canvas.height = 0;
        inicio = fim;
      }
    }
    if (!pdf) throw new Error('Nenhuma página para baixar.');
    pdf.setProperties({ title: documento.titulo, subject: 'Proposta comercial VIVOX' });
    const nome = documento.titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'proposta';
    pdf.save(`${nome}.pdf`);
  } finally { iframe.remove(); }
}
