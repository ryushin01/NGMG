import type { TripRecord } from '@/shared/api';
import { recordsToCsv, toBackupJson } from './serialize';

const record = {
  visitedAt: '2026-11-01',
  placeKind: 'real',
  placeName: '페트라, 동쪽',
  title: '=SUM(A1)',
  partySize: 2,
  members: ['민수', '지훈'],
  memo: '줄\n바꿈 "따옴표"',
  rating: null,
  weather: '',
  temperature: null,
  transport: '',
  lodging: '',
  cost: null,
  currency: 'KRW',
  highlights: '',
  gateway: '',
  encounters: '',
  souvenir: '',
  photos: [{ id: '1', path: 'u/r/a.jpg', url: 'https://signed', width: 1, height: 1 }],
} as unknown as TripRecord;

it('CSV 값을 이스케이프하고 수식 실행을 막습니다', () => {
  const csv = recordsToCsv([record]);
  expect(csv.startsWith('﻿날짜,분류')).toBe(true);
  expect(csv).toContain('"페트라, 동쪽"');
  expect(csv).toContain("'=SUM(A1)");
  expect(csv).toContain('"줄\n바꿈 ""따옴표"""');
  expect(csv).toContain('민수 / 지훈');
});

it('JSON 백업에는 서명 URL을 넣지 않습니다', () => {
  const json = toBackupJson([], [record], [], '2026-11-06');
  expect(json).not.toContain('https://signed');
  expect(JSON.parse(json).records[0].photos[0].path).toBe('u/r/a.jpg');
});
