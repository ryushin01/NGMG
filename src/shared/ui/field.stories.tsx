import type { Meta, StoryObj } from '@storybook/react-native';
import { Field } from './field';

const meta: Meta<typeof Field> = {
  title: 'shared/Field',
  component: Field,
  args: { label: '장소 이름', placeholder: '예: 태양의 신전' },
};
export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {};
export const Required: Story = { args: { required: true } };
export const WithError: Story = { args: { required: true, error: '장소 이름을 입력해 주세요.' } };
export const Multiline: Story = { args: { label: '메모', multiline: true } };
