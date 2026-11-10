import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { useSavePlace } from '@/entities/place';
import { PlaceForm } from './place-form';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('sonner-native', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/shared/lib/use-unsaved-guard', () => ({ useUnsavedGuard: () => jest.fn() }));
jest.mock('react-native-keyboard-controller', () => {
  const { ScrollView } = jest.requireActual('react-native');
  return {
    KeyboardAwareScrollView: ScrollView,
    KeyboardStickyView: ({ children }: { children: React.ReactNode }) => children,
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/entities/place', () => ({
  ...jest.requireActual('@/entities/place/model/kind'),
  useSavePlace: jest.fn(),
}));

const initial = {
  name: '마추픽추',
  kind: 'real' as const,
  address: '페루 쿠스코',
  latitude: -13.16,
  longitude: -72.54,
  memo: '',
  tags: [],
  catalogId: null,
  wishlisted: false,
};

const show = (mutate: jest.Mock) => {
  jest.mocked(useSavePlace).mockReturnValue({ mutate, isPending: false } as never);
  return render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <PlaceForm initial={initial} onSaved={jest.fn()} />
    </TamaguiProvider>,
  );
};

it('빠르게 두 번 눌러도 장소를 한 번만 저장합니다', async () => {
  const mutate = jest.fn();
  await show(mutate);
  await fireEvent.press(screen.getByTestId('place-save'));
  await fireEvent.press(screen.getByTestId('place-save'));
  await waitFor(() => expect(mutate).toHaveBeenCalled());
  expect(mutate).toHaveBeenCalledTimes(1);
  expect(mutate.mock.calls[0][0]).toMatchObject({ name: '마추픽추' });
});

it('저장에 실패하면 다시 누를 수 있습니다', async () => {
  const mutate = jest.fn((_input, options: { onError: (error: Error) => void }) =>
    options.onError(new Error('fail')),
  );
  await show(mutate);
  await fireEvent.press(screen.getByTestId('place-save'));
  await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
  await fireEvent.press(screen.getByTestId('place-save'));
  await waitFor(() => expect(mutate).toHaveBeenCalledTimes(2));
});
