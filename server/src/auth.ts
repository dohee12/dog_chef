import bcrypt from "bcryptjs";
import type { MiddlewareHandler } from "hono";
import { jwtVerify, SignJWT } from "jose";
import { config } from "./config.js";

export type AuthEnv = { Variables: { userId: string } };

const secret = new TextEncoder().encode(config.jwtSecret);

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export function signToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

// Authorization 헤더의 토큰을 검증해 사용자 ID를 돌려줍니다. 없거나 잘못되면 null.
async function readUserId(authorization: string | undefined): Promise<string | null> {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

// 로그인 필수. 성공하면 c.get("userId")로 사용자 ID를 꺼낼 수 있습니다.
export const requireAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const userId = await readUserId(c.req.header("authorization"));
  if (!userId) return c.json({ error: "로그인이 필요하거나 토큰이 유효하지 않습니다." }, 401);
  c.set("userId", userId);
  await next();
};

// 로그인은 선택. 토큰이 유효하면 userId를 채우고, 없어도 그대로 통과합니다.
export const optionalAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const userId = await readUserId(c.req.header("authorization"));
  if (userId) c.set("userId", userId);
  await next();
};
