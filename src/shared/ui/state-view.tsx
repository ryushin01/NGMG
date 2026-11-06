import { ActivityIndicator } from 'react-native';
import { YStack } from 'tamagui';
import { Button } from './button';
import { useColors } from './colors';
import { AppText } from './typography';

export const LoadingView = ({ label = '불러오는 중입니다.' }: { label?: string }) => {
  const colors = useColors();
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding={24}
      gap={12}
      accessibilityLabel={label}
      accessible
    >
      <ActivityIndicator color={colors.ink} />
    </YStack>
  );
};

type MessageViewProps = { message: string; actionLabel?: string; onAction?: () => void };

export const MessageView = ({ message, actionLabel, onAction }: MessageViewProps) => (
  <YStack flex={1} alignItems="center" justifyContent="center" padding={32} gap={16}>
    <AppText tone="muted" textAlign="center">
      {message}
    </AppText>
    {actionLabel && onAction ? (
      <Button variant="outline" label={actionLabel} onPress={onAction} />
    ) : null}
  </YStack>
);
