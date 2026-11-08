import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { Chip, Tag, TagInput } from './chip';

const meta: Meta<typeof Chip> = {
  title: 'shared/Chip',
  component: Chip,
  args: { label: '실존 유적' },
};
export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const ReadOnlyTag: Story = { render: () => <Tag label="신전" /> };

const Controlled = () => {
  const [value, setValue] = useState(['신전']);
  return <TagInput label="태그" placeholder="태그 입력" value={value} onChange={setValue} />;
};
export const Input: Story = { render: () => <Controlled /> };
