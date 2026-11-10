import type { PlaceKind } from '@/shared/api';
import type { Destination } from './types';

/** 날짜 문자열을 같은 수로 바꾸는 간단한 해시(FNV-1a). 기기와 시간대가 같으면 하루 동안 같은 여행지가 나옵니다. */
const hash = (text: string) => {
  let value = 0x811c9dc5;
  for (const char of text) {
    value ^= char.codePointAt(0) ?? 0;
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
};

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

/** 오늘의 여행지. 실존과 환상은 서로 다른 곳이 나오도록 분류를 섞어 고릅니다. */
export const pickDaily = (destinations: Destination[], realm: PlaceKind, date = new Date()) => {
  const pool = destinations.filter((item) => item.realm === realm);
  if (pool.length === 0) return undefined;
  return pool[hash(`${dayKey(date)}:${realm}`) % pool.length];
};
