-- 유적지·환상 세계 여행 앱으로 전환합니다.
-- 낚시·맛집 전용 칸은 삭제되고, 기존 장소는 실존 유적으로 남습니다. 적용 전에 필요한 데이터를 백업하세요.

drop view public.place_summaries;

alter table public.places drop constraint places_kind_check;
update public.places set kind = 'real';
alter table public.places
  add constraint places_kind_check check (kind in ('real', 'fantasy')),
  add column catalog_id text,
  add column wishlisted boolean not null default false;

alter table public.records
  drop column gear,
  drop column rig,
  drop column bait,
  drop column tide,
  drop column wind,
  drop column water_temp,
  drop column catches,
  drop column menu,
  add column temperature numeric(4, 1) check (temperature is null or temperature between -60 and 60),
  add column transport text not null default '',
  add column lodging text not null default '',
  add column highlights text not null default '',
  add column gateway text not null default '',
  add column encounters text not null default '',
  add column souvenir text not null default '';

alter table public.records rename column price to cost;
alter table public.records rename constraint records_price_check to records_cost_check;

-- 지도와 목록에 쓰는 장소 요약. security_invoker로 호출자의 RLS를 그대로 적용합니다.
create view public.place_summaries with (security_invoker = true) as
select p.*,
  (select count(*)::integer from public.records r where r.place_id = p.id) as record_count,
  (select max(r.visited_at) from public.records r where r.place_id = p.id) as last_visited_at
from public.places p;
