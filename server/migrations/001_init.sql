-- 멍슐랭 초기 스키마
-- gen_random_uuid()는 PostgreSQL 13+에 기본 포함되어 있습니다.

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  name          text not null default '',
  created_at    timestamptz not null default now()
);

create table if not exists pets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  name              text not null,
  breed             text not null default '',
  age               int not null default 0 check (age >= 0),
  weight            numeric(5,2) not null default 0 check (weight >= 0),
  gender            text not null default '',
  is_neutered       boolean not null default false,
  image             text,
  allergies         text[] not null default '{}',
  health_conditions text[] not null default '{}',
  birth_date        date,
  created_at        timestamptz not null default now()
);
create index if not exists pets_user_idx on pets(user_id);

create table if not exists recipes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete set null,  -- null = 기본 제공 레시피
  author          text not null default '',
  title           text not null,
  description     text not null default '',
  image           text not null default '',
  category        text not null default '',
  cook_time       int not null default 0 check (cook_time >= 0),
  servings        int not null default 1 check (servings >= 1),
  difficulty      text not null default '',
  ingredients     text[] not null default '{}',
  instructions    text[] not null default '{}',
  tags            text[] not null default '{}',
  nutrition       jsonb not null default '{}'::jsonb,
  is_ai_generated boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists recipes_category_idx on recipes(category);
create index if not exists recipes_user_idx on recipes(user_id);

create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  recipe_id  uuid not null references recipes(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  comment    text not null default '',
  created_at timestamptz not null default now(),
  unique (recipe_id, user_id)   -- 한 사람이 레시피당 리뷰 하나
);

create table if not exists favorites (
  user_id    uuid not null references users(id) on delete cascade,
  recipe_id  uuid not null references recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
