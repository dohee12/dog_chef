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

export class ListRecipesQuery {
  /** 이 시각 이후에 만들어진 레시피만 (ISO 문자열) */
  @IsOptional() @IsDateString() since?: string;

  /** latest(기본): 최신순, popular: 인기 점수순 */
  @IsOptional() @IsIn(['latest', 'popular']) sort?: 'latest' | 'popular';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
