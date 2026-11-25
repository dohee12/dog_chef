// 비밀번호 규칙 (가입·재설정·변경 공통). 근거:
// - 8자 이상: Supabase 문서 "8자 미만은 권장하지 않음" https://supabase.com/docs/guides/auth/password-security
// - 72자 이하: Supabase Auth 는 bcrypt 로 저장하고, bcrypt 는 72바이트까지만 쓴다 (한글 등은 글자당 여러 바이트라 바이트로 센다).
// - 영문·숫자 각 1개 이상: 주인 결정 (2026-11-25).
export const PW_MIN = 8;
export const PW_MAX_BYTES = 72;

const byteLen = (s: string) => new TextEncoder().encode(s).length;

export type PwRule = { key: "len" | "letter" | "digit"; label: string; ok: boolean };

export function passwordRules(pw: string): PwRule[] {
  const n = byteLen(pw);
  return [
    { key: "len", label: `${PW_MIN}자 이상 ${PW_MAX_BYTES}자 이하`, ok: pw.length >= PW_MIN && n <= PW_MAX_BYTES },
    { key: "letter", label: "영문 1개 이상", ok: /[A-Za-z]/.test(pw) },
    { key: "digit", label: "숫자 1개 이상", ok: /[0-9]/.test(pw) },
  ];
}

/** 규칙에 안 맞으면 한국어 문구, 맞으면 "". 문구에 비밀번호 값은 넣지 않는다. */
export function passwordError(pw: string): string {
  if (!pw) return "비밀번호를 넣어 주세요.";
  if (pw.length < PW_MIN) return `비밀번호는 ${PW_MIN}자 이상으로 넣어 주세요.`;
  if (byteLen(pw) > PW_MAX_BYTES) return `비밀번호가 너무 길어요. ${PW_MAX_BYTES}자 이하로 줄여 주세요. (한글은 1자가 3자로 세어져요)`;
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "비밀번호에 영문과 숫자를 1개 이상씩 넣어 주세요.";
  return "";
}

export const PW_RULE_TEXT = `${PW_MIN}~${PW_MAX_BYTES}자, 영문과 숫자를 1개 이상씩`;
