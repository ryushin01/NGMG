import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { useRecoveryCodeStore } from '../model/recovery-store';
import { RecoveryCodeModal } from './recovery-code-modal';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('sonner-native', () => ({ toast: { success: jest.fn() } }));

const show = () =>
  render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <RecoveryCodeModal />
    </TamaguiProvider>,
  );

it('코드가 없으면 보이지 않습니다', async () => {
  useRecoveryCodeStore.getState().clear();
  await show();
  expect(screen.queryByTestId('recovery-code-modal')).toBeNull();
});

it('4자씩 끊어 보여 주고 복사하며, 보관했다고 하면 코드를 지웁니다', async () => {
  await show();
  await act(async () => useRecoveryCodeStore.getState().show('K7MQ2XWD9PTA'));
  expect(screen.getByTestId('recovery-code')).toHaveTextContent('K7MQ-2XWD-9PTA');
  expect(screen.getByLabelText('복구 코드 K 7 M Q - 2 X W D - 9 P T A')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('recovery-code-copy'));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith('K7MQ-2XWD-9PTA');
  await fireEvent.press(screen.getByTestId('recovery-code-done'));
  expect(useRecoveryCodeStore.getState().code).toBeNull();
});
