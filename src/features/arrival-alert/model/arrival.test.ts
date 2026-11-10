import * as Notifications from 'expo-notifications';
import { arrivalMessage, notifyArrival, QUIET_MS } from './arrival';

jest.mock('expo-notifications', () => ({ scheduleNotificationAsync: jest.fn() }));

it('환상 세계는 연고지에 도착했다고 알리고 상세 화면 주소를 담습니다', () => {
  expect(arrivalMessage('avalon')).toEqual({
    title: '아발론 근처에 왔어요',
    body: '현실의 연고지에 도착했습니다. 현장 인증으로 여권에 스탬프를 찍어 보세요.',
    data: { url: '/destination/avalon' },
  });
  expect(arrivalMessage('없는곳')).toBeNull();
});

it('같은 곳은 12시간 안에 다시 알리지 않습니다', async () => {
  const now = 1_800_000_000_000;
  expect(await notifyArrival('petra', now)).toBe(true);
  expect(await notifyArrival('petra', now + QUIET_MS - 1)).toBe(false);
  expect(await notifyArrival('petra', now + QUIET_MS)).toBe(true);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({ trigger: null }),
  );
});

it('동시에 들어온 도착 이벤트에도 한 번만 알립니다', async () => {
  jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
  const now = 1_900_000_000_000;
  const results = await Promise.all([notifyArrival('giza', now), notifyArrival('giza', now)]);
  expect(results.filter(Boolean)).toHaveLength(1);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});

it('Android에서는 도착 알림 전용 채널로 보냅니다', async () => {
  const { Platform } = jest.requireActual<typeof import('react-native')>('react-native');
  const original = Platform.OS;
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  try {
    jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
    await notifyArrival('karnak', 2_000_000_000_000);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: { channelId: 'arrival' } }),
    );
  } finally {
    Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
  }
});
