-- recipes 에 계절 칸 추가 (계획서 docs/plan-safety-v12.md 8장 "주재료 카테고리·계절")
-- 다른 목록 칸(ingredients·instructions·tags)이 jsonb 라서 seasons 도 jsonb 배열로 맞춘다.
-- 빈 배열 = 사계절 레시피.
alter table public.recipes
  add column if not exists seasons jsonb not null default '[]'::jsonb;

-- 값은 배열이어야 하고, 봄·여름·가을·겨울 문자열만 들어갈 수 있다.
alter table public.recipes drop constraint if exists recipes_seasons_check;
alter table public.recipes
  add constraint recipes_seasons_check check (
    jsonb_typeof(seasons) = 'array'
    and seasons <@ '["봄", "여름", "가을", "겨울"]'::jsonb
  );

comment on column public.recipes.seasons is '어울리는 계절 배열 (봄·여름·가을·겨울). 빈 배열이면 사계절.';
