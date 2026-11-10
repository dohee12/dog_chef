import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1, { message: '평점은 1~5점 사이여야 합니다.' })
  @Max(5, { message: '평점은 1~5점 사이여야 합니다.' })
  rating: number;

  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
}

export class UpdateReviewDto extends CreateReviewDto {}
