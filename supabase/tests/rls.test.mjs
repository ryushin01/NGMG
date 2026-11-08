// 마이그레이션을 실제 Postgres(PGlite)에 적용하고 사용자 간 데이터 격리를 검사합니다.
// auth·storage 스키마는 Supabase가 제공하므로 필요한 부분만 대역으로 만듭니다.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';

const db = new PGlite();
await db.exec(`
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  grant usage on schema auth to authenticated;
  grant execute on function auth.uid() to authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select string_to_array(name, '/') $$;
  alter table storage.objects enable row level security;
  grant usage on schema storage to authenticated;
  grant all on storage.objects to authenticated;
  grant execute on function storage.foldername(text) to authenticated;
  insert into auth.users values ('${A}'), ('${B}');
`);
const migrations = new URL('../migrations/', import.meta.url);
for (const file of readdirSync(migrations).sort()) {
  await db.exec(readFileSync(new URL(file, migrations), 'utf8'));
}
await db.exec(`
  grant usage on schema public to authenticated;
  grant all on all tables in schema public to authenticated;
`);

const as = async (uid, sql, params) => {
  await db.exec(`reset role; set test.uid = '${uid}'; set role authenticated;`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec('reset role');
  }
};
const insertPlace = (uid, name) =>
  as(
    uid,
    `insert into public.places (name, kind, latitude, longitude) values ($1, 'real', 34, 127) returning id`,
    [name],
  );

const placeA = (await insertPlace(A, 'A의 포인트')).rows[0].id;

test('다른 사용자의 장소는 보이지 않고 수정·삭제되지 않습니다', async () => {
  assert.equal((await as(B, 'select * from public.places')).rows.length, 0);
  assert.equal((await as(B, 'select * from public.place_summaries')).rows.length, 0);
  await as(B, `update public.places set name = '탈취' where id = $1`, [placeA]);
  await as(B, 'delete from public.places where id = $1', [placeA]);
  const { rows } = await as(A, 'select name from public.places where id = $1', [placeA]);
  assert.equal(rows[0].name, 'A의 포인트');
});

test('다른 사용자의 장소에 기록을 붙일 수 없습니다', async () => {
  await assert.rejects(
    as(B, 'insert into public.records (place_id) values ($1)', [placeA]),
    /row-level security/,
  );
});

test('소유자를 다른 사용자로 지정해 넣을 수 없습니다', async () => {
  await assert.rejects(
    as(
      B,
      `insert into public.places (user_id, name, kind, latitude, longitude) values ($1, 'x', 'real', 1, 1)`,
      [A],
    ),
    /row-level security/,
  );
});

test('장소 요약에 기록 수와 최근 방문일이 반영되고, 장소를 지우면 기록과 사진도 지워집니다', async () => {
  const { rows } = await as(A, 'insert into public.records (place_id) values ($1) returning id', [
    placeA,
  ]);
  await as(
    A,
    `insert into public.record_photos (record_id, storage_path, width, height) values ($1, 'p/1.jpg', 1, 1)`,
    [rows[0].id],
  );
  const summary = await as(
    A,
    'select record_count, last_visited_at from public.place_summaries where id = $1',
    [placeA],
  );
  assert.equal(summary.rows[0].record_count, 1);
  assert.ok(summary.rows[0].last_visited_at);
  await as(A, 'delete from public.places where id = $1', [placeA]);
  assert.equal((await as(A, 'select * from public.record_photos')).rows.length, 0);
});

test('값 범위 제약을 위반하면 거부합니다', async () => {
  await assert.rejects(
    as(A, `insert into public.places (name, kind, latitude, longitude) values ('x', 'cafe', 1, 1)`),
    /check/,
  );
  await assert.rejects(
    as(
      A,
      `insert into public.places (name, kind, latitude, longitude) values ('x', 'real', 91, 1)`,
    ),
    /check/,
  );
});

test('사진 저장소는 본인 폴더만 접근할 수 있습니다', async () => {
  await as(
    A,
    `insert into storage.objects (bucket_id, name) values ('record-photos', '${A}/r/1.jpg')`,
  );
  await assert.rejects(
    as(A, `insert into storage.objects (bucket_id, name) values ('record-photos', '${B}/r/1.jpg')`),
    /row-level security/,
  );
  assert.equal((await as(B, 'select * from storage.objects')).rows.length, 0);
  assert.equal((await as(A, 'select * from storage.objects')).rows.length, 1);
});

test('체크리스트는 본인 항목만 보이고 다른 계정의 항목을 덮어쓸 수 없습니다', async () => {
  const id = '00000000-0000-0000-0000-0000000000c1';
  await as(A, `insert into public.checklist_items (id, title) values ('${id}', '구명조끼')`);
  assert.equal((await as(A, 'select * from public.checklist_items')).rows.length, 1);
  assert.equal((await as(B, 'select * from public.checklist_items')).rows.length, 0);
  await assert.rejects(
    as(
      B,
      `insert into public.checklist_items (id, title) values ('${id}', '탈취')
       on conflict (id) do update set title = excluded.title`,
    ),
  );
  assert.equal((await as(A, 'select title from public.checklist_items')).rows[0].title, '구명조끼');
});

test('체크리스트 항목은 기본 목록에 들어가고 목록 이름은 길이 제한이 있습니다', async () => {
  const { rows } = await as(
    A,
    `insert into public.checklist_items (title) values ('릴') returning list_name`,
  );
  assert.equal(rows[0].list_name, '기본');
  await assert.rejects(
    as(A, `insert into public.checklist_items (title, list_name) values ('릴', '')`),
    /check/,
  );
});
