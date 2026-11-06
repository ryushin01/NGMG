import type { TripRecord } from '@/shared/api';
import { matchesRecord } from './filter';
import { computeStats, recordYears } from './stats';

const record = (overrides: Partial<TripRecord>) =>
  ({
    title: '',
    placeName: '거문도',
    placeKind: 'fishing',
    memo: '',
    gear: '',
    rig: '',
    bait: '',
    catches: '',
    menu: '',
    weather: '',
    tide: '',
    members: [],
    photos: [],
    rating: null,
    price: null,
    visitedAt: '2026-03-10T03:00:00.000Z',
    ...overrides,
  }) as TripRecord;

describe('computeStats', () => {
  const records = [
    record({ bait: '크릴', members: ['민수'] }),
    record({ bait: '크릴', members: ['민수', '지훈'], visitedAt: '2026-03-20T03:00:00.000Z' }),
    record({ bait: ' ', visitedAt: '2026-11-01T03:00:00.000Z' }),
    record({ placeKind: 'restaurant', placeName: '식당', rating: 5, price: 10000 }),
    record({ placeKind: 'restaurant', placeName: '식당', rating: 3 }),
    record({ visitedAt: '2025-01-01T03:00:00.000Z' }),
  ];

  it('해당 연도만 집계합니다', () => {
    const stats = computeStats(records, 2026);
    expect(stats.total).toBe(5);
    expect(stats.fishing).toBe(3);
    expect(stats.restaurant).toBe(2);
    expect(stats.monthly[2]).toBe(4);
    expect(stats.monthly[10]).toBe(1);
  });

  it('많은 순으로 묶고 빈 값은 뺍니다', () => {
    const stats = computeStats(records, 2026);
    expect(stats.baits).toEqual([{ label: '크릴', count: 2 }]);
    expect(stats.members[0]).toEqual({ label: '민수', count: 2 });
    expect(stats.places[0]).toEqual({ label: '거문도', count: 3 });
  });

  it('값이 있는 기록만 평균을 냅니다', () => {
    const stats = computeStats(records, 2026);
    expect(stats.averageRating).toBe(4);
    expect(stats.averagePrice).toBe(10000);
    expect(computeStats([], 2026).averageRating).toBeNull();
  });
});

it('기록이 없어도 올해를 포함해 최근 순으로 연도를 돌려줍니다', () => {
  const now = new Date('2026-06-01T00:00:00Z');
  expect(recordYears([], now)).toEqual([2026]);
  expect(recordYears([record({ visitedAt: '2024-06-01T00:00:00Z' })], now)).toEqual([2026, 2024]);
});

describe('matchesRecord', () => {
  it('글자 항목과 멤버에서 찾습니다', () => {
    const target = record({ catches: '감성돔 2마리', members: ['민수'] });
    expect(matchesRecord(target, '감성돔')).toBe(true);
    expect(matchesRecord(target, '민수')).toBe(true);
    expect(matchesRecord(target, '참돔')).toBe(false);
    expect(matchesRecord(target, '  ')).toBe(true);
  });
});
