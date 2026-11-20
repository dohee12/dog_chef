// 영양·안전·검색·추천·프로필·탈퇴 테스트. 식약처 API 는 가짜 서버로 대신한다. 실행: npm run test:e2e
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

const PORT = 5300 + Math.floor(Math.random() * 400);
const MOCK_PORT = PORT + 500;
const DB = `data/e2e-features-${PORT}.sqlite`;
const BASE = `http://localhost:${PORT}/api`;
let server;
let mock;
const mockCalls = [];

// 식약처 응답 모양: header.resultCode, body.items 배열, 값은 문자열이고 천 단위 쉼표가 있다.
const MFDS_ROWS = {
  닭가슴살: [
    { FOOD_CD: 'P1', FOOD_NM_KR: '닭가슴살 훈제 볶음밥', DB_GRP_NM: '가공식품', SERVING_SIZE: '100g', AMT_NUM1: '180', AMT_NUM3: '9', AMT_NUM4: '5', AMT_NUM6: '25', AMT_NUM8: '1' },
    { FOOD_CD: 'R1', FOOD_NM_KR: '닭가슴살', DB_GRP_NM: '농축산물', SERVING_SIZE: '100g', AMT_NUM1: '106', AMT_NUM3: '23', AMT_NUM4: '1', AMT_NUM6: '0', AMT_NUM8: '0', AMT_NUM9: '4', AMT_NUM11: '210', AMT_NUM13: '50' },
  ],
  참기름: [
    { FOOD_CD: 'R2', FOOD_NM_KR: '참기름', DB_GRP_NM: '농축산물', SERVING_SIZE: '100g', AMT_NUM1: '1,010.000', AMT_NUM3: '0', AMT_NUM4: '99', AMT_NUM6: '0', AMT_NUM8: '' },
  ],
  고구마: [
    // 200g 기준 데이터 → 100g 기준으로 절반이 되어야 한다
    { FOOD_CD: 'R3', FOOD_NM_KR: '고구마_생것', DB_GRP_NM: '농축산물', SERVING_SIZE: '200g', AMT_NUM1: '260', AMT_NUM3: '2.8', AMT_NUM4: '0.4', AMT_NUM6: '62', AMT_NUM8: '5' },
  ],
};

before(async () => {
  mock = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    mockCalls.push(Object.fromEntries(url.searchParams));
    const rows = MFDS_ROWS[url.searchParams.get('FOOD_NM_KR')] ?? [];
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' }, body: { totalCount: rows.length, items: rows } }));
  });
  await new Promise((r) => mock.listen(MOCK_PORT, r));

  server = spawn(process.execPath, ['dist/main.js'], {
    env: {
      ...process.env, PORT: String(PORT), SQLITE_PATH: DB, DATABASE_URL: '', JWT_SECRET: 'e2e-secret',
      SEED_SAMPLE_DATA: 'true', AUTH_RATE_LIMIT: '1000',
      MFDS_API_KEY: 'test-key', MFDS_API_URL: `http://localhost:${MOCK_PORT}/getFoodNtrCpntDbInq02`,
    },
    stdio: 'ignore',
  });
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(`${BASE}/health`)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('서버가 뜨지 않았습니다. 먼저 npm run build 를 했는지 확인하세요.');
});

after(() => { server?.kill(); mock?.close(); rmSync(DB, { force: true }); });

async function call(method, path, body, token) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { s: r.status, j };
}

const signup = async (name) => {
  const r = await call('POST', '/auth/signup', { email: `${name}${Date.now()}@t.com`, password: 'secret12' });
  return { token: r.j.access_token, user: r.j.user };
};

test('식약처 값으로 영양 계산: 원재료 우선, 쉼표 숫자, 기준량 환산, 캐시', async () => {
  const st = await call('GET', '/nutrition/status');
  assert.equal(st.j.mfds_enabled, true);

  const r = await call('POST', '/nutrition/calculate', {
    ingredients: ['닭가슴살 200g', '참기름 1작은술', '고구마 100g', '바나나 1개', '이름모를재료 10g'],
    servings: 2,
  });
  assert.equal(r.s, 200, JSON.stringify(r.j));
  const chicken = r.j.items.find((i) => i.input.startsWith('닭가슴살'));
  assert.equal(chicken.matched_name, '닭가슴살', '가공식품이 아니라 원재료를 골라야 함');
  assert.equal(chicken.source, 'mfds');
  assert.equal(chicken.calories, 212);
  const oil = r.j.items.find((i) => i.input.startsWith('참기름'));
  assert.equal(oil.calories, 50.5, '"1,010.000" 은 1010 이어야 함 (5g)');
  const potato = r.j.items.find((i) => i.input.startsWith('고구마'));
  assert.equal(potato.calories, 130, '200g 기준 260kcal → 100g 130kcal');
  assert.deepEqual(r.j.missing.map((m) => m.input).sort(), ['바나나 1개', '이름모를재료 10g'].sort());
  assert.equal(r.j.total.calories, 392.5);
  assert.equal(r.j.per_serving.calories, 196.3);
  assert.equal(r.j.total.calcium, null, '무기질 값이 없는 재료가 섞이면 합계는 null');

  // 같은 재료를 다시 계산하면 식약처를 다시 부르지 않는다 (DB 캐시)
  const before = mockCalls.filter((c) => c.FOOD_NM_KR === '닭가슴살').length;
  await call('POST', '/nutrition/calculate', { ingredients: ['닭가슴살 100g'] });
  assert.equal(mockCalls.filter((c) => c.FOOD_NM_KR === '닭가슴살').length, before);
  assert.ok(mockCalls.every((c) => c.serviceKey === 'test-key' && c.type === 'json'));

  const one = await call('POST', '/nutrition/calculate', { ingredients: ['닭가슴살 100g'] });
  assert.deepEqual(
    { ca: one.j.total.calcium, p: one.j.total.phosphorus, na: one.j.total.sodium },
    { ca: 4, p: 210, na: 50 },
  );
});

test('식약처에 없으면 내장 값으로, 재료 검색은 둘 다', async () => {
  const r = await call('POST', '/nutrition/calculate', { ingredients: ['생연어 100g', '단호박 1/2컵'] });
  const salmon = r.j.items.find((i) => i.input.startsWith('생연어'));
  assert.deepEqual([salmon.matched_name, salmon.source, salmon.calories], ['연어', 'builtin', 208]);
  const pumpkin = r.j.items.find((i) => i.input.startsWith('단호박'));
  assert.deepEqual([pumpkin.matched_name, pumpkin.grams], ['호박', 100]);

  const s = await call('GET', '/ingredients/search?q=' + encodeURIComponent('닭가슴살'));
  assert.equal(s.s, 200);
  assert.ok(s.j.some((x) => x.source === 'mfds') && s.j.some((x) => x.source === 'builtin'));
  assert.equal((await call('GET', '/ingredients/search?q=')).s, 400);
});

test('재료 안전성 판정과 하루 권장 열량', async () => {
  const r = await call('POST', '/ingredients/safety', { ingredients: ['닭가슴살 100g', '양파 10g', '소금 약간', '파프리카 20g'] });
  assert.equal(r.j.level, 'danger');
  assert.deepEqual(r.j.hits.map((h) => h.label), ['양파', '소금·짠 양념']);

  const n = await call('GET', '/nutrition/daily-needs?weight=10&age=3&neutered=true');
  // 70 × 10^0.75 = 393.6..., × 1.6 = 630
  assert.deepEqual([n.j.rer, n.j.daily_calories, n.j.life_stage], [394, 630, 'adult']);
  assert.equal((await call('GET', '/nutrition/daily-needs?weight=-1')).s, 400);
});

test('레시피: 서버가 안전 등급·영양을 채우고, 검색·필터·분석·추천이 동작', async () => {
  const { token: A } = await signup('chef');

  const danger = await call('POST', '/recipes', { title: '양파 볶음', ingredients: ['양파 50g', '닭가슴살 100g'], category: '주식', safety_level: 'safe' }, A);
  assert.equal(danger.s, 201);
  assert.equal(danger.j.safety_level, 'danger', '클라이언트가 보낸 safety_level 은 무시');

  const auto = await call('POST', '/recipes', { title: '닭고구마 죽', ingredients: ['닭가슴살 100g', '고구마 100g'], servings: 2, category: '주식', tags: ['저지방'], cook_time: 15 }, A);
  assert.deepEqual([auto.j.calories, auto.j.protein, auto.j.nutrition_auto], [118, 12.2, true]);

  const manual = await call('POST', '/recipes', { title: '직접 입력', ingredients: ['닭가슴살 100g'], calories: 999 }, A);
  assert.deepEqual([manual.j.calories, manual.j.nutrition_auto], [999, false]);

  // 재료를 바꾸면 자동 계산한 값은 다시 계산, 직접 넣은 값은 그대로
  const up = await call('PATCH', `/recipes/${auto.j.id}`, { ingredients: ['닭가슴살 200g', '고구마 100g'] }, A);
  assert.equal(up.j.calories, 171);
  const up2 = await call('PATCH', `/recipes/${manual.j.id}`, { ingredients: ['닭가슴살 300g'] }, A);
  assert.equal(up2.j.calories, 999);

  const q = await call('GET', '/recipes?q=' + encodeURIComponent('고구마'));
  assert.ok(q.j.some((r) => r.id === auto.j.id) && q.j.every((r) => JSON.stringify(r).includes('고구마')));
  const safe = await call('GET', '/recipes?safe_only=true&limit=100');
  assert.ok(!safe.j.some((r) => r.id === danger.j.id));
  const noChicken = await call('GET', '/recipes?exclude_allergens=' + encodeURIComponent('닭고기') + '&limit=100');
  assert.ok(noChicken.j.length > 0 && !noChicken.j.some((r) => r.ingredients.some((i) => i.includes('닭'))));
  const tagged = await call('GET', '/recipes?tag=' + encodeURIComponent('저지방'));
  assert.deepEqual(tagged.j.map((r) => r.id), [auto.j.id]);
  const page2 = await call('GET', '/recipes?limit=2&page=2');
  assert.equal(page2.j.length, 2);
  const byCal = await call('GET', '/recipes?sort=calories&limit=100');
  const cals = byCal.j.map((r) => r.calories).filter((c) => c !== null);
  assert.deepEqual(cals, [...cals].sort((a, b) => a - b));
  assert.equal((await call('GET', '/recipes?sort=nope')).s, 400);

  const facets = await call('GET', '/recipes/facets');
  assert.ok(facets.j.categories.find((c) => c.name === '주식').count >= 2);

  // 반려견 기준 분석·추천
  const pet = await call('POST', '/pets', { name: '보리', weight: 10, age: 3, is_neutered: true, allergies: ['닭고기'] }, A);
  const an = await call('GET', `/recipes/${auto.j.id}/analysis`, null, A);
  assert.equal(an.s, 200);
  assert.equal(an.j.safety.level, 'safe');
  assert.equal(an.j.pets[0].name, '보리');
  assert.equal(an.j.pets[0].ok, false, '닭고기 알레르기');
  assert.equal(an.j.pets[0].allergens[0].allergy, '닭고기');
  assert.equal(an.j.pets[0].calorie_share, 27.1); // 171 / 630
  const anon = await call('GET', `/recipes/${auto.j.id}/analysis`);
  assert.deepEqual(anon.j.pets, [], '로그인 안 하면 반려견 정보 없음');

  const mine = await call('GET', `/recipes?pet_id=${pet.j.id}&limit=100`, null, A);
  assert.ok(!mine.j.some((r) => r.ingredients.some((i) => i.includes('닭'))));

  const needs = await call('GET', `/pets/${pet.j.id}/needs`, null, A);
  assert.equal(needs.j.needs.daily_calories, 630);
  const rec = await call('GET', `/pets/${pet.j.id}/recommendations?limit=50`, null, A);
  assert.ok(rec.j.length > 0);
  assert.ok(rec.j.every((r) => r.safety_level !== 'danger' && !r.ingredients.some((i) => i.includes('닭'))));

  const { token: B } = await signup('other');
  assert.equal((await call('GET', `/pets/${pet.j.id}/needs`, null, B)).s, 404, '남의 반려견');
});

test('프로필·닉네임·비밀번호 변경·내 목록', async () => {
  const { token: A, user } = await signup('prof');
  const p = await call('GET', '/users/me', null, A);
  assert.deepEqual([p.j.email, p.j.nickname, p.j.stats.recipes], [user.email, null, 0]);

  assert.equal((await call('PATCH', '/users/me', { nickname: 'a' }, A)).s, 400);
  const nn = await call('PATCH', '/users/me', { nickname: '초코맘' }, A);
  assert.equal(nn.j.nickname, '초코맘');
  const { token: B } = await signup('prof2');
  assert.equal((await call('PATCH', '/users/me', { nickname: '초코맘' }, B)).s, 409, '닉네임 중복');

  const r = await call('POST', '/recipes', { title: '내 레시피', ingredients: ['당근 10g'] }, A);
  await call('POST', `/recipes/${r.j.id}/reviews`, { rating: 5, comment: '좋아요' }, B);
  const reviews = await call('GET', `/recipes/${r.j.id}/reviews`);
  assert.ok(reviews.j[0].user_name.endsWith('***'), '닉네임 없으면 가린 이메일');
  await call('POST', `/recipes/${r.j.id}/reviews`, { rating: 4 }, A);
  const reviews2 = await call('GET', `/recipes/${r.j.id}/reviews`);
  assert.ok(reviews2.j.some((x) => x.user_name === '초코맘'));

  await call('POST', `/recipes/${r.j.id}/like`, null, B);
  assert.deepEqual((await call('GET', '/users/me/likes', null, B)).j.map((x) => x.id), [r.j.id]);
  assert.deepEqual((await call('GET', '/users/me/recipes', null, A)).j.map((x) => x.id), [r.j.id]);
  const myReviews = await call('GET', '/users/me/reviews', null, B);
  assert.equal(myReviews.j[0].recipe_title, '내 레시피');

  assert.equal((await call('PATCH', '/users/me/password', { current_password: 'wrong123', new_password: 'newpass12' }, A)).s, 400);
  assert.equal((await call('PATCH', '/users/me/password', { current_password: 'secret12', new_password: 'newpass12' }, A)).s, 200);
  assert.equal((await call('POST', '/auth/login', { email: user.email, password: 'secret12' })).s, 401);
  assert.equal((await call('POST', '/auth/login', { email: user.email, password: 'newpass12' })).s, 200);
});

test('회원 탈퇴: 비밀번호 확인, 내 데이터 삭제, 남의 레시피 찜·평점 다시 계산', async () => {
  const { token: A } = await signup('owner');
  const { token: B, user: bUser } = await signup('leaver');
  const r = await call('POST', '/recipes', { title: '남는 레시피', ingredients: ['당근 10g'] }, A);
  const own = await call('POST', '/recipes', { title: '지워질 레시피', ingredients: ['당근 10g'] }, B);
  await call('POST', `/recipes/${r.j.id}/like`, null, B);
  await call('POST', `/recipes/${r.j.id}/reviews`, { rating: 1 }, B);
  await call('POST', `/recipes/${r.j.id}/reviews`, { rating: 5 }, A);
  await call('POST', '/pets', { name: '탈퇴견' }, B);
  let rr = await call('GET', `/recipes/${r.j.id}`);
  assert.deepEqual([rr.j.likes_count, rr.j.reviews_count, rr.j.average_rating], [1, 2, 3]);

  assert.equal((await call('DELETE', '/users/me', { password: 'wrongpw1' }, B)).s, 400);
  assert.equal((await call('DELETE', '/users/me', { password: 'secret12' }, B)).s, 204);

  rr = await call('GET', `/recipes/${r.j.id}`);
  assert.deepEqual([rr.j.likes_count, rr.j.reviews_count, rr.j.average_rating], [0, 1, 5]);
  assert.equal((await call('GET', `/recipes/${own.j.id}`)).s, 404);
  assert.equal((await call('GET', '/users/me', null, B)).s, 401, '탈퇴한 계정 토큰은 못 씀');
  assert.equal((await call('POST', '/auth/login', { email: bUser.email, password: 'secret12' })).s, 401);
});
