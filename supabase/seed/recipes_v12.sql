-- 공식 레시피 8개 (원본: src/v12/data/seed.json 의 recipes)
-- 칸 맞춤: desc→description, steps→instructions, category 는 v12 분류 키(poultry·meat·fish·veg·grain·eggdairy) 그대로.
-- image: seed.json 에 사진이 없어(null) 넣지 않는다. 화면은 대표 재료 그림을 보여 준다.
-- user_id 는 null(공식 레시피), is_user_created = false.
-- id 는 identity(always) 라서 넣지 않는다. 다시 실행해도 중복되지 않도록
-- "user_id 가 null 이고 제목이 같은 줄"이 있으면 내용을 고치고, 없을 때만 넣는다.
-- 필요 조건: 마이그레이션 20261124000000_recipes_seasons.sql 을 먼저 적용.
with v(title, description, category, author, rating, reviews, ingredients, instructions, seasons) as (
  values
  ('닭가슴살 단호박죽', '닭가슴살과 단호박을 푹 끓인 부드러운 죽', 'poultry', '초코 보호자', 4.9, 128,
   '["닭가슴살 100g", "단호박 50g", "쌀 30g", "당근 20g", "파슬리 약간"]'::jsonb,
   '["닭가슴살을 삶아 잘게 찢어요.", "단호박·당근은 껍질을 벗겨 푹 익혀요.", "불린 쌀과 함께 물을 넉넉히 넣고 죽처럼 끓여요.", "식혀서 줘요."]'::jsonb,
   '["가을", "겨울"]'::jsonb),
  ('소고기 브로콜리 화식', '기름기 뺀 소고기 우둔과 데친 브로콜리', 'meat', '보리 보호자', 4.8, 95,
   '["소고기 우둔 100g", "브로콜리 30g", "고구마 50g"]'::jsonb,
   '["소고기 우둔의 기름을 떼고 잘게 썰어 익혀요.", "브로콜리는 데치고 고구마는 껍질을 벗겨 쪄요.", "모두 잘게 썰어 섞어요."]'::jsonb,
   '[]'::jsonb),
  ('고구마 쌀쿠키', '밀가루 없이 쌀가루와 고구마로 구운 쿠키', 'grain', '코코 보호자', 4.9, 84,
   '["고구마 100g", "쌀가루 50g", "달걀 1개"]'::jsonb,
   '["고구마를 쪄서 으깨요.", "쌀가루와 달걀을 넣어 반죽해요.", "얇게 펴서 160도 오븐에 20분 구워요."]'::jsonb,
   '["가을", "겨울"]'::jsonb),
  ('단호박 락토프리 치즈볼', '락토프리 우유로 만든 치즈와 단호박 간식', 'eggdairy', '루피 보호자', 4.8, 67,
   '["단호박 80g", "락토프리 우유 100ml", "쌀가루 30g"]'::jsonb,
   '["락토프리 우유를 데워 치즈를 만들어요.", "찐 단호박과 쌀가루를 섞어 동그랗게 빚어요.", "찜기에 10분 쪄요."]'::jsonb,
   '["가을"]'::jsonb),
  ('황태 달걀죽', '물에 담가 짠기를 뺀 황태와 달걀노른자 죽', 'fish', '보양마스터', 5.0, 210,
   '["황태 20g", "달걀 1개", "쌀 30g"]'::jsonb,
   '["황태를 물에 담가 짠기를 빼요(물은 버려요).", "가시를 빼고 잘게 찢어요.", "쌀과 함께 끓이다가 달걀을 풀어 익혀요."]'::jsonb,
   '["겨울"]'::jsonb),
  ('오리안심 사과 생일케이크', '오리안심 패티와 사과, 쌀가루 시트', 'poultry', '파티멍셰프', 5.0, 156,
   '["오리안심 100g", "사과 1/2개", "쌀가루 50g"]'::jsonb,
   '["오리안심 기름을 떼고 다져서 패티로 익혀요.", "사과는 씨와 심을 빼고 잘게 썰어요.", "쌀가루 시트에 올려 케이크 모양을 만들어요."]'::jsonb,
   '[]'::jsonb),
  ('연어 귀리 구이', '가시를 뺀 연어를 익혀 귀리와 구운 요리', 'fish', '피쉬러버', 4.8, 79,
   '["연어 100g", "귀리 30g", "올리브유 1작은술"]'::jsonb,
   '["연어 가시를 모두 빼요.", "귀리를 익혀요.", "올리브유를 아주 조금만 두르고 연어를 완전히 익혀요."]'::jsonb,
   '["봄"]'::jsonb),
  ('수박 블루베리 얼음', '씨를 뺀 수박과 블루베리를 얼린 여름 간식', 'veg', '여름멍', 4.7, 41,
   '["수박 100g", "블루베리 30g"]'::jsonb,
   '["수박은 씨와 껍질을 빼고 작게 잘라요.", "블루베리와 함께 얼음틀에 넣어 얼려요."]'::jsonb,
   '["여름"]'::jsonb)
),
upd as (
  update public.recipes r
     set description = v.description, category = v.category, author = v.author,
         rating = v.rating, reviews = v.reviews, ingredients = v.ingredients,
         instructions = v.instructions, seasons = v.seasons, is_user_created = false
    from v
   where r.title = v.title and r.user_id is null
  returning r.id
)
insert into public.recipes
  (title, description, category, author, rating, reviews, ingredients, instructions, seasons, image, user_id, is_user_created)
select v.title, v.description, v.category, v.author, v.rating, v.reviews, v.ingredients, v.instructions, v.seasons, null, null, false
  from v
 where not exists (select 1 from public.recipes r where r.title = v.title and r.user_id is null);
