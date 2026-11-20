import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodCache } from './food-cache.entity';
import { MfdsClient } from './mfds.client';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';

// 레시피·반려견 모듈에서도 영양 계산을 쓰므로 전역으로 내보낸다.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([FoodCache])],
  controllers: [NutritionController],
  providers: [NutritionService, MfdsClient],
  exports: [NutritionService],
})
export class NutritionModule {}
