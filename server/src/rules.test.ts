import { describe, expect, it } from "vitest";
import { evaluateRecipeSafety } from "./rules.js";

describe("evaluateRecipeSafety", () => {
  it("독성 식재료(포도)를 danger로 판정한다", () => {
    const r = evaluateRecipeSafety(["닭가슴살", "건포도"]);
    expect(r.status).toBe("danger");
    expect(r.toxic[0].keyword).toBe("건포도");
  });

  it("양파, 초콜릿도 독성으로 잡는다", () => {
    expect(evaluateRecipeSafety(["양파 1개"]).status).toBe("danger");
    expect(evaluateRecipeSafety(["다크 초콜릿"]).status).toBe("danger");
  });

  it("'소금'은 소고기 알레르기로 오탐하지 않는다", () => {
    const r = evaluateRecipeSafety(["소금 한 꼬집", "고구마"], [{ name: "몽이", allergies: ["소고기"] }]);
    expect(r.status).toBe("safe");
  });

  it("'국수'는 밀 알레르기로 오탐하지 않는다", () => {
    const r = evaluateRecipeSafety(["국수 100g"], [{ name: "몽이", allergies: ["밀"] }]);
    expect(r.status).toBe("safe");
  });

  it("반려견 알레르기 재료는 warning으로 판정하고 반려견 이름을 알려준다", () => {
    const r = evaluateRecipeSafety(["닭가슴살 200g", "브로콜리"], [{ name: "몽이", allergies: ["닭고기"] }]);
    expect(r.status).toBe("warning");
    expect(r.allergic).toEqual([{ ingredient: "닭가슴살 200g", petName: "몽이", allergy: "닭고기" }]);
  });

  it("독성이 알레르기보다 우선한다", () => {
    const r = evaluateRecipeSafety(["닭고기", "포도"], [{ name: "몽이", allergies: ["닭고기"] }]);
    expect(r.status).toBe("danger");
  });

  it("문제가 없으면 safe", () => {
    expect(evaluateRecipeSafety(["고구마", "호박"]).status).toBe("safe");
  });
});
