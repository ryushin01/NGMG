import { mergeSearchResults, pickReverseAddress } from './normalize';

it('주소 결과를 먼저 두고 중복과 잘못된 좌표를 제거합니다', () => {
  const results = mergeSearchResults(
    [{ address_name: '전남 여수시 교동', x: '127.73', y: '34.74' }],
    [
      {
        id: '1',
        place_name: '수산시장',
        road_address_name: '여수시 도로 1',
        x: '127.74',
        y: '34.75',
      },
      {
        id: '1',
        place_name: '수산시장',
        road_address_name: '여수시 도로 1',
        x: '127.74',
        y: '34.75',
      },
      { id: '2', place_name: '좌표 오류', x: 'bad', y: '34' },
    ],
  );
  expect(results.map((item) => item.name)).toEqual(['전남 여수시 교동', '수산시장']);
  expect(results[1]).toMatchObject({
    latitude: 34.75,
    longitude: 127.74,
    address: '여수시 도로 1',
  });
});

it('도로명 주소를 우선하고 없으면 지번을 씁니다', () => {
  expect(
    pickReverseAddress([
      { road_address: { address_name: '도로' }, address: { address_name: '지번' } },
    ]),
  ).toBe('도로');
  expect(pickReverseAddress([{ road_address: null, address: { address_name: '지번' } }])).toBe(
    '지번',
  );
  expect(pickReverseAddress([])).toBe('');
});
