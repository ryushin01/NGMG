import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { DESTINATIONS } from '@/entities/destination';
import { storageAdapter } from '@/shared/lib';
import { pickRegions } from './regions';
import { ARRIVAL_TASK } from './task';

const ENABLED_KEY = 'newworld.arrival.enabled';

export const isArrivalAlertEnabled = () => storageAdapter.getItem(ENABLED_KEY) === '1';

export type EnableResult =
  'enabled' | 'location-denied' | 'background-denied' | 'notification-denied';

/** 위치(사용 중 → 항상)와 알림 권한을 차례로 받고 지역을 등록합니다. */
export const enableArrivalAlert = async (
  checkedIds: ReadonlySet<string>,
): Promise<EnableResult> => {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return 'location-denied';
  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) return 'background-denied';
  if (Platform.OS === 'android') {
    // Android 13 이상은 채널이 있어야 알림 권한 창이 뜹니다.
    await Notifications.setNotificationChannelAsync('arrival', {
      name: '여행지 도착',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const notification = await Notifications.requestPermissionsAsync();
  if (!notification.granted) return 'notification-denied';
  storageAdapter.setItem(ENABLED_KEY, '1');
  await syncArrivalRegions(checkedIds);
  return 'enabled';
};

const stopRegions = async () => {
  if (await Location.hasStartedGeofencingAsync(ARRIVAL_TASK).catch(() => false)) {
    await Location.stopGeofencingAsync(ARRIVAL_TASK);
  }
};

export const disableArrivalAlert = async () => {
  storageAdapter.removeItem(ENABLED_KEY);
  await stopRegions();
};

/** 켜져 있으면 지금 위치에서 가까운 미인증 여행지로 지역을 다시 고릅니다. '항상' 권한이 사라졌으면 설정도 끕니다. */
export const syncArrivalRegions = async (checkedIds: ReadonlySet<string>) => {
  if (!isArrivalAlertEnabled()) return;
  const { granted } = await Location.getBackgroundPermissionsAsync();
  if (!granted) {
    await disableArrivalAlert();
    return;
  }
  const position =
    (await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 })) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }).catch(() => null));
  if (!position) return;
  const regions = pickRegions(DESTINATIONS, checkedIds, position.coords);
  // 모두 인증했으면 지켜볼 곳이 없으므로 등록만 멈추고 설정은 그대로 둡니다.
  if (regions.length === 0) {
    await stopRegions();
    return;
  }
  await Location.startGeofencingAsync(ARRIVAL_TASK, regions);
};
