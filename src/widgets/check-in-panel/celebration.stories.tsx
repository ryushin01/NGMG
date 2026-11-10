import type { Meta, StoryObj } from '@storybook/react-native';
import { findDestination } from '@/entities/destination';
import { evaluateBadges } from '@/features/badges';
import { Celebration } from './celebration';

const checkedAt = '2026-11-10T09:00:00.000Z';
const badges = evaluateBadges([
  {
    id: 'k',
    catalogId: 'avalon',
    checkedAt,
    latitude: 51.1442,
    longitude: -2.6986,
    distanceKm: 0.4,
    method: 'gps',
  },
]).filter((item) => item.earned);

const meta = {
  title: 'widgets/CheckInCelebration',
  component: Celebration,
  args: {
    destination: findDestination('avalon')!,
    checkedAt,
    badges,
    allBadges: badges,
    onClose: () => undefined,
    onOpenPassport: () => undefined,
  },
} satisfies Meta<typeof Celebration>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewBadges: Story = {};
export const StampOnly: Story = { args: { badges: [] } };
