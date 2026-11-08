import type { Destination } from '@/entities/destination';
import type { Place } from '@/shared/api';
import { mergeCatalogPlaces, toCatalogPlaceInput } from './merge';

const destination = {
  id: 'petra',
  realm: 'real',
  name: '페트라',
  location: '요르단',
  latitude: 30,
  longitude: 35,
  group: '아시아',
} as Destination;

const saved = (overrides: Partial<Place>): Place => ({
  ...toCatalogPlaceInput(destination, true),
  id: 'p1',
  recordCount: 2,
  lastVisitedAt: null,
  createdAt: '',
  ...overrides,
});

it('저장하지 않은 여행지는 임시 id로 지도에 나옵니다', () => {
  expect(mergeCatalogPlaces([destination], [])).toMatchObject([
    { id: 'catalog:petra', catalogId: 'petra', wishlisted: false },
  ]);
});

it('저장한 여행지는 저장된 행으로 대체되고 중복되지 않습니다', () => {
  const merged = mergeCatalogPlaces([destination], [saved({})]);
  expect(merged).toHaveLength(1);
  expect(merged[0]).toMatchObject({ id: 'p1', recordCount: 2 });
});

it('직접 추가한 장소를 뒤에 붙입니다', () => {
  const custom = saved({ id: 'c1', catalogId: null, name: '내 장소' });
  expect(mergeCatalogPlaces([destination], [custom]).map((place) => place.id)).toEqual([
    'catalog:petra',
    'c1',
  ]);
});
