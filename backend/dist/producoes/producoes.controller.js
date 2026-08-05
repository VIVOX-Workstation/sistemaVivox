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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProducoesController = void 0;
const common_1 = require("@nestjs/common");
const producoes_service_1 = require("./producoes.service");
const create_producoe_dto_1 = require("./dto/create-producoe.dto");
const update_producoe_dto_1 = require("./dto/update-producoe.dto");
const platform_express_1 = require("@nestjs/platform-express");
const storage_service_1 = require("../storage/storage.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ProducoesController = class ProducoesController {
    producoesService;
    storageService;
    constructor(producoesService, storageService) {
        this.producoesService = producoesService;
        this.storageService = storageService;
    }
    async create(createProducoeDto, file) {
        let arquivoUrl = undefined;
        if (file) {
            arquivoUrl = await this.storageService.uploadFile(file, 'producoes');
        }
        return this.producoesService.create({ ...createProducoeDto, arquivoUrl });
    }
    findAll() {
        return this.producoesService.findAll();
    }
    findOne(id) {
        return this.producoesService.findOne(id);
    }
    update(id, updateProducoeDto) {
        return this.producoesService.update(id, updateProducoeDto);
    }
    remove(id) {
        return this.producoesService.remove(id);
    }
};
exports.ProducoesController = ProducoesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_producoe_dto_1.CreateProducoeDto, Object]),
    __metadata("design:returntype", Promise)
], ProducoesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProducoesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProducoesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_producoe_dto_1.UpdateProducoeDto]),
    __metadata("design:returntype", void 0)
], ProducoesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProducoesController.prototype, "remove", null);
exports.ProducoesController = ProducoesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('producoes'),
    __metadata("design:paramtypes", [producoes_service_1.ProducoesService,
        storage_service_1.StorageService])
], ProducoesController);
//# sourceMappingURL=producoes.controller.js.map