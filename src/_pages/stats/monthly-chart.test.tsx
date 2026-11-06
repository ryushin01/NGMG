import { render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import { MonthlyChart } from './monthly-chart';

const show = (monthly: number[]) =>
  render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <MonthlyChart monthly={monthly} />
    </TamaguiProvider>,
  );

it('값이 있는 달만 대체 텍스트로 읽어 줍니다', async () => {
  await show([0, 2, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0]);
  expect(screen.getByLabelText('월별 기록 수. 2월 2건, 10월 5건')).toBeTruthy();
});

it('기록이 없으면 없다고 알려 줍니다', async () => {
  await show(Array.from({ length: 12 }, () => 0));
  expect(screen.getByLabelText('월별 기록 수. 기록 없음')).toBeTruthy();
});
