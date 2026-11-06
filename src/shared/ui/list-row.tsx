import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View, XStack, YStack } from 'tamagui';
import { Touchable } from './pressable';
import { AppText } from './typography';
import { AppIcon } from './icon';

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  testID?: string;
};

export const ListRow = ({ title, subtitle, icon, chevron, onPress, testID }: ListRowProps) => (
  <Touchable
    testID={testID}
    onPress={onPress}
    accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
    paddingHorizontal={20}
    paddingVertical={14}
    backgroundColor="surface press:surfaceMuted"
  >
    <XStack alignItems="center" gap={14}>
      {icon ? (
        <View width={24} alignItems="center">
          {icon}
        </View>
      ) : null}
      <YStack flex={1} gap={2}>
        <AppText numberOfLines={1}>{title}</AppText>
        {subtitle ? (
          <AppText size="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </YStack>
      {chevron ? <AppIcon icon={ChevronRight} size={18} color="muted" strokeWidth={1.75} /> : null}
    </XStack>
  </Touchable>
);

export const Divider = ({ inset = 0 }: { inset?: number }) => (
  <View height={1} backgroundColor="line" marginLeft={inset} />
);
