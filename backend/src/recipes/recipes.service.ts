import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { Like } from './like.entity';
import { CreateRecipeDto, ListRecipesQuery, UpdateRecipeDto } from './recipe.dto';
import { Recipe } from './recipe.entity';

// 프론트의 기존 공식 그대로: (찜 수 × 2) + (리뷰 수 × 3) + (평균 평점 × 10)
const popularity = (r: Recipe) =>
  r.likes_count * 2 + r.reviews_count * 3 + r.average_rating * 10;

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe) private readonly recipes: Repository<Recipe>,
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    private readonly dataSource: DataSource,
  ) {}

  async list(query: ListRecipesQuery, userId?: string) {
    const rows = await this.recipes.find({
      where: query.since ? { created_at: MoreThan(new Date(query.since)) } : {},
      order: { created_at: 'DESC' },
    });

    let result = rows;
    if (query.sort === 'popular') {
      result = [...rows].sort((a, b) => popularity(b) - popularity(a));
      result = result.slice(0, query.limit ?? 20);
    } else if (query.limit) {
      result = result.slice(0, query.limit);
    }
    return this.withLiked(result, userId);
  }

  async findOne(id: number, userId?: string) {
    const recipe = await this.recipes.findOne({ where: { id } });
    if (!recipe) throw new NotFoundException('레시피를 찾을 수 없습니다.');
    return (await this.withLiked([recipe], userId))[0];
  }

  create(userId: string, dto: CreateRecipeDto) {
    return this.recipes.save(
      this.recipes.create({ ...dto, user_id: userId, is_user_created: true }),
    );
  }

  async update(userId: string, id: number, dto: UpdateRecipeDto) {
    const recipe = await this.findOwned(userId, id);
    return this.recipes.save(Object.assign(recipe, dto));
  }

  async remove(userId: string, id: number) {
    const recipe = await this.findOwned(userId, id);
    await this.dataSource.transaction(async (m) => {
      await m.delete(Like, { recipe_id: id });
      await m.delete('reviews', { recipe_id: id });
      await m.remove(recipe);
    });
  }

  /** 찜하기. 이미 찜했으면 그대로 둔다 (두 번 눌러도 안전). */
  async like(userId: string, recipeId: number) {
    await this.ensureExists(recipeId);
    const exists = await this.likes.exists({
      where: { user_id: userId, recipe_id: recipeId },
    });
    if (!exists) {
      await this.likes.save(this.likes.create({ user_id: userId, recipe_id: recipeId }));
    }
    return this.refreshLikes(recipeId, true);
  }

  async unlike(userId: string, recipeId: number) {
    await this.ensureExists(recipeId);
    await this.likes.delete({ user_id: userId, recipe_id: recipeId });
    return this.refreshLikes(recipeId, false);
  }

  /** 내가 찜한 레시피 id 목록 */
  async likedIds(userId: string) {
    const rows = await this.likes.find({ where: { user_id: userId } });
    return rows.map((l) => l.recipe_id);
  }

  private async refreshLikes(recipeId: number, isLiked: boolean) {
    const likes_count = await this.likes.count({ where: { recipe_id: recipeId } });
    await this.recipes.update(recipeId, { likes_count });
    return { recipe_id: recipeId, isLiked, likes_count };
  }

  private async withLiked(rows: Recipe[], userId?: string) {
    const liked = new Set(userId ? await this.likedIds(userId) : []);
    return rows.map((r) => ({ ...r, isLiked: liked.has(r.id) }));
  }

  private async ensureExists(id: number) {
    if (!(await this.recipes.exists({ where: { id } }))) {
      throw new NotFoundException('레시피를 찾을 수 없습니다.');
    }
  }

  private async findOwned(userId: string, id: number) {
    const recipe = await this.recipes.findOne({ where: { id, user_id: userId } });
    if (!recipe) throw new NotFoundException('레시피를 찾을 수 없습니다.');
    return recipe;
  }
}
