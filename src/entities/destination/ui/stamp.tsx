import { Image } from 'expo-image';
import { BadgeCheck } from 'lucide-react-native';
import { View, YStack } from 'tamagui';
import { formatDay } from '@/shared/lib';
import { AppIcon, AppText, Touchable } from '@/shared/ui';
import type { Destination } from '../model/types';

type StampProps = {
  destination: Destination;
  /** 기록으로 처음 다녀온 해. */
  year: number | null;
  /** 현장 인증을 한 날짜(ISO). 있으면 기록이 없어도 찍힌 칸입니다. */
  verifiedAt?: string | null;
  size: number;
  onPress: () => void;
};

/**
 * 색이 없어도 구분되도록 상태를 글자로 함께 보여 줍니다.
 * 현장 인증: 사진, 인증 표시, '인증' 날짜 / 기록만: 사진과 연도 / 없음: 빈 도장과 '미방문'.
 */
export const Stamp = ({ destination, year, verifiedAt = null, size, onPress }: StampProps) => {
  const verified = verifiedAt !== null;
  const stamped = verified || year !== null;
  const accent = destination.realm === 'real' ? 'brandText' : 'fantasyText';
  const state = verified
    ? `현장 인증 ${formatDay(verifiedAt)}`
    : year !== null
      ? `${year}년 방문`
      : '미방문';
  return (
    <Touchable
      testID={`stamp-${destination.id}`}
      onPress={onPress}
      accessibilityLabel={`${destination.name}, ${state}`}
      alignItems="center"
    >
      <YStack width={size} alignItems="center" gap={6}>
        <View width={size} height={size}>
          <View
            width={size}
            height={size}
            borderRadius={size / 2}
            borderWidth={verified ? 4 : 2}
            borderStyle={stamped ? 'solid' : 'dashed'}
            borderColor={stamped ? accent : 'muted'}
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
          {verified ? (
            <View
              testID={`stamp-${destination.id}-verified`}
              position="absolute"
              right={0}
              bottom={0}
              width={30}
              height={30}
              borderRadius={15}
              backgroundColor="surface"
              alignItems="center"
              justifyContent="center"
            >
              <AppIcon icon={BadgeCheck} size={26} color={accent} strokeWidth={2} />
            </View>
          ) : null}
        </View>
        <AppText size="caption" tone="ink" textAlign="center" numberOfLines={2}>
          {destination.name}
        </AppText>
        {verified ? (
          <YStack alignItems="center">
            <AppText size="caption" color={accent} bold>
              현장 인증
            </AppText>
            <AppText size="caption" tone="muted">
              {formatDay(verifiedAt)}
            </AppText>
          </YStack>
        ) : year !== null ? (
          <AppText size="caption" tone="muted">
            {year}
          </AppText>
        ) : null}
      </YStack>
    </Touchable>
  );
};
