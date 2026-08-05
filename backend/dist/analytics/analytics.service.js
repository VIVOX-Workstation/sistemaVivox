"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async saveSnapshot(dto) {
        const existing = await this.prisma.analyticsSnapshot.findFirst({
            where: {
                clienteId: dto.clienteId,
                periodoInicio: dto.periodoInicio,
                origem: dto.origem
            },
        });
        if (existing) {
            return this.prisma.analyticsSnapshot.update({
                where: { id: existing.id },
                data: dto,
            });
        }
        return this.prisma.analyticsSnapshot.create({
            data: dto,
        });
    }
    async getResultados(clienteId) {
        const snapshots = await this.prisma.analyticsSnapshot.findMany({
            where: { clienteId },
            orderBy: { periodoInicio: 'desc' },
            take: 12,
        });
        const servicos = await this.prisma.servicoContratado.findMany({
            where: { clienteId },
        });
        let oportunidades = await this.prisma.oportunidade.findMany({
            where: { clienteId },
            orderBy: { createdAt: 'desc' }
        });
        if (oportunidades.length === 0) {
            const todosTipos = [
                'GERENCIAMENTO_REDES', 'FOLDER', 'REVISTA', 'LANDING_PAGE',
                'APP', 'FOTOGRAFIA', 'VIDEO', 'TRAFEGO_PAGO', 'IDENTIDADE_VISUAL'
            ];
            const servicosAtivos = servicos.map(s => s.tipoServico);
            const faltantes = todosTipos.filter(t => !servicosAtivos.includes(t));
            oportunidades = faltantes.map((tipo, idx) => ({
                id: `mock-${idx}`,
                clienteId,
                servicoSugerido: tipo,
                justificativa: `O cliente possui engajamento potencial mas ainda não utiliza o serviço de ${tipo.replace(/_/g, ' ')}.`,
                status: 'ABERTA',
                createdAt: new Date(),
                updatedAt: new Date(),
            }));
        }
        return {
            servicos,
            snapshot: snapshots.length > 0 ? snapshots[0] : null,
            oportunidades
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map