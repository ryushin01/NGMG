import type { Meta, StoryObj } from '@storybook/react-native';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'shared/Button',
  component: Button,
  args: { label: '저장하기', onPress: () => undefined },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};
export const Outline: Story = { args: { variant: 'outline' } };
export const Danger: Story = { args: { variant: 'danger', label: '삭제' } };
export const Loading: Story = { args: { loading: true } };
