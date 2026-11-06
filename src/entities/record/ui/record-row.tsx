import { Image } from 'expo-image';
import { ChevronRight, Fish, Utensils } from 'lucide-react-native';
import { View, XStack, YStack } from 'tamagui';
import type { TripRecord } from '@/shared/api';
import { formatDate } from '@/shared/lib';
import { AppText, Touchable } from '@/shared/ui';

const summarize = (record: TripRecord) =>
  record.placeKind === 'fishing'
    ? record.catches || record.rig || record.memo
    : record.menu || record.memo;

export const RecordRow = ({ record, onPress }: { record: TripRecord; onPress: () => void }) => {
  const title = record.title || record.placeName;
  const summary = summarize(record);
  const cover = record.photos[0];
  return (
    <Touchable
      testID={`record-row-${record.id}`}
      onPress={onPress}
      accessibilityLabel={`${title}, ${record.placeName}, ${formatDate(record.visitedAt)}${summary ? `, ${summary}` : ''}`}
      paddingHorizontal={20}
      paddingVertical={14}
      backgroundColor="white press:surfaceMuted"
    >
      <XStack gap={14} alignItems="center">
        <View
          width={56}
          height={56}
          borderRadius={6}
          overflow="hidden"
          backgroundColor="brandSoft"
          alignItems="center"
          justifyContent="center"
        >
          {cover ? (
            <Image
              source={{ uri: cover.url, cacheKey: cover.path }}
              style={{ width: 56, height: 56 }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : record.placeKind === 'fishing' ? (
            <Fish size={22} color="#006ea8" strokeWidth={1.75} />
          ) : (
            <Utensils size={22} color="#b23a1d" strokeWidth={1.75} />
          )}
        </View>
        <YStack flex={1} gap={2}>
          <AppText bold numberOfLines={1}>
            {title}
          </AppText>
          <AppText size="caption" tone="muted" numberOfLines={1}>
            {formatDate(record.visitedAt)} · {record.placeName}
          </AppText>
          {summary ? (
            <AppText size="caption" numberOfLines={1}>
              {summary}
            </AppText>
          ) : null}
        </YStack>
        <ChevronRight size={18} color="#5f6673" strokeWidth={1.75} />
      </XStack>
    </Touchable>
  );
};
