import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket = process.env.S3_BUCKET || 'vivox-media';

  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    const fileName = `${folder}/${uuidv4()}${extname(file.originalname)}`;
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      
      const endpoint = process.env.S3_ENDPOINT || '';
      
      return this.getFileUrl(fileName);
    } catch (err) {
      this.logger.error('Erro ao fazer upload para o Storage', err);
      throw new InternalServerErrorException('Erro ao fazer upload para o Storage');
    }
  }
  async uploadRawFile(key: string, buffer: Buffer, mimetype: string): Promise<string> {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimetype,
        })
      );
      return this.getFileUrl(key);
    } catch (err) {
      this.logger.error('Erro ao fazer upload raw para o Storage', err);
      throw new InternalServerErrorException('Erro ao fazer upload raw para o Storage');
    }
  }

  getFileUrl(key: string): string {
    if (process.env.S3_PUBLIC_URL) {
      return `${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
    } else {
      const isProd = process.env.NODE_ENV === 'production';
      const defaultHost = isProd ? 'http://179.198.120.113:9000' : 'http://localhost:9000';
      return `${defaultHost}/${this.bucket}/${key}`;
    }
  }
}
