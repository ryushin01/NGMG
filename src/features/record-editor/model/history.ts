import type { PlaceKind, TripRecord } from '@/shared/api';

/** 자주 함께한 사람부터 돌려줍니다. */
export const collectMembers = (records: TripRecord[], kind: PlaceKind) => {
  const counts = new Map<string, number>();
  for (const record of records) {
    if (record.placeKind !== kind) continue;
    for (const member of record.members) counts.set(member, (counts.get(member) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([member]) => member);
};

const hasGear = (record: TripRecord) =>
  record.placeKind === 'fishing' && !!(record.gear || record.rig || record.bait);

/** 같은 장소의 최근 낚시 기록을 먼저, 없으면 전체에서 가장 최근 기록을 고릅니다. */
export const findLastFishing = (records: TripRecord[], placeId: string) =>
  records.find((record) => record.placeId === placeId && hasGear(record)) ?? records.find(hasGear);
