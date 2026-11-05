import { describe, expect, it } from "vitest";
import { extractJson } from "./json.js";

describe("extractJson", () => {
  it("코드펜스가 붙은 JSON도 파싱한다", () => {
    const raw = '```json\n{"tags": ["간식", "고구마"]}\n```';
    expect(extractJson(raw)).toEqual({ tags: ["간식", "고구마"] });
  });

  it("앞뒤에 설명 문장이 있어도 객체만 꺼낸다", () => {
    expect(extractJson('네, 여기 있어요: {"a": 1} 끝')).toEqual({ a: 1 });
  });

  it("JSON이 없으면 에러를 던진다", () => {
    expect(() => extractJson("죄송해요, 만들 수 없어요")).toThrow("JSON");
  });
});
