import { render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import type { Badge } from '../model/badges';
import { BadgeMedal } from './badge-medal';

const badge = {
  id: 'collector-5',
  name: '스탬프 수집가',
  description: '현장 인증 스탬프 5개',
  icon: 'medal',
} as Badge;
const wrap = (node: React.ReactNode) => (
  <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
    {node}
  </TamaguiProvider>
);

it('획득한 뱃지는 날짜를 함께 읽어 줍니다', async () => {
  await render(
    wrap(
      <BadgeMedal
        status={{
          badge,
          current: 5,
          target: 5,
          earned: true,
          earnedAt: '2026-11-10T09:00:00.000Z',
        }}
      />,
    ),
  );
  expect(
    screen.getByLabelText('스탬프 수집가, 획득, 2026-11-10, 현장 인증 스탬프 5개'),
  ).toBeTruthy();
  expect(screen.getByText('2026. 11. 10.')).toBeTruthy();
});

it('아직이면 진행도를 글자로 보여 줍니다', async () => {
  await render(
    wrap(<BadgeMedal status={{ badge, current: 3, target: 5, earned: false, earnedAt: null }} />),
  );
  expect(screen.getByText('3/5')).toBeTruthy();
  expect(screen.getByLabelText(/미획득, 3\/5/)).toBeTruthy();
});
