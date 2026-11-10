import type { Meta, StoryObj } from '@storybook/react-native';
import type { Destination } from '../model/types';
import { Stamp } from './stamp';

const destination = {
  id: 'petra',
  realm: 'real',
  name: '페트라',
  image: require('~/assets/destinations/petra.jpg'),
} as Destination;

const meta = {
  component: Stamp,
  args: { destination, year: 2026, size: 96, onPress: () => undefined },
} satisfies Meta<typeof Stamp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stamped: Story = {};
export const Empty: Story = { args: { year: null } };
export const Verified: Story = { args: { verifiedAt: '2026-11-10T09:00:00.000Z' } };
