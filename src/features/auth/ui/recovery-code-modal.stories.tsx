import type { Meta, StoryObj } from '@storybook/react-native';
import { useEffect } from 'react';
import { useRecoveryCodeStore } from '../model/recovery-store';
import { RecoveryCodeModal } from './recovery-code-modal';

const WithCode = () => {
  useEffect(() => useRecoveryCodeStore.getState().show('K7MQ2XWD9PTA'), []);
  return <RecoveryCodeModal />;
};

const meta = { title: 'features/RecoveryCodeModal', component: WithCode } satisfies Meta<
  typeof WithCode
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
