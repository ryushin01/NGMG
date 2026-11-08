import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View, XStack } from 'tamagui';
import { DESTINATIONS, TIMELINE_YEARS } from '@/entities/destination';
import { KindIcon } from '@/entities/place';
import type { PlaceKind } from '@/shared/api';
import { AppText, Chip, Divider, Header, ListRow } from '@/shared/ui';

type Filter = PlaceKind | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'real', label: '실존' },
  { value: 'fantasy', label: '환상' },
];

const ENTRIES = DESTINATIONS.flatMap((item) =>
  TIMELINE_YEARS[item.id] === undefined ? [] : [{ item, year: TIMELINE_YEARS[item.id] }],
).sort((a, b) => a.year - b.year);

export const TimelinePage = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const data = useMemo(
    () => ENTRIES.filter(({ item }) => filter === 'all' || item.realm === filter),
    [filter],
  );
  return (
    <View flex={1} backgroundColor="surface">
      <Header title="시대순 연대표" />
      <XStack
        gap={8}
        paddingHorizontal={20}
        paddingBottom={8}
        accessibilityRole="radiogroup"
        accessibilityLabel="분류"
      >
        {FILTERS.map((option) => (
          <Chip
            key={option.value}
            testID={`timeline-${option.value}`}
            label={option.label}
            selected={filter === option.value}
            onPress={() => setFilter(option.value)}
          />
        ))}
      </XStack>
      <AppText size="caption" tone="muted" paddingHorizontal={20} paddingBottom={12}>
        환상 세계는 처음 문헌에 나타난 시기로 놓았고, 연도를 잡기 어려운 구전은 뺐습니다.
      </AppText>
      <Divider />
      <FlashList
        data={data}
        keyExtractor={({ item }) => item.id}
        ItemSeparatorComponent={() => <Divider inset={58} />}
        renderItem={({ item: { item } }) => (
          <ListRow
            testID={`timeline-row-${item.id}`}
            title={item.name}
            subtitle={`${item.era} · ${item.location}`}
            icon={<KindIcon kind={item.realm} />}
            chevron
            onPress={() => router.push(`/destination/${item.id}`)}
          />
        )}
      />
    </View>
  );
};
