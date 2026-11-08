-- 기록 비용의 통화와 여러 여행지를 묶는 여정을 추가합니다.

alter table public.records
  add column currency text not null default 'KRW' check (char_length(currency) = 3);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  start_date date,
  end_date date,
  stops text[] not null default '{}',
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date is null or end_date is null or start_date <= end_date)
);
create index trips_user_idx on public.trips (user_id, start_date);

create trigger trips_touch before update on public.trips
  for each row execute function public.touch_updated_at();

alter table public.trips enable row level security;

create policy "trips_owner" on public.trips for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
