import { isValidCoordinate, normalizeResults, pickReverseAddress } from './normalize';

it('중복과 잘못된 좌표를 제거하고 이름이 없으면 주소 첫 부분을 씁니다', () => {
  const results = normalizeResults([
    { place_id: 1, name: '쿠스코', display_name: '쿠스코, 페루', lat: '-13.5', lon: '-71.9' },
    { place_id: 2, name: '쿠스코', display_name: '쿠스코, 페루', lat: '-13.5', lon: '-71.9' },
    { place_id: 3, display_name: '룩소르, 이집트', lat: '25.6', lon: '32.6' },
    { place_id: 4, name: '좌표 오류', display_name: '오류', lat: 'bad', lon: '1' },
  ]);
  expect(results.map((item) => item.name)).toEqual(['쿠스코', '룩소르']);
  expect(results[1]).toMatchObject({ id: 'osm:3', latitude: 25.6, longitude: 32.6 });
});

it('주소가 없으면 빈 문자열을 돌려줍니다', () => {
  expect(pickReverseAddress({ display_name: '페트라, 요르단' })).toBe('페트라, 요르단');
  expect(pickReverseAddress(null)).toBe('');
});

it('주소와 이름이 모두 없는 결과는 건너뜁니다', () => {
  expect(normalizeResults([{ place_id: 5, lat: '1', lon: '1' }])).toEqual([]);
});

it('좌표 범위를 벗어나거나 숫자가 아니면 거부합니다', () => {
  expect(isValidCoordinate(-13.5, -71.9)).toBe(true);
  expect(isValidCoordinate(91, 0)).toBe(false);
  expect(isValidCoordinate(0, 181)).toBe(false);
  expect(isValidCoordinate(Number.NaN, 0)).toBe(false);
  expect(isValidCoordinate('1', 0)).toBe(false);
});
