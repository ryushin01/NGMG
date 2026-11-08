import { distanceKm, formatDistance } from './geo';

it('서울에서 페트라까지의 거리를 구합니다', () => {
  const km = distanceKm(
    { latitude: 37.5665, longitude: 126.978 },
    { latitude: 30.3285, longitude: 35.4444 },
  );
  expect(km).toBeGreaterThan(7800);
  expect(km).toBeLessThan(8300);
});

it('같은 좌표는 0km입니다', () => {
  const point = { latitude: 10, longitude: 20 };
  expect(distanceKm(point, point)).toBe(0);
});

it('가까우면 소수 한 자리, 멀면 정수로 표시합니다', () => {
  expect(formatDistance(3.26)).toBe('3.3km');
  expect(formatDistance(1234.6)).toBe('1,235km');
});
