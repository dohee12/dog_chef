import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PetsModule } from './pets/pets.module';
import { RecipesModule } from './recipes/recipes.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SeedModule } from './seed/seed.module';
import { UploadsModule } from './uploads/uploads.module';

// DATABASE_URL 이 있으면 Postgres, 없으면 설치가 필요 없는 SQLite 파일(sql.js)을 쓴다.
function databaseOptions(): TypeOrmModuleOptions {
  const common = {
    autoLoadEntities: true,
    // 개발 중에는 엔티티 변경이 바로 테이블에 반영된다. 운영에서는 false + 마이그레이션.
    synchronize: process.env.DB_SYNCHRONIZE !== 'false',
  };

  if (process.env.DATABASE_URL) {
    return { type: 'postgres', url: process.env.DATABASE_URL, ...common };
  }

  return {
    type: 'sqljs',
    location: process.env.SQLITE_PATH ?? 'data/dogchef.sqlite',
    autoSave: true,
    ...common,
  };
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: databaseOptions }),
    AuthModule,
    PetsModule,
    RecipesModule,
    ReviewsModule,
    UploadsModule,
    SeedModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
