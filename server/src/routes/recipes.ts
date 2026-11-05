import { Hono } from "hono";
import { z } from "zod";
import { optionalAuth, requireAuth, type AuthEnv } from "../auth.js";
import { query } from "../db.js";
import { assertUuid, HttpError, parseBody, readJson } from "../http.js";
import { evaluateRecipeSafety, type PetProfile } from "../rules.js";

export const recipeRoutes = new Hono<AuthEnv>();

export const recipeSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).default(""),
  image: z.string().max(2000).default(""),
  category: z.string().max(30).default(""),
  cook_time: z.number().int().min(0).max(600).default(0),
  servings: z.number().int().min(1).max(20).default(1),
  difficulty: z.string().max(10).default(""),
  ingredients: z.array(z.string().min(1).max(100)).min(1).max(50),
  instructions: z.array(z.string().min(1).max(500)).min(1).max(30),
  tags: z.array(z.string().max(20)).max(10).default([]),
  nutrition: z.record(z.number()).default({}),
});

// 레시피 목록/상세 공통 SELECT. 평균 별점과 리뷰 수를 함께 계산합니다.
const RECIPE_SELECT = `
  select r.id, r.user_id, r.author, r.title, r.description, r.image, r.category,
         r.cook_time, r.servings, r.difficulty, r.ingredients, r.instructions, r.tags,
         r.nutrition, r.is_ai_generated, r.created_at,
         coalesce(avg(rv.rating), 0)::float8 as average_rating,
         count(rv.id)::int as reviews_count
  from recipes r
  left join reviews rv on rv.recipe_id = r.id`;

// 목록 조회: 카테고리, 검색어, 반려견 알레르기 필터를 지원합니다.
recipeRoutes.get("/", optionalAuth, async (c) => {
  const category = c.req.query("category") || null;
  const q = c.req.query("q")?.trim() || null;
  const petId = c.req.query("petId") || null;

  const { rows } = await query(
    `${RECIPE_SELECT}
     where ($1::text is null or r.category = $1)
       and ($2::text is null or r.title ilike '%' || $2 || '%'
            or r.description ilike '%' || $2 || '%')
     group by r.id
     order by r.created_at desc
     limit 100`,
    [category, q],
  );

  let pets: PetProfile[] = [];
  if (petId) {
    const userId = c.get("userId");
    if (!userId) throw new HttpError(401, "반려견 기준 필터는 로그인 후 사용할 수 있어요.");
    assertUuid(petId, "반려견");
    const owned = await query<PetProfile>(
      "select name, allergies from pets where id = $1 and user_id = $2",
      [petId, userId],
    );
    if (owned.rows.length === 0) throw new HttpError(404, "반려견을 찾을 수 없습니다.");
    pets = owned.rows;
  }

  // 반려견 알레르기 식재료가 들어간 레시피는 목록에서 제외합니다.
  const recipes = rows.filter(
    (r) => pets.length === 0 || evaluateRecipeSafety(r.ingredients, pets).allergic.length === 0,
  );
  return c.json({ recipes });
});

recipeRoutes.get("/:id", async (c) => {
  const id = assertUuid(c.req.param("id"));
  const { rows } = await query(`${RECIPE_SELECT} where r.id = $1 group by r.id`, [id]);
  if (!rows[0]) throw new HttpError(404, "레시피를 찾을 수 없습니다.");
  return c.json({ recipe: rows[0] });
});

recipeRoutes.post("/", requireAuth, async (c) => {
  const b = parseBody(recipeSchema, await readJson(c));
  // 독성 식재료가 있는 레시피는 저장을 거부합니다.
  const safety = evaluateRecipeSafety(b.ingredients);
  if (safety.toxic.length > 0) {
    throw new HttpError(422, `반려견에게 위험한 재료가 포함되어 있어요: ${safety.toxic.map((t) => t.ingredient).join(", ")}`);
  }

  const { rows: userRows } = await query<{ name: string }>("select name from users where id = $1", [
    c.get("userId"),
  ]);
  const { rows } = await query(
    `insert into recipes (user_id, author, title, description, image, category, cook_time,
                          servings, difficulty, ingredients, instructions, tags, nutrition)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     returning id`,
    [
      c.get("userId"), userRows[0]?.name ?? "", b.title, b.description, b.image, b.category,
      b.cook_time, b.servings, b.difficulty, b.ingredients, b.instructions, b.tags, b.nutrition,
    ],
  );
  return c.json({ recipe: { id: rows[0].id, safety } }, 201);
});

recipeRoutes.patch("/:id", requireAuth, async (c) => {
  const id = assertUuid(c.req.param("id"));
  const b = parseBody(recipeSchema.partial(), await readJson(c));
  if (b.ingredients && evaluateRecipeSafety(b.ingredients).toxic.length > 0) {
    throw new HttpError(422, "반려견에게 위험한 재료가 포함되어 있어요.");
  }
  const entries = Object.entries(b);
  if (entries.length === 0) throw new HttpError(400, "수정할 항목이 없습니다.");

  const sets = entries.map(([key], i) => `${key} = $${i + 3}`).join(", ");
  const { rowCount } = await query(
    `update recipes set ${sets} where id = $1 and user_id = $2`,
    [id, c.get("userId"), ...entries.map(([, v]) => v)],
  );
  if (!rowCount) throw new HttpError(404, "수정할 레시피를 찾을 수 없습니다.");
  return c.json({ ok: true });
});

recipeRoutes.delete("/:id", requireAuth, async (c) => {
  const id = assertUuid(c.req.param("id"));
  const { rowCount } = await query("delete from recipes where id = $1 and user_id = $2", [
    id,
    c.get("userId"),
  ]);
  if (!rowCount) throw new HttpError(404, "삭제할 레시피를 찾을 수 없습니다.");
  return c.body(null, 204);
});

// ── 즐겨찾기 ──────────────────────────────────────────────

recipeRoutes.post("/:id/favorite", requireAuth, async (c) => {
  const id = assertUuid(c.req.param("id"));
  await query(
    "insert into favorites (user_id, recipe_id) values ($1, $2) on conflict do nothing",
    [c.get("userId"), id],
  );
  return c.json({ favorited: true });
});

recipeRoutes.delete("/:id/favorite", requireAuth, async (c) => {
  const id = assertUuid(c.req.param("id"));
  await query("delete from favorites where user_id = $1 and recipe_id = $2", [c.get("userId"), id]);
  return c.json({ favorited: false });
});

export const favoriteListRoute = new Hono<AuthEnv>();
favoriteListRoute.get("/", requireAuth, async (c) => {
  const { rows } = await query(
    `${RECIPE_SELECT}
     join favorites f on f.recipe_id = r.id
     where f.user_id = $1
     group by r.id, f.created_at
     order by f.created_at desc`,
    [c.get("userId")],
  );
  return c.json({ recipes: rows });
});

// ── 리뷰 ──────────────────────────────────────────────────

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).default(""),
});

recipeRoutes.get("/:id/reviews", async (c) => {
  const id = assertUuid(c.req.param("id"));
  const { rows } = await query(
    `select rv.id, rv.rating, rv.comment, rv.created_at, rv.user_id,
            u.name as user_name
     from reviews rv join users u on u.id = rv.user_id
     where rv.recipe_id = $1
     order by rv.created_at desc
     limit 100`,
    [id],
  );
  return c.json({ reviews: rows });
});

// 같은 사용자가 다시 쓰면 기존 리뷰를 갱신합니다 (upsert).
recipeRoutes.post("/:id/reviews", requireAuth, async (c) => {
  const id = assertUuid(c.req.param("id"));
  const b = parseBody(reviewSchema, await readJson(c));
  const { rows } = await query(
    `insert into reviews (recipe_id, user_id, rating, comment) values ($1,$2,$3,$4)
     on conflict (recipe_id, user_id)
     do update set rating = excluded.rating, comment = excluded.comment, created_at = now()
     returning id, rating, comment, created_at`,
    [id, c.get("userId"), b.rating, b.comment],
  );
  return c.json({ review: rows[0] }, 201);
});
