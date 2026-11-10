import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import { useRef } from 'react';
import { useCheckins, useCreateCheckin } from '@/entities/checkin';
import type { Destination } from '@/entities/destination';
import type { CheckIn } from '@/shared/api';
import { distanceKm } from '@/shared/lib';

/** 유적 단지와 연고지의 넓이를 고려해 3km 안이면 현장으로 봅니다. */
export const CHECK_IN_RADIUS_KM = 3;

export type CheckInResult =
  /** before·after는 인증 전후의 내 인증 목록입니다. 새 뱃지 계산에 씁니다. */
  | { status: 'stamped'; checkIn: CheckIn; before: CheckIn[]; after: CheckIn[] }
  | { status: 'far'; distance: number }
  | { status: 'denied' }
  | { status: 'error' }
  | { status: 'busy' };

/**
 * 현재 위치로 여행지 현장 인증을 합니다. 환상 세계는 화면에 보여 주는 현실의 연고지 좌표를 기준으로 합니다.
 * demo가 true면 위치를 묻지 않고 현장에 있는 것으로 처리합니다(데모 모드 전용).
 */
export const useCheckIn = () => {
  const checkins = useCheckins();
  const create = useCreateCheckin();
  // isPending은 다음 렌더에야 바뀌므로 빠른 연속 누름은 ref로 막습니다.
  const busy = useRef(false);

  return async (destination: Destination, { demo = false } = {}): Promise<CheckInResult> => {
    if (busy.current) return { status: 'busy' };
    busy.current = true;
    try {
      let { latitude, longitude } = destination;
      if (!demo) {
        const { granted } = await Location.requestForegroundPermissionsAsync().catch(() => ({
          granted: false,
        }));
        if (!granted) return { status: 'denied' };
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        ({ latitude, longitude } = coords);
      }
      const distance = distanceKm({ latitude, longitude }, destination);
      if (distance > CHECK_IN_RADIUS_KM) return { status: 'far', distance };
      const before = checkins.data ?? [];
      const saved = await create.mutateAsync({
        id: Crypto.randomUUID(),
        catalogId: destination.id,
        checkedAt: new Date().toISOString(),
        latitude,
        longitude,
        distanceKm: Math.round(distance * 1000) / 1000,
        method: demo ? 'demo' : 'gps',
      });
      const after = [...before.filter((item) => item.catalogId !== saved.catalogId), saved];
      return { status: 'stamped', checkIn: saved, before, after };
    } catch {
      return { status: 'error' };
    } finally {
      busy.current = false;
    }
  };
};
