import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { useSyncState } from '@/shared/api';
import { SyncBanner } from './sync-banner';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/shared/api', () => ({ useSyncState: jest.fn() }));

const show = (online: boolean, statuses: string[]) => {
  jest.mocked(useSyncState).mockReturnValue({
    online,
    ops: statuses.map((status, index) => ({ id: String(index), status })),
  } as never);
  return render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <SyncBanner />
    </TamaguiProvider>,
  );
};

it('연결되어 있고 대기가 없으면 보이지 않습니다', async () => {
  await show(true, []);
  expect(screen.queryByTestId('sync-banner')).toBeNull();
});

it.each([
  [false, [], '오프라인, 동기화 화면 열기'],
  [true, ['pending', 'pending'], '동기화 대기 2건, 동기화 화면 열기'],
  [true, ['pending', 'failed'], '동기화 실패 1건, 동기화 화면 열기'],
])('상태에 맞는 문구를 보여 주고 동기화 화면으로 갑니다', async (online, statuses, label) => {
  await show(online, statuses);
  await fireEvent.press(screen.getByLabelText(label));
  expect(mockPush).toHaveBeenCalledWith('/sync');
});
