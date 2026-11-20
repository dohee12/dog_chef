import { Injectable, Logger } from '@nestjs/common';
import type { Per100g } from './builtin-foods';

/**
 * 식품의약품안전처 식품영양성분DB 정보 (공공데이터포털 data.go.kr) 호출.
 *
 * - 키: data.go.kr 에서 활용 신청 후 받은 "일반 인증키 (Decoding)" 를 MFDS_API_KEY 에 넣는다.
 *   Encoding 키를 넣으면 URL 인코딩이 두 번 되어 403 이 난다.
 * - 주소: 기본은 FoodNtrCpntDbInfo02. 키에 따라 03 만 열리는 경우가 있어 MFDS_API_URL 로 바꿀 수 있다.
 *   예) https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo03/getFoodNtrCpntDbInq03
 * - 응답 필드: AMT_NUM1 에너지(kcal), 3 단백질, 4 지방, 6 탄수화물, 8 식이섬유, 9 칼슘(mg), 11 인(mg), 13 나트륨(mg).
 *   값은 SERVING_SIZE(영양성분 기준량, 보통 "100g") 기준이며 "1,010.000" 처럼 천 단위 쉼표가 들어 있다.
 */
export interface MfdsFood {
  food_code: string | null;
  name: string;
  group: string | null; // 예: 농축산물, 가공식품, 음식
  category: string | null;
  basis: string | null; // 원래 기준량 문자열 (예: 100g)
  per100g: Per100g;
}

const DEFAULT_URL = 'https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02';

/** "1,010.000" → 1010, 빈 값·"-" → null */
export function toNumber(raw: unknown): number | null {
  const text = String(raw ?? '').replace(/,/g, '').trim();
  if (!text || text === '-') return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** "100g", "100 mL", "250g" → 100 기준으로 바꿀 배수. 모르면 null */
export function basisFactor(basis: unknown): number | null {
  const text = String(basis ?? '').trim();
  if (!text) return 1; // 기준량이 비어 있으면 100g 기준으로 본다 (식품영양성분DB 기본값)
  const m = text.replace(/,/g, '').match(/^(\d+(?:\.\d+)?)\s*(g|ml|mL|ML)$/);
  if (!m) return null;
  const amount = Number(m[1]);
  return amount > 0 ? 100 / amount : null;
}

export function rowToFood(row: Record<string, unknown>): MfdsFood | null {
  const name = String(row.FOOD_NM_KR ?? '').trim();
  const factor = basisFactor(row.SERVING_SIZE);
  const kcal = toNumber(row.AMT_NUM1);
  if (!name || factor === null || kcal === null) return null;

  const scaled = (key: string) => {
    const v = toNumber(row[key]);
    return v === null ? null : Math.round(v * factor * 100) / 100;
  };
  return {
    food_code: row.FOOD_CD ? String(row.FOOD_CD) : null,
    name,
    group: row.DB_GRP_NM ? String(row.DB_GRP_NM) : null,
    category: row.FOOD_CAT1_NM ? String(row.FOOD_CAT1_NM) : null,
    basis: row.SERVING_SIZE ? String(row.SERVING_SIZE) : null,
    per100g: {
      calories: scaled('AMT_NUM1') ?? 0,
      protein: scaled('AMT_NUM3') ?? 0,
      fat: scaled('AMT_NUM4') ?? 0,
      carbs: scaled('AMT_NUM6') ?? 0,
      fiber: scaled('AMT_NUM8') ?? 0,
      calcium: scaled('AMT_NUM9'),
      phosphorus: scaled('AMT_NUM11'),
      sodium: scaled('AMT_NUM13'),
    },
  };
}

@Injectable()
export class MfdsClient {
  private readonly logger = new Logger('MFDS');

  get enabled() {
    return !!process.env.MFDS_API_KEY;
  }

  /** 식품 이름으로 찾는다. 키가 없거나 호출이 실패하면 빈 배열 (앱은 내장 값으로 계속 동작). */
  async search(name: string, rows = 30): Promise<MfdsFood[]> {
    const key = process.env.MFDS_API_KEY;
    if (!key || !name.trim()) return [];

    const url = new URL(process.env.MFDS_API_URL || DEFAULT_URL);
    url.search = new URLSearchParams({
      serviceKey: key,
      type: 'json',
      pageNo: '1',
      numOfRows: String(rows),
      FOOD_NM_KR: name.trim(),
    }).toString();

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      if (!res.ok) {
        this.logger.warn(`HTTP ${res.status} (${name}): ${text.slice(0, 120)}`);
        return [];
      }
      const data = JSON.parse(text) as {
        header?: { resultCode?: string; resultMsg?: string };
        body?: { items?: unknown };
      };
      if (data.header?.resultCode && data.header.resultCode !== '00') {
        this.logger.warn(`결과 코드 ${data.header.resultCode} ${data.header.resultMsg ?? ''}`);
        return [];
      }
      const items = data.body?.items;
      const list = Array.isArray(items) ? items : items ? [items] : [];
      return list
        .map((r) => rowToFood(r as Record<string, unknown>))
        .filter((f): f is MfdsFood => f !== null);
    } catch (error) {
      // 키가 틀리면 XML 오류 문서가 와서 JSON.parse 가 실패하기도 한다
      this.logger.warn(`호출 실패 (${name}): ${(error as Error).message}`);
      return [];
    }
  }
}

/**
 * 검색 결과에서 레시피 재료로 가장 그럴듯한 하나를 고른다.
 * 이름이 정확히 같으면 최우선, 그다음 이름으로 시작하는 것. 가공식품·외식보다 원재료(농축산물 등)를,
 * 조리한 것보다 "생것"을, 이름이 짧은 것을 앞에 둔다.
 */
export function pickBest(query: string, foods: MfdsFood[]): MfdsFood | null {
  const q = query.replace(/\s+/g, '');
  const score = (f: MfdsFood) => {
    const n = f.name.replace(/\s+/g, '');
    const head = n.split(/[_(,]/)[0];
    let s = 0;
    if (n === q || head === q) s += 100;
    else if (n.startsWith(q)) s += 50;
    else if (n.includes(q)) s += 20;
    else return -1;
    if (f.group && !/가공|외식|음식/.test(f.group)) s += 15;
    if (/생것|생\b/.test(n)) s += 10;
    s -= Math.min(n.length, 30) / 3;
    return s;
  };
  let best: MfdsFood | null = null;
  let bestScore = -1;
  for (const f of foods) {
    const s = score(f);
    if (s > bestScore) {
      best = f;
      bestScore = s;
    }
  }
  return bestScore >= 0 ? best : null;
}
