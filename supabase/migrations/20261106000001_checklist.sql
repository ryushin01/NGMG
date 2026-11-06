-- 출조 체크리스트. 계정별로 저장하며 본인만 읽고 쓸 수 있습니다.

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  category text not null default '기타',
  checked boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index checklist_items_user_idx on public.checklist_items (user_id, position);

create trigger checklist_items_touch before update on public.checklist_items
  for each row execute function public.touch_updated_at();

alter table public.checklist_items enable row level security;

create policy "checklist_items_owner" on public.checklist_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
