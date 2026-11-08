import type { Meta, StoryObj } from '@storybook/react-native';
import type { Destination } from '../model/types';
import { DestinationCard } from './destination-card';

const destination = {
  id: 'avalon',
  realm: 'fantasy',
  name: '아발론',
  location: '서쪽 바다 너머',
  era: '12세기 문헌 등장',
  tagline: '상처 입은 아서왕이 쉬러 간 사과의 섬',
  image: require('~/assets/destinations/avalon.jpg'),
} as Destination;

const meta = {
  component: DestinationCard,
  args: {
    destination,
    wishlisted: false,
    visited: false,
    onPress: () => undefined,
    onToggleWish: () => undefined,
  },
} satisfies Meta<typeof DestinationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Wished: Story = { args: { wishlisted: true } };
export const Visited: Story = { args: { visited: true } };
