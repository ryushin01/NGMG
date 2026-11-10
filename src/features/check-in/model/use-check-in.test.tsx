import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useCheckins, useCreateCheckin } from '@/entities/checkin';
import type { Destination } from '@/entities/destination';
import { useCheckIn } from './use-check-in';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid' }));
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
}));
jest.mock('@/entities/checkin', () => ({ useCheckins: jest.fn(), useCreateCheckin: jest.fn() }));

const avalon = { id: 'avalon', latitude: 51.1442, longitude: -2.6986 } as Destination;

const setup = async () => {
  const mutateAsync = jest.fn(async (checkIn) => checkIn);
  jest.mocked(useCheckins).mockReturnValue({ data: [] } as never);
  jest.mocked(useCreateCheckin).mockReturnValue({ mutateAsync } as never);
  const { result } = await renderHook(() => useCheckIn());
  return { checkIn: result.current, mutateAsync };
};

const at = (latitude: number, longitude: number) => {
  jest
    .mocked(Location.requestForegroundPermissionsAsync)
    .mockResolvedValue({ granted: true } as never);
  jest
    .mocked(Location.getCurrentPositionAsync)
    .mockResolvedValue({ coords: { latitude, longitude } } as never);
};

it('3km 안이면 GPS 인증으로 저장합니다', async () => {
  at(51.15, -2.7);
  const { checkIn, mutateAsync } = await setup();
  const result = await checkIn(avalon);
  expect(result.status).toBe('stamped');
  expect(mutateAsync).toHaveBeenCalledWith(
    expect.objectContaining({ catalogId: 'avalon', method: 'gps' }),
  );
});

it('멀면 거리를 알려 주고 저장하지 않습니다', async () => {
  at(37.5665, 126.978);
  const { checkIn, mutateAsync } = await setup();
  const result = await checkIn(avalon);
  expect(result).toMatchObject({ status: 'far' });
  expect(mutateAsync).not.toHaveBeenCalled();
});

it('위치 권한이 없으면 저장하지 않습니다', async () => {
  jest
    .mocked(Location.requestForegroundPermissionsAsync)
    .mockResolvedValue({ granted: false } as never);
  const { checkIn, mutateAsync } = await setup();
  expect(await checkIn(avalon)).toEqual({ status: 'denied' });
  expect(mutateAsync).not.toHaveBeenCalled();
});

it('빠르게 두 번 눌러도 한 번만 저장합니다', async () => {
  const { checkIn, mutateAsync } = await setup();
  let results: unknown[] = [];
  await act(async () => {
    results = await Promise.all([checkIn(avalon, { demo: true }), checkIn(avalon, { demo: true })]);
  });
  expect(mutateAsync).toHaveBeenCalledTimes(1);
  expect(results).toContainEqual({ status: 'busy' });
  expect(results).toContainEqual(expect.objectContaining({ status: 'stamped' }));
});

it('위치를 오래 받지 못하면 마지막 위치를 쓰고, 그것도 없으면 오류로 끝내 다시 누를 수 있습니다', async () => {
  jest
    .mocked(Location.requestForegroundPermissionsAsync)
    .mockResolvedValue({ granted: true } as never);
  jest.mocked(Location.getCurrentPositionAsync).mockReturnValue(new Promise(() => undefined));
  jest.mocked(Location.getLastKnownPositionAsync).mockResolvedValue(null);
  const { checkIn, mutateAsync } = await setup();
  jest.useFakeTimers();
  try {
    const pending = checkIn(avalon);
    await jest.advanceTimersByTimeAsync(15000);
    expect(await pending).toEqual({ status: 'error' });
    expect(mutateAsync).not.toHaveBeenCalled();
    jest.mocked(Location.getLastKnownPositionAsync).mockResolvedValue({
      coords: { latitude: 51.15, longitude: -2.7 },
    } as never);
    const next = checkIn(avalon);
    await jest.advanceTimersByTimeAsync(15000);
    expect((await next).status).toBe('stamped');
  } finally {
    jest.useRealTimers();
  }
});

it('이미 있던 인증이 돌아오면 새 스탬프로 보지 않습니다', async () => {
  const { checkIn, mutateAsync } = await setup();
  const existing = { id: 'old', catalogId: 'avalon', checkedAt: '2026-11-01T00:00:00.000Z' };
  mutateAsync.mockResolvedValueOnce(existing as never);
  expect(await checkIn(avalon, { demo: true })).toEqual({ status: 'already', checkIn: existing });
});
