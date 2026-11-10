import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import { useRef } from 'react';
import { useCheckins, useCreateCheckin } from '@/entities/checkin';
import type { Destination } from '@/entities/destination';
import type { CheckIn } from '@/shared/api';
import { distanceKm } from '@/shared/lib';

/** 유적 단지와 연고지의 넓이를 고려해 3km 안이면 현장으로 봅니다. */
export const CHECK_IN_RADIUS_KM = 3;

/** 실내처럼 위치를 받지 못하면 요청이 끝나지 않을 수 있어 이 시간 뒤에는 마지막 위치로 대신합니다. */
export const LOCATION_TIMEOUT_MS = 15000;

const currentCoords = async () => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS);
  });
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      timeout,
    ]);
    if (position) return position.coords;
    // 2분 안에 받은 위치만 현장으로 인정합니다.
    const last = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
    return last?.coords ?? null;
  } finally {
    clearTimeout(timer);
  }
};

export type CheckInResult =
  /** before·after는 인증 전후의 내 인증 목록입니다. 새 뱃지 계산에 씁니다. */
  | { status: 'stamped'; checkIn: CheckIn; before: CheckIn[]; after: CheckIn[] }
  /** 다른 기기에서 먼저 인증했거나 목록이 늦게 받아져 이미 찍혀 있던 경우 */
  | { status: 'already'; checkIn: CheckIn }
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
        const coords = await currentCoords();
        if (!coords) return { status: 'error' };
        ({ latitude, longitude } = coords);
      }
      const distance = distanceKm({ latitude, longitude }, destination);
      if (distance > CHECK_IN_RADIUS_KM) return { status: 'far', distance };
      const before = checkins.data ?? [];
      const id = Crypto.randomUUID();
      const saved = await create.mutateAsync({
        id,
        catalogId: destination.id,
        checkedAt: new Date().toISOString(),
        latitude,
        longitude,
        distanceKm: Math.round(distance * 1000) / 1000,
        method: demo ? 'demo' : 'gps',
      });
      // 서버나 기기에 이미 있던 인증이 돌아오면 새 스탬프로 축하하지 않습니다.
      if (saved.id !== id) return { status: 'already', checkIn: saved };
      const after = [...before.filter((item) => item.catalogId !== saved.catalogId), saved];
      return { status: 'stamped', checkIn: saved, before, after };
    } catch {
      return { status: 'error' };
    } finally {
      busy.current = false;
    }
  };
};
