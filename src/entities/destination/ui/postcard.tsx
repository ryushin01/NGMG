import { Image } from 'expo-image';
import { forwardRef } from 'react';
import type { View as NativeView } from 'react-native';
import { View, XStack, YStack } from 'tamagui';
import { AppText } from '@/shared/ui';
import type { Destination } from '../model/types';

type PostcardProps = { destination: Destination; dateLabel: string };

/** 공유용 엽서. 화면 밖에 그려 두고 이미지로 찍어 공유합니다. */
export const Postcard = forwardRef<NativeView, PostcardProps>(function Postcard(
  { destination, dateLabel },
  ref,
) {
  return (
    <View
      ref={ref as never}
      collapsable={false}
      width={360}
      backgroundColor="surface"
      borderRadius={16}
      overflow="hidden"
      borderWidth={1}
      borderColor="line"
    >
      <Image
        source={destination.image}
        style={{ width: 360, height: 240 }}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <YStack padding={20} gap={6}>
        <XStack justifyContent="space-between" alignItems="center">
          <AppText size="caption" tone="brand" bold>
            {destination.realm === 'real' ? '실존 유적' : '환상 세계'}
          </AppText>
          <AppText size="caption" tone="muted">
            {dateLabel}
          </AppText>
        </XStack>
        <AppText size="headline">{destination.name}</AppText>
        <AppText tone="muted">{destination.tagline}</AppText>
        <AppText size="caption" tone="muted" marginTop={8}>
          신세계 · {destination.location}
        </AppText>
      </YStack>
    </View>
  );
});
