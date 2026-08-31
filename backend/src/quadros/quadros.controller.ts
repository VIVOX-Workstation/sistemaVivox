import { Controller, Get, Put, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { QuadrosService } from './quadros.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('quadros')
@UseGuards(JwtAuthGuard)
export class QuadrosController {
  constructor(
    private readonly quadrosService: QuadrosService,
    private readonly storageService: StorageService,
  ) {}

  @Get(':roomId')
  async getQuadro(@Param('roomId') roomId: string) {
    return this.quadrosService.findByRoomId(roomId);
  }

  @Put(':roomId')
  async updateQuadro(
    @Param('roomId') roomId: string,
    @Body() body: { elements: any[] },
  ) {
    await this.quadrosService.upsertQuadro(roomId, body.elements);
    return { success: true };
  }

  @Post(':roomId/arquivos/:fileId')
  async uploadArquivo(
    @Param('roomId') roomId: string,
    @Param('fileId') fileId: string,
    @Req() req: Request,
  ) {
    const buffer = await this.getRawBody(req);
    const key = `quadros/${roomId}/${fileId}`;
    await this.storageService.uploadRawFile(key, buffer, req.headers['content-type'] || 'application/octet-stream');
    return { success: true };
  }

  @Get(':roomId/arquivos/:fileId')
  async getArquivo(@Param('roomId') roomId: string, @Param('fileId') fileId: string) {
    const key = `quadros/${roomId}/${fileId}`;
    return { url: this.storageService.getFileUrl(key) };
  }

  private getRawBody(req: Request): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // Caso algum middleware (como o raw-body) já tenha consumido e salvo
      if (req.body instanceof Buffer) {
        return resolve(req.body);
      }
      if ((req as any).rawBody instanceof Buffer) {
        return resolve((req as any).rawBody);
      }
      
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => {
        chunks.push(chunk);
      });
      req.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      req.on('error', (err) => {
        reject(err);
      });
    });
  }
}
