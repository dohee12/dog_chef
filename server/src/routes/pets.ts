import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AuthEnv } from "../auth.js";
import { query } from "../db.js";
import { assertUuid, HttpError, parseBody, readJson } from "../http.js";

export const petRoutes = new Hono<AuthEnv>();
petRoutes.use("*", requireAuth);

const petSchema = z.object({
  name: z.string().min(1).max(30),
  breed: z.string().max(50).default(""),
  age: z.number().int().min(0).max(40).default(0),
  weight: z.number().min(0).max(200).default(0),
  gender: z.string().max(10).default(""),
  is_neutered: z.boolean().default(false),
  image: z.string().max(2000).nullish(),
  allergies: z.array(z.string().max(30)).max(20).default([]),
  health_conditions: z.array(z.string().max(50)).max(20).default([]),
  birth_date: z.string().date().nullish(),
});

const PET_COLUMNS = `id, user_id, name, breed, age, weight, gender, is_neutered, image,
  allergies, health_conditions, birth_date`;

petRoutes.get("/", async (c) => {
  const { rows } = await query(
    `select ${PET_COLUMNS} from pets where user_id = $1 order by created_at`,
    [c.get("userId")],
  );
  return c.json({ pets: rows });
});

petRoutes.post("/", async (c) => {
  const b = parseBody(petSchema, await readJson(c));
  const { rows } = await query(
    `insert into pets (user_id, name, breed, age, weight, gender, is_neutered, image,
                       allergies, health_conditions, birth_date)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     returning ${PET_COLUMNS}`,
    [
      c.get("userId"), b.name, b.breed, b.age, b.weight, b.gender, b.is_neutered,
      b.image ?? null, b.allergies, b.health_conditions, b.birth_date ?? null,
    ],
  );
  return c.json({ pet: rows[0] }, 201);
});

petRoutes.patch("/:id", async (c) => {
  const id = assertUuid(c.req.param("id"), "반려견");
  const b = parseBody(petSchema.partial(), await readJson(c));
  const entries = Object.entries(b);
  if (entries.length === 0) throw new HttpError(400, "수정할 항목이 없습니다.");

  // 컬럼명은 위 스키마의 고정 키만 들어오므로 SQL 식별자로 안전합니다.
  const sets = entries.map(([key], i) => `${key} = $${i + 3}`).join(", ");
  const values = entries.map(([, v]) => v);
  const { rows } = await query(
    `update pets set ${sets} where id = $1 and user_id = $2 returning ${PET_COLUMNS}`,
    [id, c.get("userId"), ...values],
  );
  if (!rows[0]) throw new HttpError(404, "반려견을 찾을 수 없습니다.");
  return c.json({ pet: rows[0] });
});

petRoutes.delete("/:id", async (c) => {
  const id = assertUuid(c.req.param("id"), "반려견");
  const { rowCount } = await query("delete from pets where id = $1 and user_id = $2", [
    id,
    c.get("userId"),
  ]);
  if (!rowCount) throw new HttpError(404, "반려견을 찾을 수 없습니다.");
  return c.body(null, 204);
});
