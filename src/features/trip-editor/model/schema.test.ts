import { moveStop, tripSchema } from './schema';

const trip = { title: '코스', startDate: null, endDate: null, stops: ['a'], memo: '' };

it('이름과 여행지가 있어야 합니다', () => {
  expect(tripSchema.safeParse(trip).success).toBe(true);
  expect(tripSchema.safeParse({ ...trip, title: ' ' }).success).toBe(false);
  expect(tripSchema.safeParse({ ...trip, stops: [] }).success).toBe(false);
});

it('돌아오는 날이 출발일보다 빠르면 거부합니다', () => {
  const dates = { startDate: '2027-05-09', endDate: '2027-05-01' };
  expect(tripSchema.safeParse({ ...trip, ...dates }).success).toBe(false);
  expect(tripSchema.safeParse({ ...trip, startDate: '2027-05-01' }).success).toBe(true);
});

it('경유지 순서를 바꾸고 끝에서는 그대로 둡니다', () => {
  expect(moveStop(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
  expect(moveStop(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
  expect(moveStop(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
});
