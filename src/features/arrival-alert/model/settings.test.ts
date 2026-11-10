import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { DESTINATIONS } from '@/entities/destination';
import { enableArrivalAlert, isArrivalAlertEnabled, syncArrivalRegions } from './settings';

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock('expo-location', () => ({
  Accuracy: { Low: 2 },
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  getBackgroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  startGeofencingAsync: jest.fn(),
  stopGeofencingAsync: jest.fn(),
  hasStartedGeofencingAsync: jest.fn(async () => true),
}));

const grant = (foreground: boolean, background: boolean, notification: boolean) => {
  jest
    .mocked(Location.requestForegroundPermissionsAsync)
    .mockResolvedValue({ granted: foreground } as never);
  jest
    .mocked(Location.requestBackgroundPermissionsAsync)
    .mockResolvedValue({ granted: background } as never);
  jest
    .mocked(Location.getBackgroundPermissionsAsync)
    .mockResolvedValue({ granted: background } as never);
  jest
    .mocked(Notifications.requestPermissionsAsync)
    .mockResolvedValue({ granted: notification } as never);
  jest.mocked(Location.getLastKnownPositionAsync).mockResolvedValue({
    coords: { latitude: 51.1442, longitude: -2.6986 },
  } as never);
};

beforeEach(() => jest.clearAllMocks());

it.each([
  [false, true, true, 'location-denied'],
  [true, false, true, 'background-denied'],
  [true, true, false, 'notification-denied'],
] as const)('권한이 하나라도 없으면 켜지 않습니다', async (fg, bg, noti, expected) => {
  grant(fg, bg, noti);
  expect(await enableArrivalAlert(new Set())).toBe(expected);
  expect(isArrivalAlertEnabled()).toBe(false);
  expect(Location.startGeofencingAsync).not.toHaveBeenCalled();
});

it('모두 허락하면 가까운 미인증 여행지 19곳과 위치 갱신 지역을 지켜봅니다', async () => {
  grant(true, true, true);
  expect(await enableArrivalAlert(new Set(['avalon']))).toBe('enabled');
  expect(isArrivalAlertEnabled()).toBe(true);
  const regions = jest.mocked(Location.startGeofencingAsync).mock.calls[0][1] ?? [];
  expect(regions).toHaveLength(20);
  expect(regions.at(-1)).toMatchObject({ identifier: 'newworld-refresh', notifyOnExit: true });
  expect(regions.map((item) => item.identifier)).not.toContain('avalon');
  expect(regions[0].identifier).toBe('camelot');
});

it('모두 인증했으면 지켜보기만 멈추고 설정은 켜 둡니다', async () => {
  grant(true, true, true);
  await syncArrivalRegions(new Set(DESTINATIONS.map((item) => item.id)));
  expect(Location.stopGeofencingAsync).toHaveBeenCalledWith('newworld-arrival');
  expect(isArrivalAlertEnabled()).toBe(true);
});

it("'항상' 권한을 거두면 설정도 끕니다", async () => {
  grant(true, false, true);
  await syncArrivalRegions(new Set());
  expect(isArrivalAlertEnabled()).toBe(false);
  expect(Location.stopGeofencingAsync).toHaveBeenCalled();
});

it('백그라운드에서 다시 고를 때는 마지막으로 저장한 인증 목록을 씁니다', async () => {
  grant(true, true, true);
  await enableArrivalAlert(new Set(['camelot']));
  jest.mocked(Location.startGeofencingAsync).mockClear();
  await syncArrivalRegions();
  const regions = jest.mocked(Location.startGeofencingAsync).mock.calls[0][1] ?? [];
  expect(regions.map((item) => item.identifier)).not.toContain('camelot');
});
