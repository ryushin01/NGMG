import type { LocationRegion } from 'expo-location';
import type { Destination } from '@/entities/destination';
import { distanceKm } from '@/shared/lib';

/** iOS가 앱 하나에 동시에 지켜보는 지역은 20곳까지입니다. */
export const MAX_REGIONS = 20;
/** 현장 인증 반경과 같게 둡니다. */
export const ARRIVAL_RADIUS_M = 3000;

type Point = { latitude: number; longitude: number };

/** 아직 인증하지 않은 여행지 가운데 현재 위치에서 가까운 곳부터 지켜볼 지역으로 고릅니다. */
export const pickRegions = (
  destinations: Destination[],
  checkedIds: ReadonlySet<string>,
  position: Point,
  limit = MAX_REGIONS,
): LocationRegion[] =>
  destinations
    .filter((item) => !checkedIds.has(item.id))
    .map((item) => ({ item, distance: distanceKm(position, item) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ item }) => ({
      identifier: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      radius: ARRIVAL_RADIUS_M,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));
