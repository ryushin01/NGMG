import type { Meta, StoryObj } from '@storybook/react-native';
import { KindBadge } from './kind-badge';

const meta: Meta<typeof KindBadge> = { title: 'entities/KindBadge', component: KindBadge };
export default meta;
type Story = StoryObj<typeof KindBadge>;

export const Real: Story = { args: { kind: 'real' } };
export const Fantasy: Story = { args: { kind: 'fantasy' } };
