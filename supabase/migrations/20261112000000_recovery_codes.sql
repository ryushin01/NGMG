-- 복구 코드: 메일 없이 비밀번호를 잊었을 때 쓰는 일회용 코드입니다.
-- 해시만 API에 노출되지 않는 private 스키마에 두고, 확인은 서비스 키로만 부를 수 있는 함수가 맡습니다.

create schema if not exists private;
revoke all on schema private from public;

create table private.recovery_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  code_hash text not null check (code_hash ~ '^[0-9a-f]{64}$'),
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- 로그인한 본인이 새 코드의 해시를 저장합니다(가입 직후, 다시 발급할 때).
create function public.set_recovery_code(p_code_hash text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_username text;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;
  select split_part(email, '@', 1) into v_username from auth.users where id = v_user;
  if coalesce(v_username, '') = '' then
    raise exception 'username not found';
  end if;
  insert into private.recovery_codes (user_id, username, code_hash)
  values (v_user, v_username, p_code_hash)
  on conflict (user_id) do update
    -- 아이디(가입 주소)가 바뀌었으면 함께 맞춥니다.
    set code_hash = excluded.code_hash, username = excluded.username,
        failed_attempts = 0, locked_until = null, updated_at = now();
end;
$$;

revoke all on function public.set_recovery_code(text) from public, anon;
grant execute on function public.set_recovery_code(text) to authenticated;

-- 아이디와 코드 해시가 맞으면 회원 id를 돌려줍니다. 5번 틀리면 15분 잠급니다.
create function public.verify_recovery_code(p_username text, p_code_hash text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_row private.recovery_codes%rowtype;
begin
  select * into v_row from private.recovery_codes where username = p_username for update;
  if not found then
    return null;
  end if;
  if v_row.locked_until is not null and v_row.locked_until > now() then
    raise exception 'Recovery locked';
  end if;
  if v_row.code_hash <> p_code_hash then
    update private.recovery_codes
      set failed_attempts = case when v_row.failed_attempts + 1 >= 5 then 0 else v_row.failed_attempts + 1 end,
          locked_until = case when v_row.failed_attempts + 1 >= 5 then now() + interval '15 minutes' else null end
      where user_id = v_row.user_id;
    return null;
  end if;
  -- 맞으면 틀린 횟수를 되돌립니다.
  update private.recovery_codes set failed_attempts = 0 where user_id = v_row.user_id;
  return v_row.user_id;
end;
$$;

-- 복구에 성공하면 쓴 코드를 버리고 새 코드로 바꿉니다.
create function public.replace_recovery_code(p_user_id uuid, p_code_hash text) returns void
language sql security definer set search_path = '' as $$
  update private.recovery_codes
    set code_hash = p_code_hash, failed_attempts = 0, locked_until = null, updated_at = now()
    where user_id = p_user_id;
$$;

revoke all on function public.verify_recovery_code(text, text) from public, anon, authenticated;
revoke all on function public.replace_recovery_code(uuid, text) from public, anon, authenticated;
grant execute on function public.verify_recovery_code(text, text) to service_role;
grant execute on function public.replace_recovery_code(uuid, text) to service_role;
