import type { Meta, StoryObj } from '@storybook/react-native';
import type { Destination } from '../model/types';
import { TodayCard } from './today-card';

const meta = {
  component: TodayCard,
  args: {
    destination: {
      id: 'petra',
      name: '페트라',
      tagline: '붉은 사암을 깎아 만든 나바테아의 도시',
      image: require('~/assets/destinations/petra.webp'),
    } as Destination,
    onPress: () => undefined,
  },
} satisfies Meta<typeof TodayCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
