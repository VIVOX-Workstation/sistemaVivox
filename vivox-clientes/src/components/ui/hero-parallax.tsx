import React from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

// Hero com três fileiras de telas que se inclinam e deslizam com a rolagem.
// Adaptado de 21st.dev/@manuarora700/hero-parallax (Aceternity) para Vite: <img> no lugar de
// next/image, clique por callback no lugar de next/link e cabeçalho recebido por prop.

export interface ItemParallax {
  title: string;
  thumbnail: string;
}

// No celular as fileiras 3D ficam largas demais e somem na rolagem: lá usamos faixas que deslizam.
const CONSULTA_CELULAR = '(max-width: 767px)';
function useCelular() {
  return React.useSyncExternalStore(
    aviso => {
      const mq = window.matchMedia(CONSULTA_CELULAR);
      mq.addEventListener('change', aviso);
      return () => mq.removeEventListener('change', aviso);
    },
    () => window.matchMedia(CONSULTA_CELULAR).matches,
    () => false,
  );
}

export const HeroParallax = ({
  products,
  header,
  onSelect,
}: {
  products: ItemParallax[];
  header: ReactNode;
  onSelect?: (product: ItemParallax) => void;
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const reduzir = useReducedMotion();
  const celular = useCelular();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, -1000]), springConfig);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), springConfig);
  // No original começa em 0.2; aqui as telas já aparecem bem visíveis atrás do texto.
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.55, 1]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 500]), springConfig);

  if (reduzir) {
    // Sem movimento: as telas aparecem paradas, em grade, logo abaixo do texto.
    return (
      <div ref={ref} className="relative flex flex-col py-20 antialiased">
        {header}
        <div className="mx-auto mt-12 grid w-full max-w-7xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <ProductCard product={product} onSelect={onSelect} key={product.title} />
          ))}
        </div>
      </div>
    );
  }

  if (celular) {
    const metade = Math.ceil(products.length / 2);
    return (
      <div ref={ref} className="relative flex flex-col overflow-hidden pt-16 pb-20 antialiased">
        {header}
        <div className="mt-10 flex flex-col gap-4">
          <FaixaCelular itens={products.slice(0, metade)} onSelect={onSelect} duracao={38} />
          <FaixaCelular itens={products.slice(metade)} onSelect={onSelect} duracao={44} reversa />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative flex h-[300vh] flex-col self-auto overflow-hidden py-40 antialiased [perspective:1000px]"
    >
      {/* Sem preserve-3d no contêiner, o z-index basta para o texto ficar acima das telas. */}
      <div className="relative z-10">{header}</div>
      <motion.div style={{ rotateX, rotateZ, translateY, opacity }}>
        <motion.div className="mb-20 flex flex-row-reverse gap-20">
          {firstRow.map(product => (
            <ProductCard product={product} translate={translateX} onSelect={onSelect} key={product.title} />
          ))}
        </motion.div>
        <motion.div className="mb-20 flex flex-row gap-20">
          {secondRow.map(product => (
            <ProductCard product={product} translate={translateXReverse} onSelect={onSelect} key={product.title} />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse gap-20">
          {thirdRow.map(product => (
            <ProductCard product={product} translate={translateX} onSelect={onSelect} key={product.title} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

// Itens repetidos duas vezes: deslizar até -50% emenda a volta sem salto.
function FaixaCelular({
  itens,
  onSelect,
  duracao,
  reversa = false,
}: {
  itens: ItemParallax[];
  onSelect?: (product: ItemParallax) => void;
  duracao: number;
  reversa?: boolean;
}) {
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex w-max gap-4"
        animate={{ x: reversa ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: duracao, ease: 'linear', repeat: Infinity }}
      >
        {[...itens, ...itens].map((item, i) => (
          <button
            key={`${item.title}-${i}`}
            type="button"
            onClick={() => onSelect?.(item)}
            aria-label={`Abrir a demo: ${item.title}`}
            tabIndex={i < itens.length ? 0 : -1}
            className="relative aspect-[16/10] w-64 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-0 bg-transparent p-0 ring-1 ring-white/10"
          >
            <img
              src={item.thumbnail}
              alt=""
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-left-top"
            />
          </button>
        ))}
      </motion.div>
    </div>
  );
}

export const ProductCard = ({
  product,
  translate,
  onSelect,
}: {
  product: ItemParallax;
  translate?: MotionValue<number>;
  onSelect?: (product: ItemParallax) => void;
}) => {
  return (
    <motion.div
      style={translate ? { x: translate } : undefined}
      whileHover={{ y: -20 }}
      className={`group/product relative flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 ${translate ? 'h-96 w-[30rem]' : 'aspect-[16/10] w-full'}`}
    >
      <button
        type="button"
        onClick={() => onSelect?.(product)}
        aria-label={`Abrir a demo: ${product.title}`}
        className="absolute inset-0 block h-full w-full cursor-pointer border-0 bg-transparent p-0 group-hover/product:shadow-2xl"
      >
        <img
          src={product.thumbnail}
          alt=""
          // As telas começam deslocadas por transform; com lazy o navegador as julga fora da tela.
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-left-top"
        />
      </button>
      <div className="pointer-events-none absolute inset-0 h-full w-full bg-black opacity-0 transition-opacity group-hover/product:opacity-70" />
      <h2 className="pointer-events-none absolute bottom-4 left-4 m-0 text-lg font-semibold text-white opacity-0 transition-opacity group-hover/product:opacity-100">
        {product.title}
      </h2>
    </motion.div>
  );
};
