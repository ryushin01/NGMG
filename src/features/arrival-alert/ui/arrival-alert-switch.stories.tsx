import type { Meta, StoryObj } from '@storybook/react-native';
import { ArrivalAlertSwitch } from './arrival-alert-switch';

// 실제 권한 요청은 기기에서만 확인할 수 있습니다. 스토리는 꺼진 상태의 모양을 보여 줍니다.
const meta = {
  title: 'features/ArrivalAlertSwitch',
  component: ArrivalAlertSwitch,
  args: { checkedIds: new Set<string>() },
} satisfies Meta<typeof ArrivalAlertSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
