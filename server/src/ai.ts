import { config } from "./config.js";

// AI 키가 없을 때 던지는 에러. onError에서 503으로 변환됩니다.
export class AiDisabledError extends Error {
  constructor() {
    super("AI 기능이 설정되지 않았습니다. (ANTHROPIC_API_KEY 없음)");
  }
}

// 외부 Claude API 호출 실패. onError에서 502로 변환됩니다.
export class UpstreamAiError extends Error {}

export const aiEnabled = () => Boolean(config.anthropicApiKey);

// Anthropic Messages API를 직접 호출합니다. SDK 없이 fetch만 사용합니다.
export async function callClaude(system: string, user: string, maxTokens = 1024): Promise<string> {
  if (!config.anthropicApiKey) throw new AiDisabledError();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new UpstreamAiError(`Claude API 호출 실패 (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  return data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("")
    .trim();
}

