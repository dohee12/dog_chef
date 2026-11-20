import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { recipeSafety } from '../nutrition/safety-rules';
import { Recipe } from '../recipes/recipe.entity';
import { SAMPLE_RECIPES } from './sample-recipes';

/** 예시 레시피의 소유자. 실제 사용자 id(uuid)와 겹치지 않으므로 누구도 수정·삭제할 수 없다. */
export const SYSTEM_USER_ID = 'system';

/**
 * 레시피 테이블이 완전히 비어 있을 때만 예시 레시피를 넣는다.
 * 한 번이라도 데이터가 생기면 다시 넣지 않는다. SEED_SAMPLE_DATA=false 로 끌 수 있다.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectRepository(Recipe) private readonly recipes: Repository<Recipe>) {}

  async onApplicationBootstrap() {
    await this.seedSamples();
    await this.refreshSafetyLevels();
  }

  private async seedSamples() {
    if (process.env.SEED_SAMPLE_DATA === 'false') return;
    if ((await this.recipes.count()) > 0) return;

    await this.recipes.save(
      SAMPLE_RECIPES.map((r) =>
        this.recipes.create({ ...r, user_id: SYSTEM_USER_ID, is_user_created: false }),
      ),
    );
    this.logger.log(`예시 레시피 ${SAMPLE_RECIPES.length}개를 넣었습니다.`);
  }

  /** 안전 규칙이 바뀌었을 수 있으니 시작할 때 모든 레시피의 안전 등급을 다시 판정한다. */
  private async refreshSafetyLevels() {
    const rows = await this.recipes.find({ select: { id: true, ingredients: true, safety_level: true } });
    let changed = 0;
    for (const r of rows) {
      const level = recipeSafety(r.ingredients).level;
      if (level !== r.safety_level) {
        await this.recipes.update(r.id, { safety_level: level });
        changed++;
      }
    }
    if (changed) this.logger.log(`안전 등급 ${changed}개를 다시 판정했습니다.`);
  }
}
