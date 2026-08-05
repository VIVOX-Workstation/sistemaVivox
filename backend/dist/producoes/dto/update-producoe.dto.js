"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProducoeDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_producoe_dto_1 = require("./create-producoe.dto");
class UpdateProducoeDto extends (0, mapped_types_1.PartialType)(create_producoe_dto_1.CreateProducoeDto) {
}
exports.UpdateProducoeDto = UpdateProducoeDto;
//# sourceMappingURL=update-producoe.dto.js.map