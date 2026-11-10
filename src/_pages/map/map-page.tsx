import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Layers, LocateFixed, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import type { LatLng, MapType } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, YStack } from 'tamagui';
import { useCheckins } from '@/entities/checkin';
import { DESTINATIONS } from '@/entities/destination';
import { usePlaces } from '@/entities/place';
import { mergeCatalogPlaces } from '@/features/destination-save';
import type { Place } from '@/shared/api';
import { AppIcon, Touchable, useColors } from '@/shared/ui';
import { HomeContent, PlaceSummary, type KindFilter } from '@/widgets/home-sheet';
import { SyncBanner } from '@/widgets/sync-banner';
import { PlaceMap, type PlaceMapHandle } from '@/widgets/place-map';

const SHEET_COLLAPSED = 300;

const FloatingButton = ({
  label,
  onPress,
  children,
  testID,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  testID: string;
}) => (
  <Touchable
    testID={testID}
    onPress={onPress}
    accessibilityLabel={label}
    width={48}
    height={48}
    borderRadius={24}
    backgroundColor="surface"
    alignItems="center"
    justifyContent="center"
    boxShadow="0 2px 6px #00000029"
  >
    {children}
  </Touchable>
);

export const MapPage = () => {
  const router = useRouter();
  const colors = useColors();
  const { top } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const mapRef = useRef<PlaceMapHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const sheetPosition = useSharedValue(height - SHEET_COLLAPSED);

  const places = usePlaces();
  const checkins = useCheckins();
  const verifiedIds = useMemo(
    () => new Set((checkins.data ?? []).map((item) => item.catalogId)),
    [checkins.data],
  );
  const [filter, setFilter] = useState<KindFilter>('all');
  const [tag, setTag] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<MapType>('standard');
  const [locationGranted, setLocationGranted] = useState(false);

  const allPlaces = useMemo(
    () => mergeCatalogPlaces(DESTINATIONS, places.data ?? []),
    [places.data],
  );
  const visiblePlaces = useMemo(
    () =>
      allPlaces.filter(
        (place) =>
          (filter === 'all' ||
            (filter === 'verified'
              ? !!place.catalogId && verifiedIds.has(place.catalogId)
              : place.kind === filter)) &&
          (!tag || place.tags.includes(tag)),
      ),
    [allPlaces, filter, tag, verifiedIds],
  );
  const tags = useMemo(
    () => [...new Set(allPlaces.flatMap((place) => place.tags))].slice(0, 12),
    [allPlaces],
  );
  const selected = allPlaces.find((place) => place.id === selectedId) ?? null;

  // 인증한 곳은 세계 곳곳에 흩어져 있으므로, 현장 인증 필터에서는 지도에 보이는 핀이 모두 들어오게 맞춥니다.
  // 인증 목록이 늦게 오거나 태그를 바꿔 보이는 핀이 달라지면 다시 맞춥니다.
  const verifiedKey = filter === 'verified' ? visiblePlaces.map((place) => place.id).join(',') : '';
  useEffect(() => {
    if (!verifiedKey) return;
    mapRef.current?.fit(visiblePlaces.map(({ latitude, longitude }) => ({ latitude, longitude })));
    // 보이는 핀 목록이 바뀔 때만 맞춥니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedKey]);

  const selectPlace = (place: Place) => {
    Haptics.selectionAsync();
    setSelectedId(place.id);
    sheetRef.current?.snapToIndex(0);
    mapRef.current?.focus({ latitude: place.latitude, longitude: place.longitude }, 0.6);
  };

  const moveToCurrentLocation = async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      Alert.alert('위치 권한 필요', '현재 위치를 보려면 설정에서 위치 권한을 허용해 주세요.');
      return;
    }
    setLocationGranted(true);
    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.focus({ latitude: coords.latitude, longitude: coords.longitude }, 0.05);
    } catch {
      Alert.alert('현재 위치를 찾지 못했습니다', '잠시 후 다시 시도해 주세요.');
    }
  };

  const pickOnMap = ({ latitude, longitude }: LatLng) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/map-pick?lat=${latitude}&lng=${longitude}`);
  };

  // 지도 버튼이 시트 위를 따라 움직입니다.
  const floatingStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    right: 16,
    bottom: Math.max(height - sheetPosition.value, SHEET_COLLAPSED) + 12,
    opacity: sheetPosition.value < height * 0.35 ? 0 : 1,
  }));

  return (
    <View flex={1} backgroundColor="surface">
      <PlaceMap
        ref={mapRef}
        places={visiblePlaces}
        verifiedIds={verifiedIds}
        mapType={mapType}
        showsUserLocation={locationGranted}
        bottomInset={SHEET_COLLAPSED}
        onSelectPlace={selectPlace}
        onPressMap={() => setSelectedId(null)}
        onLongPressMap={pickOnMap}
      />
      <View position="absolute" top={top + 8} left={16} right={16} alignItems="flex-end">
        <SyncBanner />
      </View>
      <Animated.View style={floatingStyle}>
        <YStack gap={10}>
          <FloatingButton
            testID="add-place-here"
            label="지도에서 장소 추가"
            onPress={() => router.push('/map-pick')}
          >
            <AppIcon icon={Plus} size={24} color="ink" strokeWidth={1.75} />
          </FloatingButton>
          <FloatingButton
            testID="toggle-map-type"
            label={mapType === 'standard' ? '위성 지도로 보기' : '일반 지도로 보기'}
            onPress={() => setMapType((type) => (type === 'standard' ? 'hybrid' : 'standard'))}
          >
            <AppIcon icon={Layers} size={22} color="ink" strokeWidth={1.75} />
          </FloatingButton>
          <FloatingButton
            testID="current-location"
            label="현재 위치로 이동"
            onPress={moveToCurrentLocation}
          >
            <AppIcon icon={LocateFixed} size={22} color="ink" strokeWidth={1.75} />
          </FloatingButton>
        </YStack>
      </Animated.View>
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={[SHEET_COLLAPSED, '88%']}
        enableDynamicSizing={false}
        animatedPosition={sheetPosition}
        backgroundStyle={{
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: colors.surface,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.muted, width: 36 }}
        style={{ shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 }}
        accessible={false}
      >
        {selected ? (
          <PlaceSummary place={selected} onClose={() => setSelectedId(null)} />
        ) : (
          <HomeContent
            filter={filter}
            onChangeFilter={setFilter}
            tags={tags}
            tag={tag}
            onChangeTag={setTag}
          />
        )}
      </BottomSheet>
    </View>
  );
};
