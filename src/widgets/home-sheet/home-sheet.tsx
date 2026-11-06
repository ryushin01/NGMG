import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { ArrowRight, MapPin, Square, X } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { View, XStack, YStack } from 'tamagui';
import { KindBadge } from '@/entities/place';
import { RecordRow, useRecords } from '@/entities/record';
import type { Place, PlaceKind } from '@/shared/api';
import { formatDate, getTide } from '@/shared/lib';
import { AppText, Button, Chip, Divider, Tag, Touchable } from '@/shared/ui';

export type KindFilter = PlaceKind | 'all';

const FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'fishing', label: '낚시' },
  { value: 'restaurant', label: '맛집' },
];

type HomeContentProps = {
  filter: KindFilter;
  onChangeFilter: (next: KindFilter) => void;
  tags: string[];
  tag: string | null;
  onChangeTag: (next: string | null) => void;
};

export const HomeContent = ({
  filter,
  onChangeFilter,
  tags,
  tag,
  onChangeTag,
}: HomeContentProps) => {
  const router = useRouter();
  const records = useRecords();
  const visible = (records.data ?? [])
    .filter((record) => filter === 'all' || record.placeKind === filter)
    .slice(0, 5);

  return (
    <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <YStack paddingHorizontal={20} paddingTop={8} gap={14}>
        <AppText size="title" accessibilityRole="header">
          오늘은 어디로 떠나볼까요?
        </AppText>
        <Touchable
          testID="home-search"
          onPress={() => router.push('/search')}
          accessibilityLabel="주소나 장소 검색"
          height={56}
          borderRadius={28}
          backgroundColor="brandSoft"
          paddingHorizontal={22}
          justifyContent="center"
        >
          <XStack alignItems="center" gap={12}>
            <Square size={10} color="#1a254f" fill="#1a254f" />
            <AppText flex={1} tone="muted">
              주소나 장소 검색
            </AppText>
            <ArrowRight size={22} color="#1a254f" strokeWidth={1.5} />
          </XStack>
        </Touchable>
        <XStack gap={8} accessibilityRole="radiogroup" accessibilityLabel="지도 핀 분류">
          {FILTERS.map((item) => (
            <Chip
              key={item.value}
              testID={`filter-${item.value}`}
              label={item.label}
              selected={filter === item.value}
              onPress={() => onChangeFilter(item.value)}
            />
          ))}
        </XStack>
        {tags.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap={8} accessibilityRole="radiogroup" accessibilityLabel="지도 핀 태그">
              {tags.map((item) => (
                <Chip
                  key={item}
                  testID={`filter-tag-${item}`}
                  label={`#${item}`}
                  selected={tag === item}
                  onPress={() => onChangeTag(tag === item ? null : item)}
                />
              ))}
            </XStack>
          </ScrollView>
        ) : null}
      </YStack>
      <View height={8} backgroundColor="surfaceMuted" marginTop={18} />
      <XStack
        paddingHorizontal={20}
        paddingTop={18}
        paddingBottom={6}
        alignItems="center"
        justifyContent="space-between"
      >
        <AppText size="row" tone="ink" bold accessibilityRole="header">
          최근 기록
        </AppText>
        <Touchable
          testID="home-all-records"
          onPress={() => router.push('/records')}
          accessibilityLabel="전체 기록 보기"
          justifyContent="center"
        >
          <AppText size="caption" tone="brand">
            전체 보기
          </AppText>
        </Touchable>
      </XStack>
      {visible.length === 0 ? (
        <AppText tone="muted" paddingHorizontal={20} paddingVertical={24} textAlign="center">
          아직 기록이 없습니다. 지도에서 핀을 눌러 첫 기록을 남겨 보세요.
        </AppText>
      ) : (
        visible.map((record, index) => (
          <View key={record.id}>
            {index > 0 ? <Divider inset={20} /> : null}
            <RecordRow record={record} onPress={() => router.push(`/record/${record.id}`)} />
          </View>
        ))
      )}
    </BottomSheetScrollView>
  );
};

/** 핀을 눌렀을 때 보여 주는 간결한 장소 정보 */
export const PlaceSummary = ({ place, onClose }: { place: Place; onClose: () => void }) => {
  const router = useRouter();
  const tide = getTide(new Date(), place.latitude, place.longitude);
  return (
    <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
      <YStack gap={10} testID="place-summary" accessibilityLiveRegion="polite">
        <XStack alignItems="flex-start" justifyContent="space-between">
          <YStack flex={1} gap={6} paddingTop={4}>
            <KindBadge kind={place.kind} />
            <AppText size="title" accessibilityRole="header" numberOfLines={2}>
              {place.name}
            </AppText>
          </YStack>
          <Touchable
            testID="place-summary-close"
            onPress={onClose}
            accessibilityLabel="장소 요약 닫기"
            alignItems="center"
            justifyContent="center"
          >
            <X size={22} color="#1a254f" strokeWidth={1.75} />
          </Touchable>
        </XStack>
        <XStack gap={6} alignItems="center">
          <MapPin size={16} color="#5f6673" strokeWidth={1.75} />
          <AppText flex={1} size="caption" tone="muted" numberOfLines={1}>
            {place.address || '주소 없음'}
          </AppText>
        </XStack>
        <AppText size="caption" tone="ink">
          기록 {place.recordCount}건
          {place.lastVisitedAt ? ` · 최근 방문 ${formatDate(place.lastVisitedAt)}` : ''}
        </AppText>
        {place.kind === 'fishing' ? (
          <AppText testID="place-summary-tide" size="caption" tone="ink">
            오늘 물때 {tide.name} (음력 {tide.lunarDay}일, {tide.system})
          </AppText>
        ) : null}
        {place.memo ? <AppText numberOfLines={2}>{place.memo}</AppText> : null}
        {place.tags.length > 0 ? (
          <XStack gap={6} flexWrap="wrap">
            {place.tags.slice(0, 4).map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </XStack>
        ) : null}
        <XStack gap={8} marginTop={4}>
          <View flex={1}>
            <Button
              testID="summary-add-record"
              variant="outline"
              label="기록 추가"
              onPress={() => router.push(`/record/new?placeId=${place.id}`)}
            />
          </View>
          <View flex={1}>
            <Button
              testID="summary-more"
              label="더보기"
              onPress={() => router.push(`/place/${place.id}`)}
            />
          </View>
        </XStack>
      </YStack>
    </BottomSheetScrollView>
  );
};
