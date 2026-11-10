import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { backend } from '@/shared/api';
import { SignUpForm } from './auth-forms';

jest.mock('expo-router', () => ({ Link: () => null, useRouter: () => ({ back: jest.fn() }) }));
jest.mock('sonner-native', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/shared/api', () => ({ backend: { auth: { signUp: jest.fn() } } }));

const show = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <SignUpForm />
      </TamaguiProvider>
    </QueryClientProvider>,
  );

const fill = async () => {
  await fireEvent.changeText(screen.getByTestId('field-username'), 'RyuShin0');
  await fireEvent.changeText(screen.getByTestId('field-password'), 'password1');
  await fireEvent.changeText(screen.getByTestId('field-passwordConfirm'), 'password1');
  await fireEvent.changeText(screen.getByTestId('field-nickname'), '유신');
};

it('이메일 없이 아이디와 닉네임으로 가입하고, 아이디는 소문자로 맞춥니다', async () => {
  jest.mocked(backend.auth.signUp).mockResolvedValue();
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
