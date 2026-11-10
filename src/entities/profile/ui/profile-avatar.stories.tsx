import type { Meta, StoryObj } from '@storybook/react-native';
import { ProfileAvatar } from './profile-avatar';

const meta = {
  title: 'entities/ProfileAvatar',
  component: ProfileAvatar,
  args: { nickname: '여행자', uri: null, size: 64 },
} satisfies Meta<typeof ProfileAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initial: Story = {};
