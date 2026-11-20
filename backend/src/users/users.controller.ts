import { Body, Controller, Delete, Get, HttpCode, Patch, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.guard';
import { CurrentUser, JwtAuthGuard } from '../auth/jwt.guard';
import { RecipesService } from '../recipes/recipes.service';
import { ReviewsService } from '../reviews/reviews.service';
import { ChangePasswordDto, DeleteAccountDto, UpdateProfileDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly recipes: RecipesService,
    private readonly reviews: ReviewsService,
  ) {}

  /** 내 프로필 + 레시피·반려견·찜·리뷰 개수 */
  @Get()
  profile(@CurrentUser() user: AuthUser) {
    return this.users.profile(user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Patch('password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(user.id, dto);
  }

  /** 회원 탈퇴. 본인 확인을 위해 비밀번호를 받는다. */
  @Delete()
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Body() dto: DeleteAccountDto) {
    return this.users.deleteAccount(user.id, dto.password);
  }

  @Get('recipes')
  myRecipes(@CurrentUser() user: AuthUser) {
    return this.recipes.mine(user.id);
  }

  @Get('reviews')
  myReviews(@CurrentUser() user: AuthUser) {
    return this.reviews.listMine(user.id);
  }

  @Get('likes')
  myLikes(@CurrentUser() user: AuthUser) {
    return this.recipes.likedRecipes(user.id);
  }
}
