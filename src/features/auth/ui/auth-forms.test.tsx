import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { backend } from '@/shared/api';
import { useRecoveryCodeStore } from '../model/recovery-store';
import { RecoverForm, SignUpForm } from './auth-forms';

jest.mock('expo-router', () => ({ Link: () => null, useRouter: () => ({ back: jest.fn() }) }));
jest.mock('sonner-native', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/shared/api', () => ({ backend: { auth: { signUp: jest.fn(), recover: jest.fn() } } }));

const show = (form = <SignUpForm />) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        {form}
      </TamaguiProvider>
    </QueryClientProvider>,
  );

beforeEach(() => useRecoveryCodeStore.getState().clear());

const fill = async () => {
  await fireEvent.changeText(screen.getByTestId('field-username'), 'RyuShin0');
  await fireEvent.changeText(screen.getByTestId('field-password'), 'password1');
  await fireEvent.changeText(screen.getByTestId('field-passwordConfirm'), 'password1');
  await fireEvent.changeText(screen.getByTestId('field-nickname'), '유신');
};

it('이메일 없이 아이디와 닉네임으로 가입하고, 아이디는 소문자로 맞춥니다', async () => {
  jest.mocked(backend.auth.signUp).mockResolvedValue({ recoveryCode: 'K7MQ2XWD9PTA' });
  await show();
  expect(screen.queryByLabelText(/이메일/)).toBeNull();
  await fill();
  await fireEvent.press(screen.getByTestId('sign-up-submit'));
  expect(backend.auth.signUp).toHaveBeenCalledWith({
    username: 'ryushin0',
    password: 'password1',
    nickname: '유신',
    name: '',
  });
  expect(useRecoveryCodeStore.getState().code).toBe('K7MQ2XWD9PTA');
});

it('빠르게 두 번 눌러도 한 번만 가입을 요청합니다', async () => {
  jest
    .mocked(backend.auth.signUp)
    .mockClear()
    .mockReturnValue(new Promise(() => undefined));
  await show();
  await fill();
  await fireEvent.press(screen.getByTestId('sign-up-submit'));
  await fireEvent.press(screen.getByTestId('sign-up-submit'));
  expect(backend.auth.signUp).toHaveBeenCalledTimes(1);
});

const fillRecover = async (code: string) => {
  await fireEvent.changeText(screen.getByTestId('field-username'), 'ryushin0');
  await fireEvent.changeText(screen.getByTestId('field-code'), code);
  await fireEvent.changeText(screen.getByTestId('field-password'), 'password2');
  await fireEvent.changeText(screen.getByTestId('field-passwordConfirm'), 'password2');
};

it('복구 코드 형식이 틀리면 보내지 않고 이유를 알려 줍니다', async () => {
  await show(<RecoverForm />);
  await fillRecover('1234-0000');
  await fireEvent.press(screen.getByTestId('recover-submit'));
  expect(backend.auth.recover).not.toHaveBeenCalled();
  expect(screen.getByText('복구 코드는 영문과 숫자 12자입니다.')).toBeTruthy();
});

it('하이픈과 소문자를 맞춰 보내고, 성공하면 새 복구 코드를 보여 주며 두 번 눌러도 한 번만 보냅니다', async () => {
  jest
    .mocked(backend.auth.recover)
    .mockResolvedValue({ recoveryCode: 'NEWC0DE00000'.replace(/0/g, '2') });
  await show(<RecoverForm />);
  await fillRecover('k7mq-2xwd-9pta');
  await fireEvent.press(screen.getByTestId('recover-submit'));
  await fireEvent.press(screen.getByTestId('recover-submit'));
  expect(backend.auth.recover).toHaveBeenCalledTimes(1);
  expect(backend.auth.recover).toHaveBeenCalledWith({
    username: 'ryushin0',
    code: 'K7MQ2XWD9PTA',
    password: 'password2',
  });
  expect(useRecoveryCodeStore.getState().code).toBe('NEWC2DE22222');
});
