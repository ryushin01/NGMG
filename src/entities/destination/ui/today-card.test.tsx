import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import type { Destination } from '../model/types';
import { TodayCard } from './today-card';

it('오늘의 여행지를 한 번에 읽어 주고 누를 수 있습니다', async () => {
  const onPress = jest.fn();
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <TodayCard
        destination={
          { id: 'petra', name: '페트라', tagline: '장미의 도시', image: 1 } as Destination
        }
        onPress={onPress}
      />
    </TamaguiProvider>,
  );
  await fireEvent.press(screen.getByLabelText('오늘의 여행지, 페트라, 장미의 도시'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
