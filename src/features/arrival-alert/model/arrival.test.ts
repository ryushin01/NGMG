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
