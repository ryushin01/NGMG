import type { Place } from '@/shared/api';
import { isListedPlace } from './listed';

const place = (overrides: Partial<Place>) =>
  ({ catalogId: 'petra', wishlisted: false, recordCount: 0, ...overrides }) as Place;

it('하트를 끄고 기록이 없는 수록 여행지는 숨깁니다', () => {
  expect(isListedPlace(place({}))).toBe(false);
});

it('찜했거나 기록이 있거나 직접 추가한 장소는 보여 줍니다', () => {
  expect(isListedPlace(place({ wishlisted: true }))).toBe(true);
  expect(isListedPlace(place({ recordCount: 1 }))).toBe(true);
  expect(isListedPlace(place({ catalogId: null }))).toBe(true);
});
