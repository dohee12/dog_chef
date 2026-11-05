import { Hono } from "hono";
import { z } from "zod";
import { hashPassword, requireAuth, signToken, verifyPassword, type AuthEnv } from "../auth.js";
import { query } from "../db.js";
import { HttpError, parseBody, readJson } from "../http.js";

export const authRoutes = new Hono<AuthEnv>();

const signupSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(72),
  name: z.string().min(1).max(30),
});

const loginSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1),
});

interface UserRow {
  id: string;
  email: string;
  name: string;
}

authRoutes.post("/signup", async (c) => {
  const body = parseBody(signupSchema, await readJson(c));
  const passwordHash = await hashPassword(body.password);

  const { rows } = await query<UserRow>(
    `insert into users (email, password_hash, name) values ($1, $2, $3)
     on conflict (email) do nothing
     returning id, email, name`,
    [body.email, passwordHash, body.name],
  );
  if (rows.length === 0) throw new HttpError(409, "이미 가입된 이메일입니다.");

  const user = rows[0];
  return c.json({ token: await signToken(user.id), user }, 201);
});

authRoutes.post("/login", async (c) => {
  const body = parseBody(loginSchema, await readJson(c));
  const { rows } = await query<UserRow & { password_hash: string }>(
    "select id, email, name, password_hash from users where email = $1",
    [body.email],
  );
  const row = rows[0];
  // 이메일 존재 여부를 드러내지 않도록 같은 메시지를 씁니다.
  if (!row || !(await verifyPassword(body.password, row.password_hash))) {
    throw new HttpError(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
  }
  const { password_hash: _omit, ...user } = row;
  return c.json({ token: await signToken(user.id), user });
});

authRoutes.get("/me", requireAuth, async (c) => {
  const { rows } = await query<UserRow>("select id, email, name from users where id = $1", [
    c.get("userId"),
  ]);
  if (!rows[0]) throw new HttpError(404, "사용자를 찾을 수 없습니다.");
  return c.json({ user: rows[0] });
});
