import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThan, Repository } from 'typeorm';
import { dailyNeeds, NutritionService } from '../nutrition/nutrition.service';
import { allergensIn, recipeSafety } from '../nutrition/safety-rules';
import { Pet } from '../pets/pet.entity';
import { Like } from './like.entity';
import {
  CreateRecipeDto,
  ListRecipesQuery,
  RecipeSort,
  UpdateRecipeDto,
} from './recipe.dto';
import { Recipe } from './recipe.entity';

// 프론트의 기존 공식 그대로: (찜 수 × 2) + (리뷰 수 × 3) + (평균 평점 × 10)
export const popularity = (r: Recipe) =>
  r.likes_count * 2 + r.reviews_count * 3 + r.average_rating * 10;

const NUTRIENT_KEYS = ['calories', 'protein', 'fat', 'carbs', 'fiber'] as const;

const SORTERS: Record<RecipeSort, (a: Recipe, b: Recipe) => number> = {
  latest: (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  popular: (a, b) => popularity(b) - popularity(a),
  rating: (a, b) => b.average_rating - a.average_rating || b.reviews_count - a.reviews_count,
  cook_time: (a, b) => (a.cook_time || Infinity) - (b.cook_time || Infinity),
  calories: (a, b) => (a.calories ?? Infinity) - (b.calories ?? Infinity),
};

const splitList = (s?: string) =>
  (s ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe) private readonly recipes: Repository<Recipe>,
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    @InjectRepository(Pet) private readonly pets: Repository<Pet>,
    private readonly dataSource: DataSource,
    private readonly nutrition: NutritionService,
  ) {}

  /**
   * 목록 + 검색·필터. 레시피 수가 수천 개 수준까지는 메모리에서 거르는 편이
   * SQLite/Postgres 양쪽에서 똑같이 동작해 단순하다. (JSON 배열 칸을 DB 마다 다르게 검색해야 해서)
   */
  async list(query: ListRecipesQuery, userId?: string) {
    let rows = await this.recipes.find({
      where: query.since ? { created_at: MoreThan(new Date(query.since)) } : {},
      order: { created_at: 'DESC' },
    });

    const q = query.q?.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        [r.title, r.description, r.category, ...(r.ingredients ?? []), ...(r.tags ?? [])]
          .join('\n')
          .toLowerCase()
          .includes(q),
      );
    }
    if (query.category) rows = rows.filter((r) => r.category === query.category);
    if (query.tag) rows = rows.filter((r) => r.tags?.includes(query.tag!));
    if (query.difficulty) rows = rows.filter((r) => r.difficulty === query.difficulty);
    if (query.max_cook_time !== undefined) {
      rows = rows.filter((r) => r.cook_time > 0 && r.cook_time <= query.max_cook_time!);
    }
    const include = splitList(query.include);
    if (include.length) {
      rows = rows.filter((r) => include.every((i) => r.ingredients?.some((x) => x.includes(i))));
    }
    if (query.safe_only === 'true') rows = rows.filter((r) => r.safety_level !== 'danger');

    const allergies = splitList(query.exclude_allergens);
    if (query.pet_id && userId) {
      const pet = await this.pets.findOne({ where: { id: query.pet_id, user_id: userId } });
      allergies.push(...(pet?.allergies ?? []));
    }
    if (allergies.length) rows = rows.filter((r) => allergensIn(r.ingredients, allergies).length === 0);

    const sort = query.sort ?? 'latest';
    if (sort !== 'latest') rows = [...rows].sort(SORTERS[sort]);

    // 예전 프론트 호환: popular 는 limit 이 없으면 20개
    const limit = query.limit ?? (sort === 'popular' ? 20 : undefined);
    if (limit) {
      const page = query.page ?? 1;
      rows = rows.slice((page - 1) * limit, page * limit);
    }
    return this.withLiked(rows, userId);
  }

  /** 레시피에 실제로 쓰인 카테고리·태그 목록 (검색 필터 버튼용) */
  async facets() {
    const rows = await this.recipes.find({ select: { category: true, tags: true } });
    const count = (values: string[]) => {
      const m = new Map<string, number>();
      values.filter(Boolean).forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
      return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, count: n }));
    };
    return {
      categories: count(rows.map((r) => r.category)),
      tags: count(rows.flatMap((r) => r.tags ?? [])),
    };
  }

  async findOne(id: number, userId?: string) {
    const recipe = await this.recipes.findOne({ where: { id } });
    if (!recipe) throw new NotFoundException('레시피를 찾을 수 없습니다.');
    return (await this.withLiked([recipe], userId))[0];
  }

  /** 내가 올린 레시피 */
  async mine(userId: string) {
    const rows = await this.recipes.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
    return this.withLiked(rows, userId);
  }

  /** 내가 찜한 레시피 (찜한 순서, 최근 것 먼저) */
  async likedRecipes(userId: string) {
    const likes = await this.likes.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
    if (!likes.length) return [];
    const rows = await this.recipes.find({ where: { id: In(likes.map((l) => l.recipe_id)) } });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return likes
      .map((l) => byId.get(l.recipe_id))
      .filter((r): r is Recipe => !!r)
      .map((r) => ({ ...r, isLiked: true }));
  }

  async create(userId: string, dto: CreateRecipeDto) {
    const recipe = this.recipes.create({ ...dto, user_id: userId, is_user_created: true });
    await this.applyDerived(recipe, dto);
    return this.recipes.save(recipe);
  }

  async update(userId: string, id: number, dto: UpdateRecipeDto) {
    const recipe = await this.findOwned(userId, id);
    Object.assign(recipe, dto);
    await this.applyDerived(recipe, dto);
    return this.recipes.save(recipe);
  }

  /**
   * 서버가 정하는 값: 안전 등급은 항상 재료로 다시 판정한다.
   * 영양 값은 작성자가 하나도 안 넣었으면 재료로 계산해 채운다 (1인분 기준).
   * 재료나 인분이 바뀌었고 예전에 자동 계산한 값이면 다시 계산한다.
   */
  private async applyDerived(recipe: Recipe, dto: Partial<CreateRecipeDto>) {
    recipe.safety_level = recipeSafety(recipe.ingredients).level;

    const userGave = NUTRIENT_KEYS.some((k) => dto[k] !== undefined && dto[k] !== null);
    if (userGave) {
      recipe.nutrition_auto = false;
      return;
    }
    const isNew = recipe.id === undefined;
    const inputsChanged = dto.ingredients !== undefined || dto.servings !== undefined;
    const hasNoValues = NUTRIENT_KEYS.every((k) => recipe[k] === null || recipe[k] === undefined);
    if (!(isNew || hasNoValues || (recipe.nutrition_auto && inputsChanged))) return;
    if (!recipe.ingredients?.length) return;

    const result = await this.nutrition.calculate(recipe.ingredients, recipe.servings || 1);
    if (!result.items.length) return; // 하나도 못 찾았으면 비워 둔다 (0kcal 로 보이지 않게)
    for (const k of NUTRIENT_KEYS) recipe[k] = result.per_serving[k];
    recipe.nutrition_auto = true;
  }

  /**
   * 레시피 분석: 재료 안전성, 영양(재료로 계산), 그리고 로그인했으면 내 반려견별 알레르기·하루 열량 대비 비율.
   */
  async analysis(id: number, userId?: string, petId?: number) {
    const recipe = await this.recipes.findOne({ where: { id } });
    if (!recipe) throw new NotFoundException('레시피를 찾을 수 없습니다.');

    const safety = recipeSafety(recipe.ingredients);
    const computed = await this.nutrition.calculate(recipe.ingredients ?? [], recipe.servings || 1);
    const stored = recipe.calories !== null && recipe.calories !== undefined;
    const perServingCalories = stored ? recipe.calories! : computed.items.length ? computed.per_serving.calories : null;

    let pets: Pet[] = [];
    if (userId) {
      pets = await this.pets.find({
        where: petId ? { user_id: userId, id: petId } : { user_id: userId },
        order: { created_at: 'DESC' },
      });
    }

    return {
      recipe_id: recipe.id,
      safety,
      nutrition: {
        // 화면에 보여줄 1인분 값: 작성자가 넣은 값이 있으면 그것, 없으면 계산값
        per_serving: stored
          ? Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, recipe[k]]))
          : computed.per_serving,
        basis: stored ? (recipe.nutrition_auto ? 'calculated' : 'author') : computed.items.length ? 'calculated' : 'none',
        calculated: computed,
      },
      pets: pets.map((pet) => {
        const needs = dailyNeeds(pet.weight, pet.is_neutered, pet.age);
        const allergens = allergensIn(recipe.ingredients, pet.allergies);
        return {
          pet_id: pet.id,
          name: pet.name,
          allergens,
          daily_needs: needs,
          // 1인분이 이 반려견 하루 열량의 몇 %인지
          calorie_share:
            needs && perServingCalories !== null
              ? Math.round((perServingCalories / needs.daily_calories) * 1000) / 10
              : null,
          ok: allergens.length === 0 && safety.level !== 'danger',
        };
      }),
    };
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

  async refreshLikes(recipeId: number, isLiked: boolean) {
    const likes_count = await this.likes.count({ where: { recipe_id: recipeId } });
    await this.recipes.update(recipeId, { likes_count });
    return { recipe_id: recipeId, isLiked, likes_count };
  }

  async withLiked(rows: Recipe[], userId?: string) {
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
