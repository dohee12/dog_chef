import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt.guard';

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * 파일 앞부분(매직 바이트)으로 실제 형식을 판별한다.
 * 클라이언트가 보낸 content-type 은 믿지 않는다. 저장 확장자도 여기서 정해서
 * 이미지로 위장한 HTML 같은 파일이 다른 형식으로 서빙되지 않게 한다.
 */
function detectImage(buf: Buffer): 'jpg' | 'png' | 'gif' | 'webp' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 6).toString('ascii').startsWith('GIF8')) return 'gif';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

@Controller('uploads')
export class UploadsController {
  /** 이미지 한 장 업로드 (form-data 필드 이름: file). 로그인 필요. */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_BYTES } }))
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: Request) {
    if (!file) throw new BadRequestException('file 필드에 이미지를 넣어 주세요.');
    const ext = detectImage(file.buffer);
    if (!ext) throw new BadRequestException('JPG, PNG, GIF, WEBP 이미지만 올릴 수 있습니다.');

    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await writeFile(join(UPLOAD_DIR, name), file.buffer);

    // 배포 시 PUBLIC_URL(예: https://api.example.com)을 주면 그 주소로 만든다
    const base = process.env.PUBLIC_URL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;
    return { url: `${base}/uploads/${name}` };
  }
}
