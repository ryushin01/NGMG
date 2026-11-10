import { act, renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { useNotificationLink } from './use-notification-link';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
let mockListener: (response: unknown) => void = () => undefined;
jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'default',
  getLastNotificationResponseAsync: jest.fn(async () => null),
  clearLastNotificationResponseAsync: jest.fn(async () => undefined),
  addNotificationResponseReceivedListener: (listener: (response: unknown) => void) => {
    mockListener = listener;
    return { remove: () => undefined };
  },
}));

const response = (url: unknown, actionIdentifier = 'default') => ({
  actionIdentifier,
  notification: { request: { content: { data: { url } } } },
});

beforeEach(() => mockPush.mockClear());

it('화면이 준비된 뒤 알림의 여행지 화면을 엽니다', async () => {
  const { rerender } = await renderHook<void, { ready: boolean }>(
    ({ ready }) => useNotificationLink(ready),
    {
      initialProps: { ready: false },
    },
  );
  await act(async () => mockListener(response('/destination/avalon')));
  expect(mockPush).not.toHaveBeenCalled();
  await rerender({ ready: true });
  expect(mockPush).toHaveBeenCalledWith('/destination/avalon');
});

it('앱이 만든 여행지 주소가 아니면 열지 않습니다', async () => {
  await renderHook(() => useNotificationLink(true));
  await act(async () => mockListener(response('https://example.com')));
  await act(async () => mockListener(response('/destination/avalon', 'other-action')));
  expect(mockPush).not.toHaveBeenCalled();
});

it('꺼진 앱이 알림으로 열렸으면 그 주소로 갑니다', async () => {
  jest
    .mocked(Notifications.getLastNotificationResponseAsync)
    .mockResolvedValueOnce(response('/destination/petra') as never);
  await renderHook(() => useNotificationLink(true));
  await act(async () => undefined);
  expect(mockPush).toHaveBeenCalledWith('/destination/petra');
  expect(Notifications.clearLastNotificationResponseAsync).toHaveBeenCalled();
});
