import { Image } from 'expo-image';
import { XStack, YStack } from 'tamagui';
import { AppText, Touchable } from '@/shared/ui';
import type { Destination } from '../model/types';

/** 실존·환상 탭 위쪽에 하루 한 곳씩 보여 주는 여행지 */
export const TodayCard = ({
  destination,
  onPress,
}: {
  destination: Destination;
  onPress: () => void;
}) => (
  <Touchable
    testID="today-destination"
    onPress={onPress}
    accessibilityLabel={`오늘의 여행지, ${destination.name}, ${destination.tagline}`}
    borderRadius={12}
    borderWidth={1}
    borderColor="line"
    backgroundColor="surfaceMuted"
    padding={12}
  >
    <XStack gap={12} alignItems="center">
      <Image
        source={destination.image}
        style={{ width: 64, height: 64, borderRadius: 8 }}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <YStack flex={1} gap={2}>
        <AppText size="caption" tone="brand" bold>
          오늘의 여행지
        </AppText>
        <AppText size="title" numberOfLines={1}>
          {destination.name}
        </AppText>
        <AppText size="caption" tone="muted" numberOfLines={2}>
          {destination.tagline}
        </AppText>
      </YStack>
    </XStack>
  </Touchable>
);
