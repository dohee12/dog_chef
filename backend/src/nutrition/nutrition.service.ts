import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BUILTIN_FOODS,
  builtinLookup,
  builtinSearch,
  normalizeName,
  parseAmount,
  Per100g,
} from './builtin-foods';
import { FoodCache } from './food-cache.entity';
import { MfdsClient, pickBest } from './mfds.client';
import { ingredientName } from './safety-rules';

export type FoodSource = 'mfds' | 'builtin';

export interface FoodMatch {
  matched_name: string;
  source: FoodSource;
  food_code?: string | null;
  per100g: Per100g;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  calcium: number | null;
  phosphorus: number | null;
  sodium: number | null;
}

const FOUND_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 찾은 값은 30일
const MISS_TTL_MS = 24 * 60 * 60 * 1000; // 못 찾은 이름은 하루 뒤 다시 묻는다

const round = (n: number) => Math.round(n * 10) / 10;

@Injectable()
export class NutritionService {
  constructor(
    @InjectRepository(FoodCache) private readonly cache: Repository<FoodCache>,
    private readonly mfds: MfdsClient,
  ) {}

  status() {
    return {
      mfds_enabled: this.mfds.enabled,
      builtin_foods: Object.keys(BUILTIN_FOODS).length,
    };
  }

  /** 재료 이름 하나의 100g 당 영양. 식약처(저장된 값 → API) → 내장 표 순서. */
  async lookup(rawName: string): Promise<FoodMatch | null> {
    const name = normalizeName(ingredientName(rawName).replace(/\(.*?\)/g, ''));
    if (!name) return null;

    if (this.mfds.enabled) {
      const fromMfds = await this.lookupMfds(name);
      if (fromMfds) return fromMfds;
    }

    // 내장 표: 이름이 같은 것, 없으면 이름 안에 들어 있는 가장 긴 재료 ("생연어" → 연어)
    const exact = builtinLookup(name);
    if (exact) return { matched_name: exact.name, source: 'builtin', per100g: exact.per100g };
    const partial = Object.keys(BUILTIN_FOODS)
      .filter((k) => name.includes(k))
      .sort((a, b) => b.length - a.length)[0];
    return partial ? { matched_name: partial, source: 'builtin', per100g: BUILTIN_FOODS[partial] } : null;
  }

  private async lookupMfds(name: string): Promise<FoodMatch | null> {
    const cached = await this.cache.findOne({ where: { query: name } });
    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (cached.found && cached.per100g && age < FOUND_TTL_MS) {
        return {
          matched_name: cached.matched_name ?? name,
          source: 'mfds',
          food_code: cached.food_code,
          per100g: cached.per100g as unknown as Per100g,
        };
      }
      if (!cached.found && age < MISS_TTL_MS) return null;
    }

    const best = pickBest(name, await this.mfds.search(name));
    await this.cache.save(
      this.cache.create({
        query: name,
        found: !!best,
        food_code: best?.food_code ?? null,
        matched_name: best?.name ?? null,
        food_group: best?.group ?? null,
        per100g: best ? (best.per100g as unknown as Record<string, number | null>) : null,
      }),
    );
    return best
      ? { matched_name: best.name, source: 'mfds', food_code: best.food_code, per100g: best.per100g }
      : null;
  }

  /** 재료 검색 (자동완성·영양 미리보기용) */
  async search(query: string, limit = 20) {
    const q = query.trim();
    if (!q) return [];
    const mfds = (await this.mfds.search(q, limit)).map((f) => ({
      name: f.name,
      source: 'mfds' as FoodSource,
      food_code: f.food_code,
      group: f.group,
      category: f.category,
      per100g: f.per100g,
    }));
    const builtin = builtinSearch(q, limit).map((f) => ({
      name: f.name,
      source: 'builtin' as FoodSource,
      food_code: null,
      group: null,
      category: null,
      per100g: f.per100g,
    }));
    return [...mfds, ...builtin].slice(0, limit);
  }

  /**
   * 재료 목록("닭가슴살 100g" 등)의 영양 합계와 1인분 값.
   * 양을 모르거나 영양 정보를 못 찾은 재료는 합계에서 빠지고 missing 에 이유와 함께 들어간다.
   */
  async calculate(ingredients: string[], servings = 1) {
    const items: {
      input: string;
      grams: number;
      matched_name: string;
      source: FoodSource;
      calories: number;
    }[] = [];
    const missing: { input: string; reason: string }[] = [];
    const total = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
    const minerals: Record<'calcium' | 'phosphorus' | 'sodium', number | null> = {
      calcium: 0,
      phosphorus: 0,
      sodium: 0,
    };

    for (const input of ingredients) {
      const parsed = parseAmount(input);
      if (parsed.grams === null) {
        missing.push({ input, reason: parsed.reason ?? '양을 알 수 없어요' });
        continue;
      }
      const match = await this.lookup(parsed.name);
      if (!match) {
        missing.push({ input, reason: '영양 정보를 찾지 못했어요' });
        continue;
      }
      const ratio = parsed.grams / 100;
      const p = match.per100g;
      total.calories += p.calories * ratio;
      total.protein += p.protein * ratio;
      total.fat += p.fat * ratio;
      total.carbs += p.carbs * ratio;
      total.fiber += p.fiber * ratio;
      // 무기질은 한 재료라도 값이 없으면 합계를 믿을 수 없어 null 로 둔다
      for (const k of ['calcium', 'phosphorus', 'sodium'] as const) {
        const v = p[k];
        minerals[k] = minerals[k] === null || v === null || v === undefined ? null : minerals[k] + v * ratio;
      }
      items.push({
        input,
        grams: parsed.grams,
        matched_name: match.matched_name,
        source: match.source,
        calories: round(p.calories * ratio),
      });
    }

    const totals: NutritionTotals = {
      calories: round(total.calories),
      protein: round(total.protein),
      fat: round(total.fat),
      carbs: round(total.carbs),
      fiber: round(total.fiber),
      calcium: items.length && minerals.calcium !== null ? round(minerals.calcium) : null,
      phosphorus: items.length && minerals.phosphorus !== null ? round(minerals.phosphorus) : null,
      sodium: items.length && minerals.sodium !== null ? round(minerals.sodium) : null,
    };
    const s = Math.max(1, servings || 1);
    const perServing = Object.fromEntries(
      Object.entries(totals).map(([k, v]) => [k, v === null ? null : round(v / s)]),
    ) as unknown as NutritionTotals;

    return {
      servings: s,
      total: totals,
      per_serving: perServing,
      items,
      missing,
      sources: [...new Set(items.map((i) => i.source))],
    };
  }
}

/**
 * 하루 권장 열량 (WSAVA 지침의 RER × 생애단계 계수). 앱(src/utils/nutritionCalculator.ts)과 같은 공식.
 * 수의사 처방을 대신하지 않는 대략값이다.
 */
export function dailyNeeds(weightKg: number, isNeutered: boolean, ageYears: number, activity: 'low' | 'moderate' | 'high' = 'moderate') {
  if (!weightKg || weightKg <= 0) return null;
  const rer = 70 * Math.pow(weightKg, 0.75);
  let factor = isNeutered ? 1.6 : 1.8;
  let stage: 'puppy' | 'adult' | 'senior' = 'adult';
  if (ageYears < 1) {
    factor = 3.0;
    stage = 'puppy';
  } else if (ageYears > 7) {
    factor = 1.4;
    stage = 'senior';
  }
  if (activity === 'low') factor -= 0.2;
  if (activity === 'high') factor += 0.4;
  const der = Math.round(rer * factor);
  return {
    life_stage: stage,
    rer: Math.round(rer),
    factor: Math.round(factor * 10) / 10,
    daily_calories: der,
    water_ml: der, // 1kcal 당 약 1ml
    protein_g: { min: Math.round((der / 100) * 4.5), max: Math.round((der / 100) * 6.0) },
  };
}
