import type { Meta, StoryObj } from '@storybook/react-native';
import { TripRow } from './trip-row';

const meta = {
  component: TripRow,
  args: {
    trip: {
      id: 't1',
      title: '아서왕의 길',
      startDate: '2027-05-01',
      endDate: '2027-05-09',
      stops: ['stonehenge', 'camelot', 'avalon'],
      memo: '',
    },
    onPress: () => undefined,
  },
} satisfies Meta<typeof TripRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
