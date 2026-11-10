import type { Meta, StoryObj } from '@storybook/react-native';
import { evaluateBadges } from '../model/badges';
import { BadgeCard } from './badge-card';

const checkIn = (catalogId: string, day: number) => ({
  id: catalogId,
  catalogId,
  checkedAt: `2026-11-${String(day).padStart(2, '0')}T09:00:00.000Z`,
  latitude: 0,
  longitude: 0,
  distanceKm: 0,
  method: 'gps' as const,
});

const meta = {
  title: 'features/BadgeCard',
  component: BadgeCard,
  args: {
    statuses: evaluateBadges([checkIn('avalon', 1), checkIn('hades', 2), checkIn('yomi', 3)]),
    dateLabel: '2026. 11. 10.',
  },
} satisfies Meta<typeof BadgeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
