import type { Place } from '@/shared/api';
import { createPlaceIndex, getMapItems, regionToZoom } from './cluster';

const place = (id: string, latitude: number, longitude: number): Place => ({
  id,
  name: id,
  kind: 'fishing',
  address: '',
  latitude,
  longitude,
  memo: '',
  tags: [],
  recordCount: 0,
  lastVisitedAt: null,
  createdAt: '',
});

const near = [place('a', 34.0, 127.0), place('b', 34.001, 127.001)];

it('축소하면 가까운 장소를 묶고 확대하면 각각 보여 줍니다', () => {
  const index = createPlaceIndex(near);
  const far = getMapItems(index, {
    latitude: 34,
    longitude: 127,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });
  expect(far).toHaveLength(1);
  expect(far[0]).toMatchObject({ type: 'cluster', count: 2 });

  const close = getMapItems(index, {
    latitude: 34,
    longitude: 127,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
  });
  expect(close.map((item) => item.type)).toEqual(['place', 'place']);
});

it('영역 밖의 장소는 제외합니다', () => {
  const index = createPlaceIndex([place('jeju', 33.3, 126.5)]);
  expect(
    getMapItems(index, { latitude: 37, longitude: 127, latitudeDelta: 1, longitudeDelta: 1 }),
  ).toEqual([]);
});

it('경도 범위를 확대 수준으로 변환합니다', () => {
  expect(regionToZoom({ longitudeDelta: 360 })).toBe(0);
  expect(regionToZoom({ longitudeDelta: 0.35 })).toBe(10);
});
