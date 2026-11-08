import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { TripRow } from './trip-row';

it('제목, 날짜, 경유지 수를 보여 주고 누를 수 있습니다', async () => {
  const onPress = jest.fn();
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <TripRow
        trip={{
          id: 't1',
          title: '아서왕의 길',
          startDate: null,
          endDate: null,
          stops: ['a', 'b'],
          memo: '',
        }}
        onPress={onPress}
      />
    </TamaguiProvider>,
  );
  expect(screen.getByText('날짜 미정 · 2곳')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('trip-row-t1'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
