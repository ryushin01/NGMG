import type { CheckIn } from '@/shared/api';
import { evaluateBadges, newlyEarned } from './badges';

jest.mock('@/entities/destination', () => {
  const make = (id: string, realm: string, group: string) => ({ id, realm, group });
  return {
    DESTINATIONS: [
      make('giza', 'real', '아프리카'),
      make('machu', 'real', '아메리카'),
      make('angkor', 'real', '아시아'),
      make('colosseum', 'real', '유럽'),
      make('rapa', 'real', '오세아니아'),
      make('stonehenge', 'real', '유럽'),
      make('avalon', 'fantasy', '켈트·아서왕'),
      make('camelot', 'fantasy', '켈트·아서왕'),
    ],
    COURSES: [{ id: 'arthur', title: '아서왕의 길', stops: ['stonehenge', 'camelot', 'avalon'] }],
  };
});

let n = 0;
const checkin = (catalogId: string, day: number): CheckIn => ({
  id: `c${(n += 1)}`,
  catalogId,
  checkedAt: `2026-11-${String(day).padStart(2, '0')}T09:00:00.000Z`,
  latitude: 0,
  longitude: 0,
  distanceKm: 0.5,
  method: 'gps',
});

const status = (checkins: CheckIn[], id: string) =>
  evaluateBadges(checkins).find((item) => item.badge.id === id);

it('첫 인증에 첫 발자국을, 환상 세계 연고지 인증에 전설을 걷다를 줍니다', () => {
  const list = [checkin('avalon', 3)];
  expect(status(list, 'first-step')).toMatchObject({ earned: true, earnedAt: list[0].checkedAt });
  expect(status(list, 'legend-walker')?.earned).toBe(true);
  expect(status(list, 'collector-5')).toMatchObject({ earned: false, current: 1, target: 5 });
});

it('목표를 채운 인증의 날짜가 획득일입니다', () => {
  const list = [1, 2, 3, 4, 5].map((day, i) =>
    checkin(['giza', 'machu', 'angkor', 'colosseum', 'rapa'][i], day),
  );
  expect(status(list, 'collector-5')?.earnedAt).toBe(list[4].checkedAt);
  expect(status(list, 'five-continents')).toMatchObject({ earned: true, current: 5 });
});

it('같은 대륙은 한 번만 셉니다', () => {
  const list = [checkin('colosseum', 1), checkin('stonehenge', 2)];
  expect(status(list, 'five-continents')).toMatchObject({ current: 1, earned: false });
});

it('코스의 모든 장소를 인증하면 완주 뱃지를 줍니다', () => {
  const list = [checkin('stonehenge', 1), checkin('camelot', 2), checkin('avalon', 3)];
  expect(status(list, 'course-arthur')).toMatchObject({ earned: true, current: 3, target: 3 });
});

it('이번 인증으로 새로 받은 뱃지만 골라냅니다', () => {
  const before = [checkin('stonehenge', 1), checkin('camelot', 2)];
  const after = [...before, checkin('avalon', 3)];
  expect(
    newlyEarned(before, after)
      .map((item) => item.badge.id)
      .sort(),
  ).toEqual(['course-arthur']);
});
