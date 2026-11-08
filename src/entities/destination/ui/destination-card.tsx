import { Image } from 'expo-image';
import { Check, Heart } from 'lucide-react-native';
import { View, XStack, YStack } from 'tamagui';
import { AppIcon, AppText, Touchable } from '@/shared/ui';
import type { Destination } from '../model/types';

type DestinationCardProps = {
  destination: Destination;
  wishlisted: boolean;
  visited: boolean;
  onPress: () => void;
  onToggleWish: () => void;
};

/** 카드와 하트 버튼은 중첩하지 않고 형제 요소로 둡니다. 스크린리더가 각각 초점을 잡습니다. */
export const DestinationCard = ({
  destination,
  wishlisted,
  visited,
  onPress,
  onToggleWish,
}: DestinationCardProps) => (
  <View paddingHorizontal={20} paddingBottom={20}>
    <Touchable
      testID={`destination-${destination.id}`}
      onPress={onPress}
      accessibilityLabel={`${destination.name}, ${destination.location}, ${destination.tagline}${visited ? ', 다녀옴' : ''}`}
    >
      <YStack gap={10}>
        <View height={190} borderRadius={12} overflow="hidden" backgroundColor="surfaceMuted">
          <Image
            source={destination.image}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={120}
            accessibilityIgnoresInvertColors
          />
        </View>
        <YStack gap={2}>
          <XStack alignItems="center" gap={6}>
            <AppText size="title" numberOfLines={1} flexShrink={1}>
              {destination.name}
            </AppText>
            {visited ? (
              <AppIcon icon={Check} size={18} color="brandText" strokeWidth={2.5} />
            ) : null}
            {visited ? (
              <AppText size="caption" tone="brand">
                다녀옴
              </AppText>
            ) : null}
          </XStack>
          <AppText size="caption" tone="muted" numberOfLines={1}>
            {destination.location} · {destination.era}
          </AppText>
          <AppText numberOfLines={2}>{destination.tagline}</AppText>
        </YStack>
      </YStack>
    </Touchable>
    <View position="absolute" top={8} right={28}>
      <Touchable
        testID={`wish-${destination.id}`}
        onPress={onToggleWish}
        accessibilityRole="button"
        accessibilityLabel={`${destination.name} 가고 싶어요`}
        accessibilityState={{ selected: wishlisted }}
        width={44}
        height={44}
        borderRadius={22}
        backgroundColor="surface"
        alignItems="center"
        justifyContent="center"
      >
        <AppIcon
          icon={Heart}
          size={22}
          color={wishlisted ? 'danger' : 'ink'}
          fill={wishlisted ? 'danger' : undefined}
          strokeWidth={1.75}
        />
      </Touchable>
    </View>
  </View>
);
