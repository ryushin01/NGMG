-- 회원 프로필: 닉네임, 본명, 프로필 사진. 가입할 때 넘긴 닉네임과 본명으로 자동 생성합니다.
-- 로그인은 아이디로 하며, 앱이 아이디를 {아이디}@users.newworld.app 주소로 바꿔 Supabase Auth에 넘깁니다.

create table public.profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 2 and 20),
  -- 본명은 본인만 봅니다(RLS). 비워 둘 수 있습니다.
  name text not null default '' check (char_length(name) <= 40),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 200),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_owner" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- 가입 메타데이터의 닉네임을 쓰고, 없거나 형식이 맞지 않으면 이메일 앞부분이나 '여행자'로 둡니다.
create function public.default_nickname(meta jsonb, email text) returns text
language sql immutable set search_path = '' as $$
  select case
    when char_length(btrim(coalesce(meta ->> 'nickname', ''))) between 2 and 20
      then btrim(meta ->> 'nickname')
    when char_length(split_part(coalesce(email, ''), '@', 1)) between 2 and 20
      then split_part(email, '@', 1)
    else '여행자'
  end
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nickname, name)
  values (
    new.id,
    public.default_nickname(new.raw_user_meta_data, new.email),
    left(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), 40)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이미 가입한 회원의 프로필을 만듭니다.
insert into public.profiles (id, nickname)
select id, public.default_nickname(raw_user_meta_data, email) from auth.users
on conflict (id) do nothing;

-- 프로필 사진: {user_id}/{파일} 경로의 본인 폴더만 접근합니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg']);

create policy "avatars_objects_owner" on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
