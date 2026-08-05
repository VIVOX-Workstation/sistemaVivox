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
exports.MidiasController = void 0;
const common_1 = require("@nestjs/common");
const midias_service_1 = require("./midias.service");
const create_midia_dto_1 = require("./dto/create-midia.dto");
const update_midia_dto_1 = require("./dto/update-midia.dto");
const platform_express_1 = require("@nestjs/platform-express");
const storage_service_1 = require("../storage/storage.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let MidiasController = class MidiasController {
    midiasService;
    storageService;
    constructor(midiasService, storageService) {
        this.midiasService = midiasService;
        this.storageService = storageService;
    }
    async create(createMidiaDto, files) {
        if (files && files.length > 0) {
            const midiasCriadas = [];
            for (const file of files) {
                const url = await this.storageService.uploadFile(file, 'midias');
                const midia = await this.midiasService.create({ ...createMidiaDto, url });
                midiasCriadas.push(midia);
            }
            return midiasCriadas;
        }
        return this.midiasService.create(createMidiaDto);
    }
    findAll() {
        return this.midiasService.findAll();
    }
    findOne(id) {
        return this.midiasService.findOne(id);
    }
    update(id, updateMidiaDto) {
        return this.midiasService.update(id, updateMidiaDto);
    }
    remove(id) {
        return this.midiasService.remove(id);
    }
};
exports.MidiasController = MidiasController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_midia_dto_1.CreateMidiaDto, Array]),
    __metadata("design:returntype", Promise)
], MidiasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MidiasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MidiasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_midia_dto_1.UpdateMidiaDto]),
    __metadata("design:returntype", void 0)
], MidiasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MidiasController.prototype, "remove", null);
exports.MidiasController = MidiasController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('midias'),
    __metadata("design:paramtypes", [midias_service_1.MidiasService,
        storage_service_1.StorageService])
], MidiasController);
//# sourceMappingURL=midias.controller.js.map