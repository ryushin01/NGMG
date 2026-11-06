import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View, XStack } from 'tamagui';
import { matchesRecord, RecordRow, useRecords } from '@/entities/record';
import type { PlaceKind } from '@/shared/api';
import { toErrorMessage } from '@/shared/lib';
import { Chip, Divider, Field, Header, LoadingView, MessageView } from '@/shared/ui';

type Filter = PlaceKind | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'fishing', label: '낚시' },
  { value: 'restaurant', label: '맛집' },
];

export const RecordsPage = () => {
  const router = useRouter();
  const records = useRecords();
  const [filter, setFilter] = useState<Filter>('all');
  const [keyword, setKeyword] = useState('');
  const data = useMemo(
    () =>
      (records.data ?? []).filter(
        (record) =>
          (filter === 'all' || record.placeKind === filter) && matchesRecord(record, keyword),
      ),
    [filter, keyword, records.data],
  );
  return (
    <View flex={1} backgroundColor="white">
      <Header title="전체 기록" />
      <View paddingHorizontal={20} paddingBottom={12}>
        <Field
          testID="records-search"
          label="기록 검색"
          placeholder="제목, 장소, 어종, 미끼, 멤버, 메뉴"
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
      <Divider />
      {records.isPending ? (
        <LoadingView />
      ) : records.isError && !records.data ? (
        <MessageView
          message={toErrorMessage(records.error)}
          actionLabel="다시 시도"
          onAction={() => records.refetch()}
        />
      ) : (
        <FlashList
          data={data}
          keyExtractor={(record) => record.id}
          onRefresh={() => records.refetch()}
          refreshing={records.isRefetching}
          ItemSeparatorComponent={() => <Divider inset={20} />}
          ListEmptyComponent={
            <MessageView
              message={
                keyword.trim()
                  ? '검색 결과가 없습니다.'
                  : '아직 기록이 없습니다. 지도에서 장소를 골라 기록을 남겨 보세요.'
              }
            />
          }
          renderItem={({ item }) => (
            <RecordRow record={item} onPress={() => router.push(`/record/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
};
