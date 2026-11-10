import type { Meta, StoryObj } from '@storybook/react-native';
import type { Destination } from '../model/types';
import { Postcard } from './postcard';

const meta = {
  component: Postcard,
  args: {
    destination: {
      id: 'avalon',
      realm: 'fantasy',
      name: '아발론',
      tagline: '상처 입은 아서왕이 쉬러 간 사과의 섬',
      location: '서쪽 바다 너머',
      image: require('~/assets/destinations/avalon.webp'),
    } as Destination,
    dateLabel: '2026. 11. 10.',
  },
} satisfies Meta<typeof Postcard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fantasy: Story = {};
