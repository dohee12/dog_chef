import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.guard';
import {
  CurrentUser,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/jwt.guard';
import {
  AnalysisQuery,
  CreateRecipeDto,
  ListRecipesQuery,
  UpdateRecipeDto,
} from './recipe.dto';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipes: RecipesService) {}

  // 누구나 볼 수 있다. 로그인했으면 isLiked 가 채워진다.
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() query: ListRecipesQuery, @CurrentUser() user?: AuthUser) {
    return this.recipes.list(query, user?.id);
  }

  @Get('liked')
  @UseGuards(JwtAuthGuard)
  likedIds(@CurrentUser() user: AuthUser) {
    return this.recipes.likedIds(user.id);
  }

  /** 찜한 레시피 전체 정보 (찜한 순서) */
  @Get('liked/full')
  @UseGuards(JwtAuthGuard)
  likedRecipes(@CurrentUser() user: AuthUser) {
    return this.recipes.likedRecipes(user.id);
  }

  /** 내가 올린 레시피 */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthUser) {
    return this.recipes.mine(user.id);
  }

  /** 카테고리·태그 목록과 개수 (검색 필터용) */
  @Get('facets')
  facets() {
    return this.recipes.facets();
  }

  /** 안전성 + 영양 + (로그인 시) 내 반려견별 알레르기·열량 비율 */
  @Get(':id/analysis')
  @UseGuards(OptionalJwtAuthGuard)
  analysis(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AnalysisQuery,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.recipes.analysis(id, user?.id, query.pet_id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return this.recipes.findOne(id, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRecipeDto) {
    return this.recipes.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.recipes.update(user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.recipes.remove(user.id, id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  like(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.recipes.like(user.id, id);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  unlike(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.recipes.unlike(user.id, id);
  }
}
