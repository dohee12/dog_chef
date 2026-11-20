import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { dailyNeeds } from '../nutrition/nutrition.service';
import { allergensIn } from '../nutrition/safety-rules';
import { Recipe } from '../recipes/recipe.entity';
import { popularity, RecipesService } from '../recipes/recipes.service';
import { CreatePetDto, UpdatePetDto } from './pet.dto';
import { Pet } from './pet.entity';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet) private readonly pets: Repository<Pet>,
    @InjectRepository(Recipe) private readonly recipes: Repository<Recipe>,
    private readonly recipeService: RecipesService,
  ) {}

  /** 이 반려견의 하루 권장 열량·물·단백질 */
  async needs(userId: string, id: number, activity?: 'low' | 'moderate' | 'high') {
    const pet = await this.findOwned(userId, id);
    const needs = dailyNeeds(pet.weight, pet.is_neutered, pet.age, activity);
    return { pet_id: pet.id, name: pet.name, weight: pet.weight, age: pet.age, needs };
  }

  /**
   * 이 반려견에게 맞는 레시피: 위험 재료가 없고, 알레르기 재료가 없는 것 중 인기순.
   * 1인분 열량이 하루 권장량의 몇 %인지도 함께 준다.
   */
  async recommendations(userId: string, id: number, limit = 10) {
    const pet = await this.findOwned(userId, id);
    const needs = dailyNeeds(pet.weight, pet.is_neutered, pet.age);
    const rows = (await this.recipes.find())
      .filter((r) => r.safety_level !== 'danger')
      .filter((r) => allergensIn(r.ingredients, pet.allergies).length === 0)
      .sort((a, b) => popularity(b) - popularity(a))
      .slice(0, limit);
    const withLiked = await this.recipeService.withLiked(rows, userId);
    return withLiked.map((r) => ({
      ...r,
      calorie_share:
        needs && r.calories ? Math.round((r.calories / needs.daily_calories) * 1000) / 10 : null,
    }));
  }

  findMine(userId: string) {
    return this.pets.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  create(userId: string, dto: CreatePetDto) {
    return this.pets.save(this.pets.create({ ...dto, user_id: userId }));
  }

  async update(userId: string, id: number, dto: UpdatePetDto) {
    const pet = await this.findOwned(userId, id);
    return this.pets.save(Object.assign(pet, dto));
  }

  async remove(userId: string, id: number) {
    await this.pets.remove(await this.findOwned(userId, id));
  }

  // 남의 반려견이면 "없음"으로 응답해 존재 여부를 숨긴다.
  async findOwned(userId: string, id: number) {
    const pet = await this.pets.findOne({ where: { id, user_id: userId } });
    if (!pet) throw new NotFoundException('반려견을 찾을 수 없습니다.');
    return pet;
  }
}
