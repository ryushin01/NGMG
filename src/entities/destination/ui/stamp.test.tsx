import { fireEvent, render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import type { Destination } from '../model/types';
import { Stamp } from './stamp';

const destination = { id: 'petra', realm: 'real', name: '페트라', image: 1 } as Destination;

const setup = async (year: number | null) => {
  const onPress = jest.fn();
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Stamp destination={destination} year={year} size={96} onPress={onPress} />
    </TamaguiProvider>,
  );
  return onPress;
};

it('다녀온 곳은 연도를 읽어 주고 누를 수 있습니다', async () => {
  const onPress = await setup(2026);
  await fireEvent.press(screen.getByLabelText('페트라, 2026년 방문'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('아직 안 간 곳은 글자로도 알려 줍니다', async () => {
  await setup(null);
  expect(screen.getByLabelText('페트라, 미방문')).toBeTruthy();
  expect(screen.getByText('미방문')).toBeTruthy();
});

it('현장 인증한 곳은 인증 날짜를 읽어 주고 표시를 붙입니다', async () => {
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Stamp
        destination={destination}
        year={null}
        verifiedAt="2026-11-10T09:00:00.000Z"
        size={96}
        onPress={() => undefined}
      />
    </TamaguiProvider>,
  );
  expect(screen.getByLabelText('페트라, 현장 인증 2026. 11. 10.')).toBeTruthy();
  expect(screen.getByText('현장 인증')).toBeTruthy();
  expect(screen.getByText('2026. 11. 10.')).toBeTruthy();
  expect(screen.getByTestId('stamp-petra-verified')).toBeTruthy();
});
