import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import { UPLOAD_DIR } from './uploads/uploads.controller';

// .env 가 있으면 읽는다 (Node 내장 기능). 운영 서버처럼 환경 변수를 직접 주면 파일이 없어도 된다.
try {
  process.loadEnvFile();
} catch {
  // .env 없음
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // 업로드한 이미지는 /uploads/<파일명> 으로 서빙한다 (/api 접두사 밖).
  // nosniff: 브라우저가 내용을 보고 다른 형식으로 해석하지 못하게 한다.
  app.useStaticAssets(resolve(UPLOAD_DIR), {
    prefix: '/uploads/',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });

  // 쉼표로 여러 주소 허용. 비우면 개발 편의를 위해 모든 출처 허용.
  const origins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim());
  app.enableCors({ origin: origins && origins[0] ? origins : true });

  // 이미지가 data URI 문자열로 올 수 있어 기본 100kb 보다 크게 잡는다.
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO 에 없는 필드(isLiked, review_list 등)는 조용히 버린다
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4040);
  await app.listen(port);
  console.log(`dog_chef API: http://localhost:${port}/api`);
}
void bootstrap();
