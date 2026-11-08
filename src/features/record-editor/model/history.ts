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
