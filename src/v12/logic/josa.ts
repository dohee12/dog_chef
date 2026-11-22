// 이름·품종처럼 바뀌는 낱말 뒤에 받침에 맞는 조사를 붙인다. 예: josa("토이푸들", "은/는") → "토이푸들은"
export type JosaPair = "은/는" | "이/가" | "을/를" | "과/와" | "이라/라" | "으로/로";

// 숫자·영문으로 끝날 때 읽는 소리의 받침 여부 (0 영, 1 일, 3 삼, 6 육, 7 칠, 8 팔 / l·m·n 등)
const DIGIT_BATCHIM: Record<string, boolean> = { "0": true, "1": true, "2": false, "3": true, "4": false, "5": false, "6": true, "7": true, "8": true, "9": false };
const LATIN_BATCHIM = /[lmnr]$/i;

function lastSound(word: string) {
  // 끝의 공백·닫는 괄호·문장부호는 건너뛴다: "콩(대두)" → "두"
  return word.replace(/[\s)\]}>"'.,!?·~-]+$/, "").slice(-1);
}

// 받침이 있으면 true. 판단이 안 되는 글자는 받침 없음으로 본다.
// rieulAsNone: "으로/로" 는 ㄹ 받침을 받침 없음처럼 쓴다 ("서울로").
export function hasBatchim(word: string, rieulAsNone = false) {
  const ch = lastSound(word);
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jong = (code - 0xac00) % 28;
    if (jong === 0) return false;
    return !(rieulAsNone && jong === 8);
  }
  if (ch in DIGIT_BATCHIM) return rieulAsNone && (ch === "1" || ch === "7" || ch === "8") ? false : DIGIT_BATCHIM[ch];
  if (LATIN_BATCHIM.test(ch)) return !(rieulAsNone && /[lr]/i.test(ch));
  // Poodle·Beagle 처럼 -le 로 끝나면 'ㄹ' 받침으로 읽는다
  if (/le$/i.test(word.replace(/[\s)\]}>"'.,!?·~-]+$/, ""))) return !rieulAsNone;
  return false;
}

export function josa(word: string, pair: JosaPair) {
  const [withB, withoutB] = pair.split("/");
  return word + (hasBatchim(word, pair === "으로/로") ? withB : withoutB);
}
