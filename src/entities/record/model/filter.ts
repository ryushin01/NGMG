import type { TripRecord } from '@/shared/api';

/** 대소문자를 가리지 않고 기록의 글자 항목 전체에서 찾습니다. */
export const matchesRecord = (record: TripRecord, keyword: string) => {
  const term = keyword.trim().toLowerCase();
  if (!term) return true;
  return [
    record.title,
    record.placeName,
    record.memo,
    record.weather,
    record.transport,
    record.lodging,
    record.highlights,
    record.gateway,
    record.encounters,
    record.souvenir,
    ...record.members,
  ].some((value) => value.toLowerCase().includes(term));
};
