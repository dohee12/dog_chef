import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Recipe } from '../recipes/recipe.entity';
import { displayName, User } from '../users/user.entity';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';
import { Review } from './review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(Recipe) private readonly recipes: Repository<Recipe>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async listForRecipe(recipeId: number) {
    const rows = await this.reviews.find({
      where: { recipe_id: recipeId },
      order: { created_at: 'DESC' },
    });
    // 작성자 표시 이름을 붙여 준다. 이메일은 개인정보라 그대로 내보내지 않는다.
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const users = ids.length ? await this.users.find({ where: { id: In(ids) } }) : [];
    const userOf = new Map(users.map((u) => [u.id, u]));
    return rows.map((r) => ({
      ...r,
      images: r.images ?? [],
      user_name: displayName(userOf.get(r.user_id)),
    }));
  }

  /** 내가 쓴 리뷰 (레시피 제목과 함께) */
  async listMine(userId: string) {
    const rows = await this.reviews.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
    const ids = [...new Set(rows.map((r) => r.recipe_id))];
    const recipes = ids.length
      ? await this.recipes.find({ where: { id: In(ids) }, select: { id: true, title: true, image: true } })
      : [];
    const recipeOf = new Map(recipes.map((r) => [r.id, r]));
    return rows.map((r) => ({
      ...r,
      images: r.images ?? [],
      recipe_title: recipeOf.get(r.recipe_id)?.title ?? null,
      recipe_image: recipeOf.get(r.recipe_id)?.image ?? null,
    }));
  }

  /** 내가 이 레시피에 쓴 리뷰 (없으면 null) */
  findMine(userId: string, recipeId: number) {
    return this.reviews.findOne({ where: { user_id: userId, recipe_id: recipeId } });
  }

  async create(userId: string, recipeId: number, dto: CreateReviewDto) {
    if (!(await this.recipes.exists({ where: { id: recipeId } }))) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }
    const existing = await this.findMine(userId, recipeId);
    if (existing) {
      // 프론트가 "수정하시겠습니까?"를 띄울 수 있게 기존 리뷰 id 를 함께 준다
      throw new ConflictException({
        message: '이미 이 레시피에 리뷰를 작성하셨습니다.',
        review_id: existing.id,
      });
    }
    const saved = await this.reviews.save(
      this.reviews.create({
        ...dto,
        comment: dto.comment ?? '',
        images: dto.images?.length ? dto.images : null,
        user_id: userId,
        recipe_id: recipeId,
      }),
    );
    await this.refreshStats(recipeId);
    return saved;
  }

  async update(userId: string, id: number, dto: UpdateReviewDto) {
    const review = await this.findOwned(userId, id);
    Object.assign(review, {
      rating: dto.rating,
      comment: dto.comment ?? '',
      images: dto.images?.length ? dto.images : null,
    });
    const saved = await this.reviews.save(review);
    await this.refreshStats(review.recipe_id);
    return saved;
  }

  async remove(userId: string, id: number) {
    const review = await this.findOwned(userId, id);
    const recipeId = review.recipe_id;
    await this.reviews.remove(review);
    await this.refreshStats(recipeId);
    return { recipe_id: recipeId };
  }

  async refreshStats(recipeId: number) {
    const row = await this.reviews
      .createQueryBuilder('r')
      .select('COUNT(*)', 'count')
      .addSelect('AVG(r.rating)', 'avg')
      .where('r.recipe_id = :recipeId', { recipeId })
      .getRawOne<{ count: string | number; avg: string | number | null }>();
    const reviews_count = Number(row?.count ?? 0);
    const average_rating = reviews_count
      ? Math.round(Number(row?.avg ?? 0) * 10) / 10
      : 0;
    await this.recipes.update(recipeId, { reviews_count, average_rating });
  }

  private async findOwned(userId: string, id: number) {
    const review = await this.reviews.findOne({ where: { id, user_id: userId } });
    if (!review) throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    return review;
  }
}
