import { render, screen } from '@testing-library/react-native';
import { KIND_META } from '@/entities/place';
import { PlaceMarker } from './place-marker';

jest.mock('react-native-maps', () => {
  const { View } = jest.requireActual('react-native');
  return { Marker: (props: object) => <View {...props} /> };
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
