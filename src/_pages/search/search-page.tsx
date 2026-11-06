import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { ArrowLeft, Map, MapPin, XCircle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input, View, XStack, YStack } from 'tamagui';
import { KindIcon, usePlaces } from '@/entities/place';
import { usePlaceSearch } from '@/features/place-search';
import type { SearchResult } from '@/shared/api';
import { toErrorMessage } from '@/shared/lib';
import { AppText, Divider, ListRow, LoadingView, MessageView, Touchable } from '@/shared/ui';

export const SearchPage = () => {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const search = usePlaceSearch(query);
  const places = usePlaces();

  const keyword = query.trim();
  const myPlaces = useMemo(
    () =>
      keyword
        ? (places.data ?? []).filter(
            (place) =>
              place.name.includes(keyword) ||
              place.address.includes(keyword) ||
              place.tags.some((tag) => tag.includes(keyword)),
          )
        : (places.data ?? []).slice(0, 5),
    [keyword, places.data],
  );

  const select = (result: SearchResult) => {
    const params = new URLSearchParams({
      lat: String(result.latitude),
      lng: String(result.longitude),
      name: result.name,
      address: result.address,
    });
    router.push(`/place/new?${params}`);
  };

  return (
    <View flex={1} backgroundColor="white">
      <View paddingTop={top} boxShadow="0 4px 8px #0000000f" backgroundColor="white" zIndex={1}>
        <XStack height={60} alignItems="center" paddingHorizontal={8}>
          <Touchable
            onPress={() => router.back()}
            accessibilityLabel="뒤로 가기"
            alignItems="center"
            justifyContent="center"
          >
            <ArrowLeft size={24} color="#1a254f" strokeWidth={1.75} />
          </Touchable>
          <View width={10} height={10} backgroundColor="brand" marginHorizontal={8} />
          <Input
            testID="search-input"
            flex={1}
            borderWidth={0}
            backgroundColor="transparent"
            paddingHorizontal={0}
            autoFocusNative
            value={query}
            onChangeText={setQuery}
            placeholder="주소 또는 장소 이름 입력"
            placeholderTextColor="muted"
            accessibilityLabel="주소 또는 장소 이름"
            returnKeyType="search"
            fontSize={16}
            color="text"
            height={44}
          />
          {query ? (
            <Touchable
              onPress={() => setQuery('')}
              accessibilityLabel="검색어 지우기"
              alignItems="center"
              justifyContent="center"
            >
              <XCircle size={18} color="#5f6673" strokeWidth={1.75} />
            </Touchable>
          ) : null}
        </XStack>
      </View>
      <YStack flex={1}>
        {keyword && search.isError && myPlaces.length === 0 ? (
          <MessageView
            message={toErrorMessage(search.error, '검색하지 못했습니다.')}
            actionLabel="다시 시도"
            onAction={() => search.refetch()}
          />
        ) : keyword && search.isPending ? (
          <LoadingView label="검색 중입니다." />
        ) : (
          <FlashList
            keyboardShouldPersistTaps="handled"
            data={search.data ?? []}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider inset={58} />}
            ListHeaderComponent={
              myPlaces.length > 0 ? (
                <YStack paddingBottom={8}>
                  <AppText
                    size="caption"
                    tone="muted"
                    bold
                    paddingHorizontal={20}
                    paddingTop={16}
                    paddingBottom={4}
                    accessibilityRole="header"
                  >
                    내 장소
                  </AppText>
                  {myPlaces.map((place) => (
                    <ListRow
                      key={place.id}
                      title={place.name}
                      subtitle={place.address}
                      icon={<KindIcon kind={place.kind} />}
                      onPress={() => router.push(`/place/${place.id}`)}
                    />
                  ))}
                  {keyword && search.isError ? (
                    <AppText
                      size="caption"
                      tone="muted"
                      paddingHorizontal={20}
                      paddingTop={12}
                      accessibilityLiveRegion="polite"
                    >
                      새 장소를 검색하지 못했습니다. 연결을 확인하거나 지도에서 설정해 주세요.
                    </AppText>
                  ) : null}
                  {keyword && search.data?.length ? (
                    <AppText
                      size="caption"
                      tone="muted"
                      bold
                      paddingHorizontal={20}
                      paddingTop={16}
                      paddingBottom={4}
                      accessibilityRole="header"
                    >
                      새 장소로 추가
                    </AppText>
                  ) : null}
                </YStack>
              ) : null
            }
            ListEmptyComponent={
              keyword && myPlaces.length === 0 ? (
                <AppText
                  tone="muted"
                  textAlign="center"
                  padding={32}
                  accessibilityLiveRegion="polite"
                >
                  검색 결과가 없습니다. 지도에서 직접 위치를 설정해 보세요.
                </AppText>
              ) : null
            }
            renderItem={({ item }) => (
              <ListRow
                testID={`search-result-${item.id}`}
                title={item.name}
                subtitle={item.address}
                icon={<MapPin size={22} color="#5f6673" strokeWidth={1.5} />}
                onPress={() => select(item)}
              />
            )}
          />
        )}
      </YStack>
      <KeyboardStickyView offset={{ closed: 0, opened: bottom }}>
        <Touchable
          testID="pick-on-map"
          onPress={() => router.push('/map-pick')}
          accessibilityLabel="지도에서 설정"
          borderTopWidth={1}
          borderTopColor="line"
          backgroundColor="white"
          paddingBottom={bottom}
        >
          <XStack height={56} alignItems="center" justifyContent="center" gap={8}>
            <Map size={20} color="#1a254f" strokeWidth={1.5} />
            <AppText tone="ink">지도에서 설정</AppText>
          </XStack>
        </Touchable>
      </KeyboardStickyView>
    </View>
  );
};
