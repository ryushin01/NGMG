-- 낚고먹고 초기 스키마: 장소, 기록, 사진. 모든 데이터는 본인만 읽고 쓸 수 있습니다.

create table public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  kind text not null check (kind in ('fishing', 'restaurant')),
  address text not null default '',
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  memo text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index places_user_id_idx on public.places (user_id);

create table public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  visited_at timestamptz not null default now(),
  title text not null default '',
  memo text not null default '',
  party_size integer check (party_size is null or party_size between 1 and 100),
  members text[] not null default '{}',
  -- 낚시 기록
  gear text not null default '',
  rig text not null default '',
  bait text not null default '',
  weather text not null default '',
  tide text not null default '',
  wind text not null default '',
  water_temp numeric(4, 1),
  catches text not null default '',
  -- 맛집 기록
  menu text not null default '',
  price integer check (price is null or price >= 0),
  rating integer check (rating is null or rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index records_user_visited_idx on public.records (user_id, visited_at desc);
create index records_place_id_idx on public.records (place_id);

create table public.record_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  record_id uuid not null references public.records (id) on delete cascade,
  storage_path text not null unique,
  width integer not null,
  height integer not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index record_photos_record_id_idx on public.record_photos (record_id, position);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger places_touch before update on public.places
  for each row execute function public.touch_updated_at();
create trigger records_touch before update on public.records
  for each row execute function public.touch_updated_at();

-- 지도와 목록에 쓰는 장소 요약. security_invoker로 호출자의 RLS를 그대로 적용합니다.
create view public.place_summaries with (security_invoker = true) as
select p.*,
  (select count(*)::integer from public.records r where r.place_id = p.id) as record_count,
  (select max(r.visited_at) from public.records r where r.place_id = p.id) as last_visited_at
from public.places p;

alter table public.places enable row level security;
alter table public.records enable row level security;
alter table public.record_photos enable row level security;

create policy "places_owner" on public.places for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 다른 사람의 장소에 기록을 붙일 수 없도록 place_id의 소유자도 확인합니다.
create policy "records_owner" on public.records for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.places p where p.id = place_id and p.user_id = (select auth.uid()))
  );

create policy "record_photos_owner" on public.record_photos for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.records r where r.id = record_id and r.user_id = (select auth.uid()))
  );

-- 사진 저장소: {user_id}/{record_id}/{파일} 경로의 본인 폴더만 접근합니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('record-photos', 'record-photos', false, 10485760, array['image/jpeg']);

create policy "record_photos_objects_owner" on storage.objects for all to authenticated
  using (bucket_id = 'record-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'record-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
