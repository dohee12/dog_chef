import type { Context } from "hono";
import type { ZodTypeAny, z } from "zod";

// 라우트에서 던지면 onError가 상태 코드와 함께 응답합니다.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function parseBody<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .join(", ");
    throw new HttpError(400, `입력값이 올바르지 않습니다 (${detail})`);
  }
  return result.data;
}

export async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new HttpError(400, "JSON 본문이 필요합니다.");
  }
}

// 우리 DB의 uuid 형식 검사. 잘못된 형식이 DB 오류(500)로 번지지 않게 막습니다.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function assertUuid(value: string, label = "항목"): string {
  if (!UUID_RE.test(value)) throw new HttpError(404, `${label}를 찾을 수 없습니다.`);
  return value;
}
