import { SetMetadata } from '@nestjs/common';

export const PORTAL_CLIENTE_KEY = 'portalCliente';
export const PortalCliente = () => SetMetadata(PORTAL_CLIENTE_KEY, true);
