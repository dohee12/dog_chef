// API 전체 흐름 테스트. 빌드된 서버(dist)를 임시 DB 로 띄워서 실제 HTTP 로 확인한다.
// 실행: npm run test:e2e
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

const PORT = 4100 + Math.floor(Math.random() * 500);
const DB = `data/e2e-${PORT}.sqlite`;
const BASE = `http://localhost:${PORT}/api`;
let server;

before(async () => {
  server = spawn(process.execPath, ['dist/main.js'], {
    env: { ...process.env, PORT: String(PORT), SQLITE_PATH: DB, DATABASE_URL: '', JWT_SECRET: 'e2e-secret', SEED_SAMPLE_DATA: 'false' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/health`)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('서버가 뜨지 않았습니다. 먼저 npm run build 를 했는지 확인하세요.');
});

after(() => { server?.kill(); rmSync(DB, { force: true }); });

async function call(method, path, body, token) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { s: r.status, j };
}

test('회원가입 · 로그인 · 반려견 · 레시피 · 찜 · 리뷰 전체 흐름', async (t) => {
  const tag = Date.now();
  const a = await call('POST','/auth/signup',{email:`a${tag}@t.com`,password:'secret12'});
  assert.ok(a.s===201 && a.j.access_token, 'signup 201' + ' ' + JSON.stringify(a));
  const dup = await call('POST','/auth/signup',{email:`a${tag}@t.com`,password:'secret12'});
  assert.ok(dup.s===409, 'duplicate signup 409');
  const bad = await call('POST','/auth/login',{email:`a${tag}@t.com`,password:'wrongpw1'});
  assert.ok(bad.s===401, 'wrong password 401');
  const lg = await call('POST','/auth/login',{email:`A${tag}@t.com`,password:'secret12'});
  assert.ok(lg.s===200 && lg.j.access_token, 'login 200 (case-insensitive email)');
  const A = lg.j.access_token;
  const me = await call('GET','/auth/me',null,A);
  assert.ok(me.s===200 && me.j.email===`a${tag}@t.com`, 'me');
  const b = await call('POST','/auth/signup',{email:`b${tag}@t.com`,password:'secret12'}); const Bt = b.j.access_token;

  assert.ok((await call('GET','/pets')).s===401, 'pets need login 401');
  const p = await call('POST','/pets',{name:'초코',breed:'푸들',age:3,weight:4.2,gender:'male',is_neutered:true,allergies:['닭'],health_conditions:[],birth_date:'2023-01-01',user_id:'hacker'},A);
  assert.ok(p.s===201 && p.j.user_id===a.j.user.id, 'create pet, user_id from token' + ' ' + JSON.stringify(p.j));
  assert.ok((await call('GET','/pets',null,Bt)).j.length===0, 'other user cannot see pet');
  assert.ok((await call('PATCH',`/pets/${p.j.id}`,{name:'x'},Bt)).s===404, 'other user cannot edit pet 404');
  const pu = await call('PATCH',`/pets/${p.j.id}`,{weight:5},A);
  assert.ok(pu.s===200 && pu.j.weight===5 && pu.j.allergies[0]==='닭', 'edit pet');

  const r = await call('POST','/recipes',{title:'닭가슴살 죽',ingredients:['닭가슴살'],instructions:['끓인다'],tags:['간식'],cook_time:20,servings:2,calories:120,likes_count:999,isLiked:true},A);
  assert.ok(r.s===201 && r.j.likes_count===0, 'create recipe, likes_count ignored' + ' ' + JSON.stringify(r.j));
  assert.ok((await call('GET','/recipes')).j.some(x=>x.id===r.j.id), 'anon list recipes');
  assert.ok((await call('POST','/recipes',{description:'x'},A)).s===400, 'validation: missing title 400');
  assert.ok((await call('DELETE',`/recipes/${r.j.id}`,null,Bt)).s===404, 'other user cannot delete recipe 404');
  const lk = await call('POST',`/recipes/${r.j.id}/like`,null,Bt);
  await call('POST',`/recipes/${r.j.id}/like`,null,Bt);
  assert.ok(lk.s===200 && lk.j.likes_count===1, 'like idempotent count=1');
  const lb = await call('GET','/recipes',null,Bt);
  assert.ok(lb.j.find(x=>x.id===r.j.id).isLiked===true, 'isLiked true for liker');
  assert.ok((await call('GET','/recipes',null,A)).j.find(x=>x.id===r.j.id).isLiked===false, 'isLiked false for other');
  assert.ok(JSON.stringify((await call('GET','/recipes/liked',null,Bt)).j)===JSON.stringify([r.j.id]), 'liked ids');
  const since = new Date(Date.now()-24*3600e3).toISOString();
  assert.ok((await call('GET',`/recipes?since=${encodeURIComponent(since)}&sort=popular&limit=20`)).s===200, 'since filter');

  const rv = await call('POST',`/recipes/${r.j.id}/reviews`,{rating:5,comment:'좋아요'},Bt);
  assert.ok(rv.s===201, 'create review');
  const rv2 = await call('POST',`/recipes/${r.j.id}/reviews`,{rating:4},Bt);
  assert.ok(rv2.s===409 && rv2.j.review_id===rv.j.id, 'second review 409 with review_id' + ' ' + JSON.stringify(rv2.j));
  await call('POST',`/recipes/${r.j.id}/reviews`,{rating:2},A);
  assert.ok((await call('POST',`/recipes/${r.j.id}/reviews`,{rating:9},A)).s===400, 'rating out of range 400');
  let one = (await call('GET',`/recipes/${r.j.id}`)).j;
  assert.ok(one.reviews_count===2 && one.average_rating===3.5, 'stats: 2 reviews avg 3.5' + ' ' + JSON.stringify(one));
  const list = await call('GET',`/recipes/${r.j.id}/reviews`);
  assert.ok(list.j.length===2 && list.j.every(x=>x.user_email), 'review list has user_email');
  assert.ok((await call('PATCH',`/reviews/${rv.j.id}`,{rating:1},A)).s===404, 'other user cannot edit review 404');
  await call('PATCH',`/reviews/${rv.j.id}`,{rating:3,comment:'보통'},Bt);
  one = (await call('GET',`/recipes/${r.j.id}`)).j;
  assert.ok(one.average_rating===2.5, 'stats after edit avg 2.5');
  await call('DELETE',`/recipes/${r.j.id}/like`,null,Bt);
  assert.ok((await call('GET',`/recipes/${r.j.id}`)).j.likes_count===0, 'unlike count 0');
  assert.ok((await call('DELETE',`/recipes/${r.j.id}`,null,A)).s===204, 'delete own recipe 204');
  assert.ok((await call('GET',`/recipes/${r.j.id}/reviews`)).j.length===0, 'reviews gone with recipe');
  assert.ok((await call('DELETE',`/pets/${p.j.id}`,null,A)).s===204, 'delete pet 204');
  assert.ok((await call('GET','/auth/me',null,'garbage')).s===401, 'bad token 401');
});
