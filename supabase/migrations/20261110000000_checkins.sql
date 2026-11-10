-- 여행지 현장 인증(스탬프). 회원마다 여행지 한 곳에 하나만 남깁니다.

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  catalog_id text not null check (char_length(catalog_id) between 1 and 64),
  checked_at timestamptz not null default now(),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  distance_km numeric(8, 3) not null check (distance_km >= 0),
  method text not null check (method in ('gps', 'demo')),
  created_at timestamptz not null default now(),
  unique (user_id, catalog_id)
);

alter table public.checkins enable row level security;

create policy "checkins_owner" on public.checkins for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
