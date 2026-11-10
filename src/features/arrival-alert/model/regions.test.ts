import type { Destination } from '@/entities/destination';
import { ARRIVAL_RADIUS_M, pickRegions } from './regions';

const at = (id: string, latitude: number, longitude: number) =>
  ({ id, latitude, longitude }) as Destination;

const list = [
  at('far', 0, 0),
  at('near', 51.15, -2.7),
  at('mid', 48.09, -4.33),
  at('done', 51.14, -2.69),
];

it('인증한 곳을 빼고 가까운 순으로 고르며, 마지막 칸은 현재 위치를 둘러싼 갱신 지역입니다', () => {
  const regions = pickRegions(
    list,
    new Set(['done']),
    { latitude: 51.1442, longitude: -2.6986 },
    3,
  );
  expect(regions.map((item) => item.identifier)).toEqual(['near', 'mid', 'newworld-refresh']);
  expect(regions[0]).toMatchObject({
    radius: ARRIVAL_RADIUS_M,
    notifyOnEnter: true,
    notifyOnExit: false,
  });
});

it('모두 인증했으면 지켜볼 곳이 없습니다', () => {
  expect(
    pickRegions(list, new Set(list.map((item) => item.id)), { latitude: 0, longitude: 0 }),
  ).toEqual([]);
});

it('갱신 지역은 현재 위치 중심 50km이고 벗어날 때만 알립니다', () => {
  const regions = pickRegions(list, new Set(), { latitude: 10, longitude: 20 });
  expect(regions.at(-1)).toEqual({
    identifier: 'newworld-refresh',
    latitude: 10,
    longitude: 20,
    radius: 50000,
    notifyOnEnter: false,
    notifyOnExit: true,
  });
});
