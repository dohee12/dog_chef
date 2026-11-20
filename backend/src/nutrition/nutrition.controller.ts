import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { dailyNeeds, NutritionService } from './nutrition.service';
import { checkIngredient, recipeSafety } from './safety-rules';

export class IngredientsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  ingredients: string[];

  @IsOptional() @IsInt() @Min(1) @Max(50) servings?: number;
}

export class SearchQuery {
  @IsString() @MinLength(1) @MaxLength(50) q: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}

export class NeedsQuery {
  @Type(() => Number) @IsNumber() @Min(0.1) @Max(150) weight: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(30) age?: number;
  @IsOptional() @IsIn(['true', 'false']) neutered?: 'true' | 'false';
  @IsOptional() @IsIn(['low', 'moderate', 'high']) activity?: 'low' | 'moderate' | 'high';
}

@Controller()
export class NutritionController {
  constructor(private readonly nutrition: NutritionService) {}

  /** 식약처 연동 여부 등 */
  @Get('nutrition/status')
  status() {
    return this.nutrition.status();
  }

  /** 재료 이름 검색 (식약처 + 내장 표). 100g 당 영양이 함께 온다. */
  @Get('ingredients/search')
  search(@Query() query: SearchQuery) {
    return this.nutrition.search(query.q, query.limit);
  }

  /** 재료 목록의 안전성 판정 (위험·주의 재료와 이유) */
  @Post('ingredients/safety')
  @HttpCode(200)
  safety(@Body() dto: IngredientsDto) {
    const result = recipeSafety(dto.ingredients);
    return {
      ...result,
      items: dto.ingredients.map((i) => ({ ingredient: i, hit: checkIngredient(i) })),
    };
  }

  /** 재료 목록의 영양 합계·1인분 값 */
  @Post('nutrition/calculate')
  @HttpCode(200)
  calculate(@Body() dto: IngredientsDto) {
    return this.nutrition.calculate(dto.ingredients, dto.servings);
  }

  /** 체중·나이로 하루 권장 열량 (반려견 등록 전에도 쓸 수 있게 로그인 불필요) */
  @Get('nutrition/daily-needs')
  needs(@Query() q: NeedsQuery) {
    return dailyNeeds(q.weight, q.neutered !== 'false', q.age ?? 3, q.activity);
  }
}
