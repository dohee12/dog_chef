// 예시 데이터 자동 입력 + 이미지 업로드 테스트. 실행: npm run test:e2e
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

const PORT = 4700 + Math.floor(Math.random() * 500);
const DB = `data/e2e-extra-${PORT}.sqlite`;
const UP = `data/e2e-uploads-${PORT}`;
const ORIGIN = `http://localhost:${PORT}`;
const BASE = `${ORIGIN}/api`;
let server;

before(async () => {
  server = spawn(process.execPath, ['dist/main.js'], {
    env: { ...process.env, PORT: String(PORT), SQLITE_PATH: DB, DATABASE_URL: '', JWT_SECRET: 'e2e-secret', SEED_SAMPLE_DATA: 'true', UPLOAD_DIR: UP, PUBLIC_URL: '' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/health`)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('서버가 뜨지 않았습니다.');
});

after(() => { server?.kill(); rmSync(DB, { force: true }); rmSync(UP, { recursive: true, force: true }); });

// 1x1 투명 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const upload = (bytes, type, token) => {
  const fd = new FormData();
  fd.append('file', new Blob([bytes], { type }), 'x.png');
  return fetch(`${BASE}/uploads`, { method: 'POST', body: fd, headers: token ? { authorization: 'Bearer ' + token } : {} });
};

test('빈 DB 면 예시 레시피 8개가 들어가고, 아무도 수정할 수 없다', async () => {
  const list = await (await fetch(`${BASE}/recipes`)).json();
  assert.equal(list.length, 8);
  assert.ok(list.every((r) => r.likes_count === 0 && r.reviews_count === 0 && r.safety_score > 0), '통계는 0, 안전 점수는 있음');
  const s = await (await fetch(`${BASE}/auth/signup`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: `s${Date.now()}@t.com`, password: 'secret12' }) })).json();
  const del = await fetch(`${BASE}/recipes/${list[0].id}`, { method: 'DELETE', headers: { authorization: 'Bearer ' + s.access_token } });
  assert.equal(del.status, 404, '예시 레시피 삭제 불가');
});

test('이미지 업로드: 로그인 필요, 진짜 이미지만, 올린 파일은 주소로 열린다', async () => {
  assert.equal((await upload(PNG, 'image/png')).status, 401, '비로그인 401');
  const s = await (await fetch(`${BASE}/auth/signup`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: `u${Date.now()}@t.com`, password: 'secret12' }) })).json();
  const T = s.access_token;

  const fake = await upload(Buffer.from('<html><script>alert(1)</script></html>'), 'image/png', T);
  assert.equal(fake.status, 400, '이미지로 위장한 HTML 400');

  const big = await upload(Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]), 'image/png', T);
  assert.equal(big.status, 413, '5MB 초과 413');

  const ok = await upload(PNG, 'image/png', T);
  assert.equal(ok.status, 201);
  const { url } = await ok.json();
  assert.match(url, new RegExp(`^${ORIGIN}/uploads/[0-9a-f-]{36}\.png$`));
  const img = await fetch(url);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/png');
  assert.equal(img.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(Buffer.from(await img.arrayBuffer()), PNG);
});
