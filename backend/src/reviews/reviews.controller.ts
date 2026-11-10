import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.guard';
import { CurrentUser, JwtAuthGuard } from '../auth/jwt.guard';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('recipes/:recipeId/reviews')
  list(@Param('recipeId', ParseIntPipe) recipeId: number) {
    return this.reviews.listForRecipe(recipeId);
  }

  @Post('recipes/:recipeId/reviews')
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.create(user.id, recipeId, dto);
  }

  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviews.update(user.id, id, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.reviews.remove(user.id, id);
  }
}
