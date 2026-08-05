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
exports.ServicosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ServicosService = class ServicosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createServicoDto) {
        return this.prisma.servicoContratado.create({
            data: createServicoDto,
        });
    }
    findAll() {
        return this.prisma.servicoContratado.findMany();
    }
    findOne(id) {
        return this.prisma.servicoContratado.findUnique({
            where: { id },
        });
    }
    findByCliente(clienteId) {
        return this.prisma.servicoContratado.findMany({
            where: { clienteId },
            orderBy: { createdAt: 'desc' }
        });
    }
    update(id, updateServicoDto) {
        return this.prisma.servicoContratado.update({
            where: { id },
            data: updateServicoDto,
        });
    }
    remove(id) {
        return this.prisma.servicoContratado.delete({
            where: { id },
        });
    }
};
exports.ServicosService = ServicosService;
exports.ServicosService = ServicosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServicosService);
//# sourceMappingURL=servicos.service.js.map