import { render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { ProfileAvatar } from './profile-avatar';

const show = (uri: string | null) =>
  render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <ProfileAvatar nickname="유신" uri={uri} />
    </TamaguiProvider>,
  );

it('사진이 없으면 닉네임 첫 글자를 보여 줍니다', async () => {
  await show(null);
  expect(screen.getByText('유', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.queryByTestId('profile-avatar-image', { includeHiddenElements: true })).toBeNull();
});

it('사진이 있으면 사진을 보여 줍니다', async () => {
  await show('file:///avatar.jpg');
  expect(screen.getByTestId('profile-avatar-image', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.queryByText('유', { includeHiddenElements: true })).toBeNull();
});
