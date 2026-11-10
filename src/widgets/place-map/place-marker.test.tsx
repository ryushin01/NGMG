import { fireEvent, render, screen } from '@testing-library/react-native';
import { KIND_META } from '@/entities/place';
import { PlaceMarker } from './place-marker';

jest.mock('react-native-maps', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Marker: ({ tracksViewChanges, ...props }: { tracksViewChanges: boolean }) => (
      <View {...props} accessibilityHint={tracksViewChanges ? 'tracking' : 'fixed'} />
    ),
  };
});

const coordinate = { latitude: 51.1442, longitude: -2.6986 };

it('현장 인증한 곳은 체크가 붙은 핀을 씁니다', async () => {
  await render(<PlaceMarker testID="pin" coordinate={coordinate} kind="fantasy" verified />);
  const image = screen.getByTestId('pin-image');
  expect(image.props.source).toBe(KIND_META.fantasy.verifiedPin);
});

it('인증하지 않은 곳은 기본 핀을 씁니다', async () => {
  await render(<PlaceMarker testID="pin" coordinate={coordinate} kind="real" />);
  const image = screen.getByTestId('pin-image');
  expect(image.props.source).toBe(KIND_META.real.pin);
});

it('인증으로 핀이 바뀌면 새 이미지를 불러올 때까지 다시 그립니다', async () => {
  const { rerender } = await render(
    <PlaceMarker testID="pin" coordinate={coordinate} kind="real" />,
  );
  await fireEvent(screen.getByTestId('pin-image'), 'load');
  expect(screen.getByTestId('pin').props.accessibilityHint).toBe('fixed');
  await rerender(<PlaceMarker testID="pin" coordinate={coordinate} kind="real" verified />);
  expect(screen.getByTestId('pin').props.accessibilityHint).toBe('tracking');
  expect(screen.getByTestId('pin-image').props.source).toBe(KIND_META.real.verifiedPin);
  await fireEvent(screen.getByTestId('pin-image'), 'load');
  expect(screen.getByTestId('pin').props.accessibilityHint).toBe('fixed');
});
