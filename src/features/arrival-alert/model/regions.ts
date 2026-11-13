import type { LocationRegion } from 'expo-location';
import type { Destination } from '@/entities/destination';
import { distanceKm } from '@/shared/lib';

export const ARRIVAL_TASK = 'newworld-arrival';
/** iOS가 앱 하나에 동시에 지켜보는 지역은 20곳까지입니다. */
export const MAX_REGIONS = 20;
/** 현장 인증 반경과 같게 둡니다. */
export const ARRIVAL_RADIUS_M = 3000;
/**
 * 지켜볼 여행지는 등록할 때의 위치 기준이므로, 멀리 이동하면 새 위치에서 다시 골라야 합니다.
 * 현재 위치를 둘러싼 이 지역을 벗어나면 백그라운드 작업이 여행지를 다시 고릅니다.
 */
export const REFRESH_REGION_ID = 'newworld-refresh';
const REFRESH_RADIUS_M = 50000;

type Point = { latitude: number; longitude: number };

/** 아직 인증하지 않은 여행지 가운데 가까운 곳(최대 19곳)과 위치 갱신 지역 1곳을 고릅니다. */
export const pickRegions = (
  destinations: Destination[],
  checkedIds: ReadonlySet<string>,
  position: Point,
  limit = MAX_REGIONS,
): LocationRegion[] => {
  const nearest = destinations
    .filter((item) => !checkedIds.has(item.id))
    .map((item) => ({ item, distance: distanceKm(position, item) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit - 1)
    .map(({ item }) => ({
      identifier: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      radius: ARRIVAL_RADIUS_M,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));
  if (nearest.length === 0) return [];
  return [
    ...nearest,
    {
      identifier: REFRESH_REGION_ID,
      latitude: position.latitude,
      longitude: position.longitude,
      radius: REFRESH_RADIUS_M,
      notifyOnEnter: false,
      notifyOnExit: true,
    },
  ];
};
