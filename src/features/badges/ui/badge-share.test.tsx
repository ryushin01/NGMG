import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { BadgeShareContent } from './badge-share';

jest.mock('sonner-native', () => ({ toast: { error: jest.fn() } }));
jest.mock('@/shared/lib', () => ({
  ...jest.requireActual('@/shared/lib'),
  useCaptureShare: () => ({ share: jest.fn(async () => true), sharing: false }),
}));

const show = (avatarUrl: string | null) => (
  <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
    <BadgeShareContent statuses={[]} owner={{ nickname: '유신', avatarUrl }} onClose={jest.fn()} />
  </TamaguiProvider>
);

const loadAvatar = (url: string) =>
  fireEvent(screen.getByTestId('profile-avatar-image', { includeHiddenElements: true }), 'load', {
    nativeEvent: { source: { url, width: 1, height: 1 } },
  });

const shareDisabled = () =>
  screen.getByTestId('badge-share-confirm').props.accessibilityState?.disabled;

it('프로필 사진이 뜰 때까지 공유를 막고, 사진이 바뀌면 새 사진을 다시 기다립니다', async () => {
  const { rerender } = await render(show('file:///a.jpg'));
  expect(shareDisabled()).toBe(true);
  await loadAvatar('file:///a.jpg');
  expect(shareDisabled()).toBe(false);
  await rerender(show('file:///b.jpg'));
  expect(shareDisabled()).toBe(true);
  await loadAvatar('file:///b.jpg');
  expect(shareDisabled()).toBe(false);
});

it('사진이 없으면 바로 공유할 수 있습니다', async () => {
  await render(show(null));
  expect(shareDisabled()).toBe(false);
});

it('프로필을 불러오는 동안에는 공유를 막습니다', async () => {
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <BadgeShareContent statuses={[]} ownerLoading onClose={jest.fn()} />
    </TamaguiProvider>,
  );
  expect(shareDisabled()).toBe(true);
});
