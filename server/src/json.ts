// 모델 응답에서 첫 번째 JSON 객체를 꺼냅니다. (코드펜스가 붙어도 동작)
export function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI 응답에서 JSON을 찾지 못했습니다.");
  return JSON.parse(match[0]);
}
