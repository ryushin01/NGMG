import type { Meta, StoryObj } from '@storybook/react-native';
import { MapPin } from 'lucide-react-native';
import { ListRow } from './list-row';
import { AppIcon } from './icon';

const meta: Meta<typeof ListRow> = {
  title: 'shared/ListRow',
  component: ListRow,
  args: { title: '마추픽추', subtitle: '페루 쿠스코주', onPress: () => undefined },
};
export default meta;
type Story = StoryObj<typeof ListRow>;

export const Default: Story = {};
export const WithIcon: Story = {
  args: { icon: <AppIcon icon={MapPin} size={22} color="muted" />, chevron: true },
};
