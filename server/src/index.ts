import { serve } from "@hono/node-server";
import { aiEnabled } from "./ai.js";
import { config } from "./config.js";
import { createApp } from "./app.js";

const app = createApp();

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`멍슐랭 API 서버: http://localhost:${info.port}`);
  console.log(`AI 기능: ${aiEnabled() ? `사용 가능 (${config.aiModel})` : "비활성 (ANTHROPIC_API_KEY 없음)"}`);
});
