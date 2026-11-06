import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { View, XStack } from 'tamagui';
import { PlaceRow, usePlaces } from '@/entities/place';
import type { PlaceKind } from '@/shared/api';
import { toErrorMessage } from '@/shared/lib';
import { BottomCta, Chip, Divider, Field, Header, LoadingView, MessageView } from '@/shared/ui';

type Filter = PlaceKind | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'fishing', label: '낚시 포인트' },
  { value: 'restaurant', label: '맛집' },
];

export const PlacesPage = () => {
  const router = useRouter();
  const places = usePlaces();
  const [filter, setFilter] = useState<Filter>('all');
  const [keyword, setKeyword] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const tags = useMemo(
    () => [...new Set((places.data ?? []).flatMap((place) => place.tags))],
    [places.data],
  );
  const data = useMemo(() => {
    const term = keyword.trim();
    return (places.data ?? []).filter(
      (place) =>
        (filter === 'all' || place.kind === filter) &&
        (!tag || place.tags.includes(tag)) &&
        (!term ||
          place.name.includes(term) ||
          place.address.includes(term) ||
          place.memo.includes(term)),
    );
  }, [filter, keyword, places.data, tag]);

  return (
    <View flex={1} backgroundColor="surface">
      <Header title="내 장소" />
      <View paddingHorizontal={20} paddingBottom={12}>
        <Field
          testID="places-search"
          label="장소 검색"
          placeholder="이름, 주소, 메모"
          value={keyword}
          onChangeText={setKeyword}
          returnKeyType="search"
        />
      </View>
      <XStack gap={8} paddingHorizontal={20} paddingBottom={12} accessibilityRole="radiogroup">
        {FILTERS.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={filter === item.value}
            onPress={() => setFilter(item.value)}
          />
        ))}
      </XStack>
      {tags.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
        >
          <XStack gap={8} accessibilityRole="radiogroup" accessibilityLabel="태그">
            {tags.map((item) => (
              <Chip
                key={item}
                testID={`places-tag-${item}`}
                label={`#${item}`}
                selected={tag === item}
                onPress={() => setTag(tag === item ? null : item)}
              />
            ))}
          </XStack>
        </ScrollView>
      ) : null}
      <Divider />
      {places.isPending ? (
        <LoadingView />
      ) : places.isError && !places.data ? (
        <MessageView
          message={toErrorMessage(places.error)}
          actionLabel="다시 시도"
          onAction={() => places.refetch()}
        />
      ) : (
        <FlashList
          data={data}
          keyExtractor={(place) => place.id}
          onRefresh={() => places.refetch()}
          refreshing={places.isRefetching}
          ItemSeparatorComponent={() => <Divider inset={58} />}
          ListEmptyComponent={
            <MessageView
              message={
                keyword.trim() || tag ? '조건에 맞는 장소가 없습니다.' : '저장한 장소가 없습니다.'
              }
            />
          }
          renderItem={({ item }) => (
            <PlaceRow place={item} onPress={() => router.push(`/place/${item.id}`)} />
          )}
        />
      )}
      <BottomCta testID="places-add" label="장소 추가" onPress={() => router.push('/search')} />
    </View>
  );
};
