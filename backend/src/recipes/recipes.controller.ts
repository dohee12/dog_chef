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
import { CreateRecipeDto, ListRecipesQuery, UpdateRecipeDto } from './recipe.dto';
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
