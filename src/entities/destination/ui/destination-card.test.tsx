import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import type { Destination } from '../model/types';
import { DestinationCard } from './destination-card';

const destination = {
  id: 'avalon',
  name: '아발론',
  location: '서쪽 바다 너머',
  era: '12세기',
  tagline: '사과의 섬',
  image: 1,
} as Destination;

const setup = async (props: Partial<React.ComponentProps<typeof DestinationCard>> = {}) => {
  const onPress = jest.fn();
  const onToggleWish = jest.fn();
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <DestinationCard
        destination={destination}
        wishlisted={false}
        visited={false}
        onPress={onPress}
        onToggleWish={onToggleWish}
        {...props}
      />
    </TamaguiProvider>,
  );
  return { onPress, onToggleWish };
};

it('카드와 하트를 따로 누를 수 있습니다', async () => {
  const { onPress, onToggleWish } = await setup();
  await fireEvent.press(screen.getByTestId('wish-avalon'));
  expect(onToggleWish).toHaveBeenCalledTimes(1);
  expect(onPress).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByTestId('destination-avalon'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('다녀온 곳은 글자로도 알려 줍니다', async () => {
  await setup({ visited: true });
  expect(screen.getByText('다녀옴')).toBeTruthy();
});

it('가고 싶어요 상태를 스크린리더에 알립니다', async () => {
  await setup({ wishlisted: true });
  expect(screen.getByTestId('wish-avalon').props.accessibilityState).toMatchObject({
    selected: true,
  });
});
