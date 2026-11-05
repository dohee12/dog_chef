import { Hono } from "hono";
import { z } from "zod";
import { aiEnabled, callClaude } from "../ai.js";
import { requireAuth, type AuthEnv } from "../auth.js";
import { query } from "../db.js";
import { assertUuid, HttpError, parseBody, readJson } from "../http.js";
import { evaluateRecipeSafety, TOXIC_INGREDIENTS, type PetProfile } from "../rules.js";
import { extractJson } from "../json.js";
import { recipeSchema } from "./recipes.js";

export const aiRoutes = new Hono<AuthEnv>();
aiRoutes.use("*", requireAuth);

const TOXIC_LIST = TOXIC_INGREDIENTS.map((t) => t.keyword).join(", ");

interface PetRow extends PetProfile {
  age: number;
  weight: number;
  health_conditions: string[];
}

// 반려견 한 마리의 프로필을 사용자 소유인지 확인하며 가져옵니다.
async function loadPet(userId: string, petId: string | undefined): Promise<PetRow | null> {
  if (!petId) return null;
  assertUuid(petId, "반려견");
  const { rows } = await query<PetRow>(
    "select name, age, weight, allergies, health_conditions from pets where id = $1 and user_id = $2",
    [petId, userId],
  );
  if (!rows[0]) throw new HttpError(404, "반려견을 찾을 수 없습니다.");
  return rows[0];
}

const describePet = (pet: Awaited<ReturnType<typeof loadPet>>) =>
  pet
    ? `- 이름: ${pet.name}, 나이: ${pet.age}살, 체중: ${pet.weight}kg\n` +
      `- 알레르기: ${pet.allergies.join(", ") || "없음"}\n` +
      `- 건강 상태: ${pet.health_conditions.join(", ") || "없음"}`
    : "- 반려견 정보 없음 (일반 성견 기준)";

// ── 1. 레시피 초안 생성 ────────────────────────────────────
// AI가 만든 초안은 저장하지 않고 반환합니다. 저장은 POST /api/recipes로 따로 합니다.
// 생성 후 규칙 기반 안전 검사를 통과해야 응답하며, 실패하면 한 번 재시도합니다.

const generateSchema = z.object({
  petId: z.string().optional(),
  category: z.string().max(30).optional(),
  hint: z.string().max(200).optional(),
});

const SYSTEM_GENERATE = `당신은 반려견을 위한 홈메이드 간식·식사 레시피를 작성하는 도우미입니다.
규칙:
- 사람이 먹는 일반 식재료만 사용하세요.
- 다음 독성 식재료는 절대 쓰지 마세요: ${TOXIC_LIST}.
- 소금, 설탕, 간장, 양념, 향신료는 쓰지 마세요.
- 반려견 알레르기 식재료는 쓰지 마세요.
- 의학적 진단이나 치료 조언은 하지 마세요.
- 응답은 JSON 객체 하나만 출력하세요. 다른 설명은 붙이지 마세요.
JSON 스키마:
{"title": string, "description": string, "category": string, "cook_time": number(분),
 "servings": number, "difficulty": "쉬움"|"보통"|"어려움",
 "ingredients": string[], "instructions": string[], "tags": string[]}`;

aiRoutes.post("/recipes/generate", async (c) => {
  const body = parseBody(generateSchema, await readJson(c));
  const pet = await loadPet(c.get("userId"), body.petId);
  const petProfiles: PetProfile[] = pet ? [pet] : [];

  let feedback = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const user = [
      "[반려견 정보]",
      describePet(pet),
      `[요청 카테고리] ${body.category || "자유"}`,
      `[추가 요청] ${body.hint || "없음"}`,
      feedback && `[이전 응답의 문제] ${feedback} 이 부분을 고쳐서 다시 작성하세요.`,
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await callClaude(SYSTEM_GENERATE, user, 1500);
    let draft: z.infer<typeof recipeSchema>;
    try {
      draft = parseBody(recipeSchema, extractJson(raw));
    } catch (err) {
      feedback = err instanceof Error ? err.message : "JSON 형식 오류";
      continue;
    }

    const safety = evaluateRecipeSafety(draft.ingredients, petProfiles);
    const bad = [...safety.toxic.map((t) => t.ingredient), ...safety.allergic.map((a) => a.ingredient)];
    if (bad.length === 0) {
      return c.json({ draft: { ...draft, is_ai_generated: true }, safety });
    }
    feedback = `다음 재료는 사용할 수 없습니다: ${bad.join(", ")}`;
  }
  throw new HttpError(422, "안전 기준을 통과한 레시피를 만들지 못했어요. 요청을 바꿔 다시 시도해 주세요.");
});

// ── 2. 태그 자동 생성 ──────────────────────────────────────

const tagsSchema = z.object({
  title: z.string().min(1).max(100),
  ingredients: z.array(z.string()).min(1).max(50),
});

aiRoutes.post("/recipes/tags", async (c) => {
  const body = parseBody(tagsSchema, await readJson(c));
  const raw = await callClaude(
    "레시피 제목과 재료를 보고 검색에 쓸 짧은 한국어 태그를 3~5개 만드세요. " +
      'JSON 객체 하나만 출력: {"tags": string[]} (각 태그 2~6글자, 공백 없음)',
    `제목: ${body.title}\n재료: ${body.ingredients.join(", ")}`,
    200,
  );
  const parsed = z.object({ tags: z.array(z.string().max(20)).max(5) }).parse(extractJson(raw));
  return c.json({ tags: parsed.tags });
});

// ── 3. 안전성 설명 ─────────────────────────────────────────
// 판정(safe/warning/danger)은 규칙이 정하고, AI는 그 결과를 보호자에게 쉽게 설명만 합니다.
// AI 키가 없으면 규칙 결과만 반환합니다.

const explainSchema = z.object({
  ingredients: z.array(z.string()).min(1).max(50),
  petId: z.string().optional(),
});

aiRoutes.post("/safety/explain", async (c) => {
  const body = parseBody(explainSchema, await readJson(c));
  const pet = await loadPet(c.get("userId"), body.petId);
  const result = evaluateRecipeSafety(body.ingredients, pet ? [pet] : []);

  let explanation: string | null = null;
  if (aiEnabled() && result.status !== "safe") {
    explanation = await callClaude(
      "반려견 보호자에게 아래 판정 결과를 2~3문장의 친절한 한국어로 설명하세요. " +
        "판정 결과를 바꾸거나 치료 조언을 하지 마세요. 수의사 상담을 권하는 문장을 마지막에 넣으세요.",
      JSON.stringify(result),
      300,
    );
  }
  return c.json({ result, explanation });
});
