import { render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import type { Badge, BadgeStatus } from '../model/badges';
import { BadgeCard } from './badge-card';

const status = (id: string, earnedAt: string | null): BadgeStatus => ({
  badge: { id, name: id, description: id, icon: 'medal', tone: 'real' } as Badge,
  current: earnedAt ? 1 : 0,
  target: 1,
  earned: earnedAt !== null,
  earnedAt,
});

const show = (statuses: BadgeStatus[]) =>
  render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <BadgeCard statuses={statuses} dateLabel="2026. 11. 10." />
    </TamaguiProvider>,
  );

it('받은 뱃지만 담고 모은 수와 날짜를 적습니다', async () => {
  await show([status('a', '2026-11-01T09:00:00.000Z'), status('b', null)]);
  expect(screen.getByText('2개 가운데 1개를 모았어요')).toBeTruthy();
  expect(screen.getByTestId('badge-a')).toBeTruthy();
  expect(screen.queryByTestId('badge-b')).toBeNull();
  expect(screen.getByText('신세계 · 2026. 11. 10.')).toBeTruthy();
});

it('9개가 넘으면 최근 9개와 나머지 수를 보여 줍니다', async () => {
  const many = Array.from({ length: 11 }, (_, i) =>
    status(`b${i}`, `2026-11-${String(i + 1).padStart(2, '0')}T09:00:00.000Z`),
  );
  await show(many);
  expect(screen.getByText('외 2개')).toBeTruthy();
  expect(screen.getByTestId('badge-b10')).toBeTruthy();
  expect(screen.queryByTestId('badge-b0')).toBeNull();
});

it('닉네임이 있으면 제목에 붙입니다', async () => {
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <BadgeCard statuses={[]} dateLabel="2026. 11. 10." owner="유신" />
    </TamaguiProvider>,
  );
  expect(screen.getByRole('header', { name: '유신의 기념 뱃지' })).toBeTruthy();
});
