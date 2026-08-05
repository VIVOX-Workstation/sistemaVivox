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
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const path_1 = require("path");
let StorageService = class StorageService {
    s3;
    bucket = process.env.S3_BUCKET || 'vivox-media';
    constructor() {
        this.s3 = new client_s3_1.S3Client({
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY || '',
                secretAccessKey: process.env.S3_SECRET_KEY || '',
            },
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        });
    }
    async uploadFile(file, folder = 'uploads') {
        const fileName = `${folder}/${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`;
        try {
            await this.s3.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            const endpoint = process.env.S3_ENDPOINT || '';
            const publicUrl = `${endpoint.replace('minio', 'localhost')}/${this.bucket}/${fileName}`;
            return publicUrl;
        }
        catch (err) {
            console.error(err);
            throw new common_1.InternalServerErrorException('Erro ao fazer upload para o Storage');
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map