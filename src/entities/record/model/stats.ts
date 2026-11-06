import dayjs from 'dayjs';
import type { TripRecord } from '@/shared/api';

export type RankItem = { label: string; count: number };

export type RecordStats = {
  total: number;
  fishing: number;
  restaurant: number;
  photos: number;
  /** 1월부터 12월까지의 기록 수 */
  monthly: number[];
  places: RankItem[];
  baits: RankItem[];
  members: RankItem[];
  averageRating: number | null;
  averagePrice: number | null;
};

const rank = (values: string[]): RankItem[] => {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value.trim();
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5);
};

const average = (values: number[]) =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

const present = <T>(value: T | null): value is T => value !== null;

/** 기록이 있는 연도를 최근 순으로 돌려줍니다. 올해는 항상 포함합니다. */
export const recordYears = (records: TripRecord[], now = new Date()) =>
  [...new Set([now.getFullYear(), ...records.map((r) => dayjs(r.visitedAt).year())])].sort(
    (a, b) => b - a,
  );

export const computeStats = (records: TripRecord[], year: number): RecordStats => {
  const inYear = records.filter((record) => dayjs(record.visitedAt).year() === year);
  const monthly = Array.from({ length: 12 }, () => 0);
  for (const record of inYear) monthly[dayjs(record.visitedAt).month()] += 1;
  const fishing = inYear.filter((record) => record.placeKind === 'fishing');
  const restaurant = inYear.filter((record) => record.placeKind === 'restaurant');
  return {
    total: inYear.length,
    fishing: fishing.length,
    restaurant: restaurant.length,
    photos: inYear.reduce((sum, record) => sum + record.photos.length, 0),
    monthly,
    places: rank(inYear.map((record) => record.placeName)),
    baits: rank(fishing.map((record) => record.bait)),
    members: rank(inYear.flatMap((record) => record.members)),
    averageRating: average(restaurant.map((record) => record.rating).filter(present)),
    averagePrice: average(restaurant.map((record) => record.price).filter(present)),
  };
};
