"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMidiaDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_midia_dto_1 = require("./create-midia.dto");
class UpdateMidiaDto extends (0, mapped_types_1.PartialType)(create_midia_dto_1.CreateMidiaDto) {
}
exports.UpdateMidiaDto = UpdateMidiaDto;
//# sourceMappingURL=update-midia.dto.js.map