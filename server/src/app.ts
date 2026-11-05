import { Hono } from "hono";
import { aiEnabled, AiDisabledError, UpstreamAiError } from "./ai.js";
import { HttpError } from "./http.js";
import { aiRoutes } from "./routes/ai.js";
import { authRoutes } from "./routes/auth.js";
import { petRoutes } from "./routes/pets.js";
import { favoriteListRoute, recipeRoutes } from "./routes/recipes.js";

export function createApp() {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true, ai: aiEnabled() }));

  app.route("/api/auth", authRoutes);
  app.route("/api/pets", petRoutes);
  app.route("/api/recipes", recipeRoutes);
  app.route("/api/me/favorites", favoriteListRoute);
  app.route("/api/ai", aiRoutes);

  app.notFound((c) => c.json({ error: "경로를 찾을 수 없습니다." }, 404));

  app.onError((err, c) => {
    if (err instanceof HttpError) {
      return c.json({ error: err.message }, err.status as 400);
    }
    if (err instanceof AiDisabledError) {
      return c.json({ error: err.message }, 503);
    }
    if (err instanceof UpstreamAiError) {
      console.error(err.message);
      return c.json({ error: "AI 서비스 응답에 실패했어요. 잠시 후 다시 시도해 주세요." }, 502);
    }
    console.error(err);
    return c.json({ error: "서버 내부 오류가 발생했습니다." }, 500);
  });

  return app;
}
