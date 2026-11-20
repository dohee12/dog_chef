import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, In, Not, Repository } from 'typeorm';
import { Pet } from '../pets/pet.entity';
import { Like } from '../recipes/like.entity';
import { Recipe } from '../recipes/recipe.entity';
import { RecipesService } from '../recipes/recipes.service';
import { Review } from '../reviews/review.entity';
import { ReviewsService } from '../reviews/reviews.service';
import { ChangePasswordDto, UpdateProfileDto } from './users.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly recipes: RecipesService,
    private readonly reviews: ReviewsService,
  ) {}

  async profile(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('계정을 찾을 수 없습니다.');
    const m = this.dataSource.manager;
    const [recipes, pets, likes, reviews] = await Promise.all([
      m.count(Recipe, { where: { user_id: userId } }),
      m.count(Pet, { where: { user_id: userId } }),
      m.count(Like, { where: { user_id: userId } }),
      m.count(Review, { where: { user_id: userId } }),
    ]);
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      created_at: user.created_at,
      stats: { recipes, pets, likes, reviews },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.nickname !== undefined) {
      const nickname = dto.nickname?.trim() || null;
      if (nickname) {
        const taken = await this.users.exists({ where: { nickname, id: Not(userId) } });
        if (taken) throw new ConflictException('이미 쓰고 있는 닉네임입니다.');
      }
      await this.users.update(userId, { nickname });
    }
    return this.profile(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.withPassword(userId);
    if (!user.password_hash || !(await bcrypt.compare(dto.current_password, user.password_hash))) {
      throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');
    }
    if (dto.current_password === dto.new_password) {
      throw new BadRequestException('새 비밀번호가 지금 비밀번호와 같습니다.');
    }
    await this.users.update(userId, { password_hash: await bcrypt.hash(dto.new_password, 10) });
    return { ok: true };
  }

  /**
   * 회원 탈퇴: 내 반려견·레시피(와 거기 달린 찜·리뷰)·내가 누른 찜·내가 쓴 리뷰·계정을 모두 지운다.
   * 남의 레시피에 남긴 찜·리뷰가 사라지므로 그 레시피들의 찜 수·평점을 다시 계산한다.
   */
  async deleteAccount(userId: string, password: string) {
    const user = await this.withPassword(userId);
    if (!user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      throw new BadRequestException('비밀번호가 올바르지 않습니다.');
    }

    const affected = await this.dataSource.transaction(async (m) => {
      const myRecipeIds = (await m.find(Recipe, { where: { user_id: userId }, select: { id: true } })).map((r) => r.id);
      const likedIds = (await m.find(Like, { where: { user_id: userId } })).map((l) => l.recipe_id);
      const reviewedIds = (await m.find(Review, { where: { user_id: userId } })).map((r) => r.recipe_id);

      if (myRecipeIds.length) {
        await m.delete(Like, { recipe_id: In(myRecipeIds) });
        await m.delete(Review, { recipe_id: In(myRecipeIds) });
        await m.delete(Recipe, { id: In(myRecipeIds) });
      }
      await m.delete(Like, { user_id: userId });
      await m.delete(Review, { user_id: userId });
      await m.delete(Pet, { user_id: userId });
      await m.delete(User, { id: userId });

      const mine = new Set(myRecipeIds);
      return {
        liked: [...new Set(likedIds)].filter((id) => !mine.has(id)),
        reviewed: [...new Set(reviewedIds)].filter((id) => !mine.has(id)),
      };
    });

    for (const id of affected.liked) await this.recipes.refreshLikes(id, false);
    for (const id of affected.reviewed) await this.reviews.refreshStats(id);
  }

  private async withPassword(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      select: { id: true, email: true, password_hash: true },
    });
    if (!user) throw new UnauthorizedException('계정을 찾을 수 없습니다.');
    return user;
  }
}
