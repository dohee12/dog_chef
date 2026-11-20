import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// user_id, likes_count, reviews_count, average_rating 은 받지 않는다 (서버가 관리).
export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty({ message: '레시피 제목을 입력해주세요.' })
  title: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string | null;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() author?: string;
  @IsOptional() @IsInt() @Min(0) cook_time?: number;
  @IsOptional() @IsInt() @Min(1) servings?: number;
  @IsOptional() @IsString() difficulty?: string;
  @IsOptional() @IsNumber() safety_score?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) ingredients?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) instructions?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsNumber() calories?: number;
  @IsOptional() @IsNumber() protein?: number;
  @IsOptional() @IsNumber() fat?: number;
  @IsOptional() @IsNumber() carbs?: number;
  @IsOptional() @IsNumber() fiber?: number;
}

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}

export type RecipeSort = 'latest' | 'popular' | 'rating' | 'cook_time' | 'calories';

export class ListRecipesQuery {
  /** 이 시각 이후에 만들어진 레시피만 (ISO 문자열) */
  @IsOptional() @IsDateString() since?: string;

  /** latest(기본) 최신순, popular 인기 점수순, rating 평점순, cook_time 조리시간 짧은순, calories 열량 낮은순 */
  @IsOptional()
  @IsIn(['latest', 'popular', 'rating', 'cook_time', 'calories'])
  sort?: RecipeSort;

  /** 제목·설명·재료·태그에서 찾을 말 */
  @IsOptional() @IsString() @MaxLength(50) q?: string;

  @IsOptional() @IsString() @MaxLength(30) category?: string;
  @IsOptional() @IsString() @MaxLength(30) tag?: string;

  /** 이 재료가 들어간 레시피만 (쉼표로 여러 개, 모두 들어 있어야 함) */
  @IsOptional() @IsString() @MaxLength(200) include?: string;

  /** 이 알레르기 재료가 든 레시피는 빼기 (쉼표 구분, 예: 닭고기,밀) */
  @IsOptional() @IsString() @MaxLength(200) exclude_allergens?: string;

  /** 내 반려견의 알레르기 재료가 든 레시피는 빼기 (로그인 필요) */
  @IsOptional() @Type(() => Number) @IsInt() pet_id?: number;

  /** true 면 위험 재료가 든 레시피는 뺀다 */
  @IsOptional() @IsIn(['true', 'false']) safe_only?: 'true' | 'false';

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) max_cook_time?: number;
  @IsOptional() @IsString() @MaxLength(10) difficulty?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
}

export class AnalysisQuery {
  /** 이 반려견 기준으로만 분석 (없으면 내 반려견 전부) */
  @IsOptional() @Type(() => Number) @IsInt() pet_id?: number;
}
