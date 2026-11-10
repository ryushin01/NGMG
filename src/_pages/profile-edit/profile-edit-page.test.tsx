import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { useProfile, useUpdateProfile } from '@/entities/profile';
import { ProfileEditPage } from './profile-edit-page';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('sonner-native', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/shared/ui/header', () => ({ Header: () => null, HeaderTextButton: () => null }));
jest.mock('@/entities/profile', () => ({
  ProfileAvatar: () => null,
  useProfile: jest.fn(),
  useUpdateProfile: jest.fn(),
}));

const profile = { nickname: '유신', name: '홍길동', avatarUrl: 'file:///avatar.jpg' };

const show = (query: object, mutate = jest.fn()) => {
  jest.mocked(useProfile).mockReturnValue(query as never);
  jest.mocked(useUpdateProfile).mockReturnValue({ mutate, isPending: false } as never);
  return render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <ProfileEditPage />
    </TamaguiProvider>,
  );
};

it('프로필을 불러오지 못하면 안내와 다시 시도 버튼을 보여 줍니다', async () => {
  const refetch = jest.fn();
  await show({ data: undefined, isError: true, error: new Error('x'), refetch });
  expect(screen.getByText('프로필을 불러오지 못했습니다.')).toBeTruthy();
  await fireEvent.press(screen.getByText('다시 시도'));
  expect(refetch).toHaveBeenCalled();
});

it('빠르게 두 번 눌러도 한 번만 저장하고, 사진을 그대로 두면 사진 값을 보내지 않습니다', async () => {
  const mutate = jest.fn();
  await show({ data: profile, isError: false }, mutate);
  await fireEvent.press(screen.getByTestId('profile-save'));
  await fireEvent.press(screen.getByTestId('profile-save'));
  expect(mutate).toHaveBeenCalledTimes(1);
  expect(mutate.mock.calls[0][0]).toEqual({ nickname: '유신', name: '홍길동', avatar: undefined });
});

it('사진을 지우면 null로 보내고, 저장에 실패하면 다시 누를 수 있습니다', async () => {
  const mutate = jest.fn((_input, options: { onError: (error: Error) => void }) =>
    options.onError(new Error('fail')),
  );
  await show({ data: profile, isError: false }, mutate);
  await fireEvent.press(screen.getByTestId('avatar-remove'));
  expect(screen.queryByTestId('avatar-remove')).toBeNull();
  await fireEvent.press(screen.getByTestId('profile-save'));
  await fireEvent.press(screen.getByTestId('profile-save'));
  expect(mutate).toHaveBeenCalledTimes(2);
  expect(mutate.mock.calls[0][0]).toMatchObject({ avatar: null });
});

it('닉네임이 짧으면 저장하지 않고 이유를 알려 줍니다', async () => {
  const mutate = jest.fn();
  await show({ data: profile, isError: false }, mutate);
  await fireEvent.changeText(screen.getByTestId('field-nickname'), '유');
  await fireEvent.press(screen.getByTestId('profile-save'));
  expect(mutate).not.toHaveBeenCalled();
  expect(screen.getByText('닉네임은 2자 이상으로 입력해 주세요.')).toBeTruthy();
});
