-- 멍슐랭: 로그인한 사용자의 반려견·찜·먹은 기록을 앱에서 저장하기 위한 보강 (추가만)
-- 계획서 docs/plan-safety-v12.md 8장:
--   pets  : lactose_sensitive 추가, 몸무게 0.5~100kg, 이름 빈칸 금지
--   likes : pet_id (반려견별 찜), (user_id, pet_id, recipe_id) 중복 금지
-- 앱은 user_id 로 사용자를 구분하므로 device_id 는 기본값 '' 로 둔다 (칸은 그대로 남김).
-- 건강 상태는 기존 pets.health_conditions 를 그대로 쓰고 앱에서 conditions 로 매핑한다 (칸 이름 바꾸지 않음).
-- RLS 정책은 건드리지 않는다.

-- =========================================================
-- 1. pets
-- =========================================================
alter table public.pets add column if not exists lactose_sensitive boolean not null default false;
alter table public.pets alter column device_id set default '';

-- 기존 행이 위반해도 마이그레이션이 멈추지 않게 NOT VALID 로 만든 뒤, 되면 검증한다.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pets_weight_range' and conrelid = 'public.pets'::regclass) then
    alter table public.pets add constraint pets_weight_range
      check (weight is null or (weight >= 0.5 and weight <= 100)) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pets_name_not_blank' and conrelid = 'public.pets'::regclass) then
    alter table public.pets add constraint pets_name_not_blank
      check (char_length(btrim(name)) >= 1) not valid;
  end if;
end $$;

do $$
begin
  alter table public.pets validate constraint pets_weight_range;
exception when check_violation then
  raise notice 'pets_weight_range: 기존 행이 범위를 벗어나 NOT VALID 로 둡니다 (새 행만 검사).';
end $$;

do $$
begin
  alter table public.pets validate constraint pets_name_not_blank;
exception when check_violation then
  raise notice 'pets_name_not_blank: 기존 행에 빈 이름이 있어 NOT VALID 로 둡니다 (새 행만 검사).';
end $$;

create index if not exists pets_user_id_idx on public.pets (user_id);

-- =========================================================
-- 2. likes (반려견별 찜)
-- =========================================================
alter table public.likes add column if not exists pet_id bigint references public.pets(id) on delete cascade;
alter table public.likes alter column device_id set default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'likes_user_pet_recipe_key' and conrelid = 'public.likes'::regclass) then
    alter table public.likes add constraint likes_user_pet_recipe_key unique (user_id, pet_id, recipe_id);
  end if;
end $$;

create index if not exists likes_pet_id_idx on public.likes (pet_id);

-- =========================================================
-- 3. intake_logs · reviews: device_id 기본값 (앱은 user_id 로 구분)
-- =========================================================
alter table public.intake_logs alter column device_id set default '';
alter table public.reviews alter column device_id set default '';
