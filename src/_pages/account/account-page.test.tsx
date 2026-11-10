import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { useExportData } from '@/features/data-export';
import { AccountPage } from './account-page';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('expo-constants', () => ({ expoConfig: { version: '1.0.0' } }));
jest.mock('sonner-native', () => ({ toast: { error: jest.fn() } }));
jest.mock('@/shared/ui/header', () => ({ Header: () => null }));
jest.mock('@/entities/profile', () => ({
  ProfileAvatar: () => null,
  useProfile: () => ({ data: { nickname: '여행자', name: null, avatarUrl: null } }),
}));
jest.mock('@/entities/checklist', () => ({
  summarizeChecklist: () => '0/0',
  useChecklist: () => ({ data: [] }),
}));
jest.mock('@/entities/checkin', () => ({ useCheckins: () => ({ data: [] }) }));
jest.mock('@/entities/session', () => ({
  useSessionStore: (select: (state: unknown) => unknown) =>
    select({ session: { userId: 'u1', username: 'traveler' } }),
}));
jest.mock('@/features/arrival-alert', () => ({ ArrivalAlertSwitch: () => null }));
jest.mock('@/features/data-export', () => ({ useExportData: jest.fn() }));
jest.mock('@/shared/api', () => ({
  backend: { mode: 'supabase', auth: { signOut: jest.fn(), deleteAccount: jest.fn() } },
  isDemoOffline: () => false,
  setDemoOffline: jest.fn(),
  sync: { flush: jest.fn() },
  useSyncState: () => ({ ops: [] }),
}));
jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

const show = (mutate: jest.Mock, state: object = {}) => {
  jest.mocked(useExportData).mockReturnValue({ mutate, isPending: false, ...state } as never);
  return render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <AccountPage />
    </TamaguiProvider>,
  );
};

it('내보내기를 빠르게 두 번 눌러도 한 번만 실행하고, 끝나면 다시 누를 수 있습니다', async () => {
  const mutate = jest.fn();
  await show(mutate);
  await fireEvent.press(screen.getByTestId('export-json'));
  await fireEvent.press(screen.getByTestId('export-json'));
  expect(mutate).toHaveBeenCalledTimes(1);
  expect(mutate.mock.calls[0][0]).toBe('json');
  mutate.mock.calls[0][1].onSettled();
  await fireEvent.press(screen.getByTestId('export-csv'));
  expect(mutate).toHaveBeenCalledTimes(2);
  expect(mutate.mock.calls[1][0]).toBe('csv');
});

it('내보내는 동안 누른 버튼에 진행 중을 표시합니다', async () => {
  await show(jest.fn(), { isPending: true, variables: 'csv' });
  expect(screen.getByTestId('export-csv').props.accessibilityState).toMatchObject({ busy: true });
  expect(screen.getByTestId('export-json').props.accessibilityState).toMatchObject({ busy: false });
});

it('계정 정보를 보여 줍니다', async () => {
  await show(jest.fn());
  expect(screen.getByLabelText('여행자, 아이디 traveler')).toBeTruthy();
  expect(screen.getByTestId('my-password')).toBeTruthy();
});
