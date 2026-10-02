import { TipoServico } from '@prisma/client';

export const SERVICOS_PORTAL: Record<TipoServico, { label: string; descricao: string }> = {
  GERENCIAMENTO_REDES: { label: 'Gestão de Redes Sociais', descricao: 'Planejamento e gestão da presença da sua marca nas redes sociais.' },
  FOLDER: { label: 'Folder', descricao: 'Materiais impressos para divulgar seus produtos e serviços.' },
  REVISTA: { label: 'Revista', descricao: 'Criação e diagramação de revistas para sua marca.' },
  LANDING_PAGE: { label: 'Landing Page', descricao: 'Páginas de campanha para atrair e converter clientes.' },
  APP: { label: 'Aplicativo', descricao: 'Desenvolvimento de aplicativos para seu negócio.' },
  FOTOGRAFIA: { label: 'Fotografia', descricao: 'Fotografias profissionais para destacar sua marca.' },
  VIDEO: { label: 'Vídeo', descricao: 'Produção de vídeos para comunicar e promover seu negócio.' },
  TRAFEGO_PAGO: { label: 'Tráfego Pago', descricao: 'Campanhas de anúncios para alcançar seu público.' },
  IDENTIDADE_VISUAL: { label: 'Identidade Visual', descricao: 'Criação da identidade e dos elementos visuais da sua marca.' },
};
