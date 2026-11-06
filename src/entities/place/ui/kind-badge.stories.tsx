import type { Meta, StoryObj } from '@storybook/react-native';
import { KindBadge } from './kind-badge';

const meta: Meta<typeof KindBadge> = { title: 'entities/KindBadge', component: KindBadge };
export default meta;
type Story = StoryObj<typeof KindBadge>;

export const Fishing: Story = { args: { kind: 'fishing' } };
export const Restaurant: Story = { args: { kind: 'restaurant' } };
