import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import {
  DestinationCard,
  FANTASY_GROUPS,
  REAL_GROUPS,
  searchDestinations,
} from '@/entities/destination';
import { usePlaces } from '@/entities/place';
import { savedByCatalogId, useToggleWish } from '@/features/destination-save';
import type { PlaceKind } from '@/shared/api';
import { toErrorMessage } from '@/shared/lib';
import { AppText, Chip, Field, MessageView } from '@/shared/ui';
import { SyncBanner } from '@/widgets/sync-banner';

const COPY: Record<PlaceKind, { title: string; subtitle: string; placeholder: string }> = {
  real: {
    title: '실존 유적',
    subtitle: '지금 비행기를 타면 갈 수 있는 곳',
    placeholder: '예: 피라미드, 페루, 마야',
  },
  fantasy: {
    title: '환상 세계',
    subtitle: '책과 전설로만 닿을 수 있는 곳',
    placeholder: '예: 아발론, 아서왕, 낙원',
  },
};

const WorldPage = ({ realm }: { realm: PlaceKind }) => {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const places = usePlaces();
  const toggleWish = useToggleWish();
  const [keyword, setKeyword] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const copy = COPY[realm];
  const groups = realm === 'real' ? REAL_GROUPS : FANTASY_GROUPS;

  const saved = useMemo(() => savedByCatalogId(places.data ?? []), [places.data]);
  const all = useMemo(() => searchDestinations('', realm), [realm]);
  const visitedCount = all.filter((item) => (saved.get(item.id)?.recordCount ?? 0) > 0).length;
  const data = useMemo(
    () => searchDestinations(keyword, realm).filter((item) => !group || item.group === group),
    [group, keyword, realm],
  );

  return (
    <View flex={1} backgroundColor="surface">
      <FlashList
        data={data}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <YStack paddingTop={top + 16} paddingBottom={16} gap={14}>
            <XStack paddingHorizontal={20} justifyContent="space-between" alignItems="flex-start">
              <YStack flex={1} gap={2}>
                <AppText size="headline" accessibilityRole="header">
                  {copy.title}
                </AppText>
                <AppText tone="muted">{copy.subtitle}</AppText>
                <AppText testID={`world-progress-${realm}`} size="caption" tone="ink">
                  {all.length}곳 중 {visitedCount}곳 다녀옴
                </AppText>
              </YStack>
              <SyncBanner />
            </XStack>
            <View paddingHorizontal={20}>
              <Field
                testID={`world-search-${realm}`}
                label="여행지 검색"
                placeholder={copy.placeholder}
                value={keyword}
                onChangeText={setKeyword}
                returnKeyType="search"
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              <XStack
                gap={8}
                accessibilityRole="radiogroup"
                accessibilityLabel={realm === 'real' ? '대륙' : '전승권'}
              >
                <Chip
                  testID={`world-group-all-${realm}`}
                  label="전체"
                  selected={group === null}
                  onPress={() => setGroup(null)}
                />
                {groups.map((item) => (
                  <Chip
                    key={item}
                    testID={`world-group-${item}`}
                    label={item}
                    selected={group === item}
                    onPress={() => setGroup(item)}
                  />
                ))}
              </XStack>
            </ScrollView>
          </YStack>
        }
        ListEmptyComponent={<MessageView message="조건에 맞는 여행지가 없습니다." />}
        renderItem={({ item }) => {
          const place = saved.get(item.id);
          return (
            <DestinationCard
              destination={item}
              wishlisted={place?.wishlisted ?? false}
              visited={(place?.recordCount ?? 0) > 0}
              onPress={() => router.push(`/destination/${item.id}`)}
              onToggleWish={() =>
                toggleWish(item, {
                  onError: (error) => toast.error(toErrorMessage(error, '저장하지 못했습니다.')),
                })
              }
            />
          );
        }}
      />
    </View>
  );
};

export const RealWorldPage = () => <WorldPage realm="real" />;
export const FantasyWorldPage = () => <WorldPage realm="fantasy" />;
