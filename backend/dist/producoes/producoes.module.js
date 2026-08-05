"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProducoesModule = void 0;
const common_1 = require("@nestjs/common");
const producoes_service_1 = require("./producoes.service");
const producoes_controller_1 = require("./producoes.controller");
let ProducoesModule = class ProducoesModule {
};
exports.ProducoesModule = ProducoesModule;
exports.ProducoesModule = ProducoesModule = __decorate([
    (0, common_1.Module)({
        controllers: [producoes_controller_1.ProducoesController],
        providers: [producoes_service_1.ProducoesService],
    })
], ProducoesModule);
//# sourceMappingURL=producoes.module.js.map