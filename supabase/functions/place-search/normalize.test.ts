import { isValidCoordinate, normalizeResults, pickReverseAddress } from './normalize';

const feature = (name: string | undefined, coordinates: [number, number], osm_id = 1) => ({
  properties: { osm_type: 'R', osm_id, name, state: 'Cusco', country: 'Perú' },
  geometry: { coordinates },
});

it('경도·위도 순서를 바꾸고 중복과 잘못된 결과를 제거합니다', () => {
  const results = normalizeResults([
    feature('Machu Picchu', [-72.5, -13.1]),
    feature('Machu Picchu', [-72.5, -13.1], 2),
    feature(undefined, [1, 1], 3),
    { properties: { name: '좌표 없음' } },
  ]);
  expect(results.map((item) => item.name)).toEqual(['Machu Picchu', 'Cusco']);
  expect(results[0]).toMatchObject({
    id: 'osm:R1',
    latitude: -13.1,
    longitude: -72.5,
    address: 'Cusco, Perú',
  });
});

it('이름과 같은 지역 단위는 주소에서 뺍니다', () => {
  expect(normalizeResults([feature('Cusco', [-72.5, -12.5])])[0].address).toBe('Perú');
});

it('좌표로 찾은 주소를 잇고 결과가 없으면 빈 문자열을 돌려줍니다', () => {
  expect(pickReverseAddress([feature('Petra', [35, 30])])).toBe('Petra, Cusco, Perú');
  expect(pickReverseAddress([])).toBe('');
});

it('좌표 범위를 벗어나거나 숫자가 아니면 거부합니다', () => {
  expect(isValidCoordinate(-13.5, -71.9)).toBe(true);
  expect(isValidCoordinate(91, 0)).toBe(false);
  expect(isValidCoordinate(0, 181)).toBe(false);
  expect(isValidCoordinate(Number.NaN, 0)).toBe(false);
  expect(isValidCoordinate('1', 0)).toBe(false);
});
