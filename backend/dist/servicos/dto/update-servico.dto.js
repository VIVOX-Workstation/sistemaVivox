"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateServicoDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_servico_dto_1 = require("./create-servico.dto");
class UpdateServicoDto extends (0, mapped_types_1.PartialType)(create_servico_dto_1.CreateServicoDto) {
}
exports.UpdateServicoDto = UpdateServicoDto;
//# sourceMappingURL=update-servico.dto.js.map