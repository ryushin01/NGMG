import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useToday } from './use-today';

beforeEach(() => jest.useFakeTimers({ now: new Date(2026, 10, 10, 23, 59, 0) }));
afterEach(() => jest.useRealTimers());

it('자정이 지나면 다음 날짜로 바뀝니다', async () => {
  const { result } = await renderHook(() => useToday());
  expect(result.current.getDate()).toBe(10);
  await act(async () => {
    jest.advanceTimersByTime(2 * 60 * 1000);
  });
  expect(result.current.getDate()).toBe(11);
});

it('같은 날 앱으로 돌아오면 같은 값을 유지하고, 다음 날이면 바꿉니다', async () => {
  const listeners: ((state: string) => void)[] = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
    listeners.push(listener as never);
    return { remove: () => undefined } as never;
  });
  const { result } = await renderHook(() => useToday());
  const first = result.current;
  await act(async () => listeners.at(-1)?.('active'));
  expect(result.current).toBe(first);
  jest.setSystemTime(new Date(2026, 10, 12, 9, 0, 0));
  await act(async () => listeners.at(-1)?.('active'));
  expect(result.current.getDate()).toBe(12);
});
