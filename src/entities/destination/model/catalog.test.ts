import { DESTINATIONS, findDestination, searchDestinations } from './catalog';

jest.mock('./images', () => {
  const entry = { image: 1, imageCredit: { author: 'a', license: 'CC0', url: 'https://x' } };
  return { DESTINATION_IMAGES: new Proxy({}, { get: () => entry }) };
});

it('실존과 환상 여행지를 모두 수록합니다', () => {
  expect(DESTINATIONS.filter((item) => item.realm === 'real').length).toBeGreaterThanOrEqual(25);
  expect(DESTINATIONS.filter((item) => item.realm === 'fantasy').length).toBeGreaterThanOrEqual(20);
});

it('id가 겹치지 않고 좌표가 유효합니다', () => {
  expect(new Set(DESTINATIONS.map((item) => item.id)).size).toBe(DESTINATIONS.length);
  for (const item of DESTINATIONS) {
    expect(Math.abs(item.latitude)).toBeLessThanOrEqual(90);
    expect(Math.abs(item.longitude)).toBeLessThanOrEqual(180);
  }
});

it('모든 여행지에 출처를 답니다', () => {
  for (const item of DESTINATIONS) {
    expect(item.sources.length).toBeGreaterThan(0);
    for (const source of item.sources) expect(source.url).toMatch(/^https:\/\//);
  }
});

it('이름, 원어, 지역으로 찾고 실존·환상을 가릅니다', () => {
  expect(searchDestinations('avalon').map((item) => item.id)).toEqual(['avalon']);
  expect(searchDestinations('페루', 'real').map((item) => item.id)).toContain('machu-picchu');
  expect(searchDestinations('마추픽추', 'fantasy')).toEqual([]);
  expect(findDestination('없는곳')).toBeUndefined();
});
