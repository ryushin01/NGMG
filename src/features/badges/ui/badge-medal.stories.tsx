import type { Meta, StoryObj } from '@storybook/react-native';
import { BADGES } from '../model/badges';
import { BadgeMedal } from './badge-medal';

const meta = {
  component: BadgeMedal,
  args: {
    status: {
      badge: BADGES[0],
      current: 1,
      target: 1,
      earned: true,
      earnedAt: '2026-11-10T09:00:00.000Z',
    },
  },
} satisfies Meta<typeof BadgeMedal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Earned: Story = {};
export const Locked: Story = {
  args: { status: { badge: BADGES[1], current: 3, target: 5, earned: false, earnedAt: null } },
};
