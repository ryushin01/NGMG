-- 체크리스트를 출조별 목록으로 나눕니다. 기존 항목은 '기본' 목록이 됩니다.

alter table public.checklist_items
  add column list_name text not null default '기본'
  check (char_length(list_name) between 1 and 50);

drop index public.checklist_items_user_idx;
create index checklist_items_user_idx on public.checklist_items (user_id, list_name, position);
