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
exports.MidiasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MidiasService = class MidiasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createMidiaDto) {
        return this.prisma.midiaCliente.create({
            data: createMidiaDto,
        });
    }
    findAll() {
        return this.prisma.midiaCliente.findMany();
    }
    findOne(id) {
        return this.prisma.midiaCliente.findUnique({
            where: { id },
        });
    }
    update(id, updateMidiaDto) {
        return this.prisma.midiaCliente.update({
            where: { id },
            data: updateMidiaDto,
        });
    }
    remove(id) {
        return this.prisma.midiaCliente.delete({
            where: { id },
        });
    }
};
exports.MidiasService = MidiasService;
exports.MidiasService = MidiasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MidiasService);
//# sourceMappingURL=midias.service.js.map