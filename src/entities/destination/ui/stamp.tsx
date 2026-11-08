import { Image } from 'expo-image';
import { View, YStack } from 'tamagui';
import { AppText, Touchable } from '@/shared/ui';
import type { Destination } from '../model/types';

type StampProps = {
  destination: Destination;
  /** 처음 다녀온 해. 없으면 아직 찍지 못한 칸입니다. */
  year: number | null;
  size: number;
  onPress: () => void;
};

/** 색이 없어도 구분되도록 다녀온 곳은 사진과 연도를, 아닌 곳은 빈 도장과 '미방문'을 보여 줍니다. */
export const Stamp = ({ destination, year, size, onPress }: StampProps) => {
  const stamped = year !== null;
  return (
    <Touchable
      testID={`stamp-${destination.id}`}
      onPress={onPress}
      accessibilityLabel={`${destination.name}, ${stamped ? `${year}년 방문` : '미방문'}`}
      alignItems="center"
    >
      <YStack width={size} alignItems="center" gap={6}>
        <View
          width={size}
          height={size}
          borderRadius={size / 2}
          borderWidth={stamped ? 3 : 2}
          borderStyle={stamped ? 'solid' : 'dashed'}
          borderColor={
            stamped ? (destination.realm === 'real' ? 'brandText' : 'fantasyText') : 'muted'
          }
          overflow="hidden"
          alignItems="center"
          justifyContent="center"
          backgroundColor="surfaceMuted"
        >
          {stamped ? (
            <Image
              source={destination.image}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <AppText size="caption" tone="muted">
              미방문
            </AppText>
          )}
        </View>
        <AppText size="caption" tone="ink" textAlign="center" numberOfLines={2}>
          {destination.name}
        </AppText>
        {stamped ? (
          <AppText size="caption" tone="muted">
            {year}
          </AppText>
        ) : null}
      </YStack>
    </Touchable>
  );
};
