import { fireEvent, render, screen } from '@testing-library/react-native';
import { toast } from 'sonner-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { useCheckins } from '@/entities/checkin';
import { findDestination } from '@/entities/destination';
import { useCheckIn } from '@/features/check-in';
import { CheckInPanel } from './check-in-panel';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('sonner-native', () => ({ toast: { error: jest.fn() } }));
jest.mock('@/shared/config', () => ({ isSupabaseConfigured: false }));
jest.mock('@/entities/checkin', () => ({ useCheckins: jest.fn() }));
jest.mock('@/features/check-in', () => ({ CHECK_IN_RADIUS_KM: 3, useCheckIn: jest.fn() }));

const avalon = findDestination('avalon')!;
const checkIn = {
  id: 'k',
  catalogId: 'avalon',
  checkedAt: '2026-11-10T09:00:00.000Z',
  latitude: 51.1442,
  longitude: -2.6986,
  distanceKm: 0,
  method: 'demo' as const,
};

const show = async (data: (typeof checkIn)[] = [], result: unknown = null) => {
  const run = jest.fn().mockResolvedValue(result);
  jest.mocked(useCheckins).mockReturnValue({ data } as never);
  jest.mocked(useCheckIn).mockReturnValue(run);
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <CheckInPanel destination={avalon} />
    </TamaguiProvider>,
  );
  return run;
};

it('데모 인증으로 스탬프를 찍으면 축하 화면과 새 뱃지를 보여 줍니다', async () => {
  const run = await show([], { status: 'stamped', checkIn, before: [], after: [checkIn] });
  await fireEvent.press(screen.getByTestId('checkin-demo'));
  expect(run).toHaveBeenCalledWith(avalon, { demo: true });
  expect(screen.getByText('스탬프를 찍었어요')).toBeTruthy();
  expect(screen.getByTestId('badge-first-step')).toBeTruthy();
  expect(screen.getByTestId('badge-legend-walker')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('checkin-passport'));
  expect(mockPush).toHaveBeenCalledWith('/passport');
});

it('현장에서 멀면 거리와 함께 다시 시도하라고 알립니다', async () => {
  await show([], { status: 'far', distance: 8650 });
  await fireEvent.press(screen.getByTestId('checkin-gps'));
  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('연고지에서 8,650km'));
});

it('이미 인증했으면 날짜와 인증 방식을 보여 주고 버튼을 숨깁니다', async () => {
  await show([checkIn]);
  expect(screen.getByTestId('checkin-done')).toHaveTextContent(
    /2026\. 11\. 10\. 인증했어요 \(데모 인증\)/,
  );
  expect(screen.queryByTestId('checkin-gps')).toBeNull();
});
