import { formatDay, formatCoordinate, formatPrice, parseOptionalNumber } from './format';

describe('parseOptionalNumber', () => {
  it('빈 값과 숫자가 아닌 값은 null입니다', () => {
    expect(parseOptionalNumber('  ')).toBeNull();
    expect(parseOptionalNumber('abc')).toBeNull();
  });
  it('쉼표를 제거하고 소수를 유지합니다', () => {
    expect(parseOptionalNumber('45,000')).toBe(45000);
    expect(parseOptionalNumber('19.5')).toBe(19.5);
  });
});

it('가격과 좌표를 표시 형식으로 바꿉니다', () => {
  expect(formatPrice(45000)).toBe('45,000원');
  expect(formatCoordinate(34.03, 127.3)).toBe('34.03000, 127.30000');
});

it('인증 날짜는 UTC가 아니라 기기 시간대의 날짜로 보여 줍니다', () => {
  expect(formatDay(new Date(2026, 10, 10, 0, 30).toISOString())).toBe('2026. 11. 10.');
});
