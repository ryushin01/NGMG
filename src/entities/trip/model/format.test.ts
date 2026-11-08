import { formatTripDates } from './format';

it('날짜 입력 상태에 맞게 표시합니다', () => {
  expect(formatTripDates({ startDate: '2027-05-01', endDate: '2027-05-09' })).toBe(
    '2027.05.01 ~ 2027.05.09',
  );
  expect(formatTripDates({ startDate: '2027-05-01', endDate: null })).toBe('2027.05.01 출발');
  expect(formatTripDates({ startDate: null, endDate: '2027-05-09' })).toBe('2027.05.09 귀국');
  expect(formatTripDates({ startDate: null, endDate: null })).toBe('날짜 미정');
});
