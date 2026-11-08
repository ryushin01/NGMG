import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';
import { Alert, ScrollView } from 'react-native';
import { Polyline } from 'react-native-maps';
import { toast } from 'sonner-native';
import { View, YStack } from 'tamagui';
import {
  buildDefaultItems,
  buildFantasyItems,
  useChecklist,
  useUpsertChecklist,
} from '@/entities/checklist';
import { findDestination, type Destination } from '@/entities/destination';
import { KindIcon, usePlaces } from '@/entities/place';
import { formatTripDates, useDeleteTrip, useTrip } from '@/entities/trip';
import { savedByCatalogId } from '@/features/destination-save';
import { toErrorMessage } from '@/shared/lib';
import {
  AppMapView,
  AppText,
  Button,
  Divider,
  Header,
  HeaderTextButton,
  ListRow,
  LoadingView,
  MessageView,
  useColors,
} from '@/shared/ui';
import { PlaceMarker } from '@/widgets/place-map';

const LIST_NAME_LIMIT = 50;
const MIN_DELTA = 2;
const PADDING = 1.5;

const regionOf = (stops: Destination[]) => {
  const latitudes = stops.map((stop) => stop.latitude);
  const longitudes = stops.map((stop) => stop.longitude);
  const [north, south] = [Math.max(...latitudes), Math.min(...latitudes)];
  const [east, west] = [Math.max(...longitudes), Math.min(...longitudes)];
  return {
    latitude: (north + south) / 2,
    longitude: (east + west) / 2,
    latitudeDelta: Math.max((north - south) * PADDING, MIN_DELTA),
    longitudeDelta: Math.max((east - west) * PADDING, MIN_DELTA),
  };
};

export const TripDetailPage = () => {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTrip(id);
  const places = usePlaces();
  const checklist = useChecklist();
  const upsert = useUpsertChecklist();
  const remove = useDeleteTrip();
  const creating = useRef(false);

  if (!trip.data) {
    return (
      <View flex={1} backgroundColor="surface">
        <Header title="여정" />
        {trip.isPending ? <LoadingView /> : <MessageView message="여정을 찾을 수 없습니다." />}
      </View>
    );
  }

  const data = trip.data;
  const stops = data.stops.flatMap((stop) => {
    const found = findDestination(stop);
    return found ? [found] : [];
  });
  const saved = savedByCatalogId(places.data ?? []);
  const visited = stops.filter((stop) => (saved.get(stop.id)?.recordCount ?? 0) > 0).length;
  const listName = data.title.slice(0, LIST_NAME_LIMIT);

  const openChecklist = () => {
    const go = () => router.push(`/checklist?list=${encodeURIComponent(listName)}`);
    if ((checklist.data ?? []).some((item) => item.listName === listName)) {
      go();
      return;
    }
    if (creating.current) return;
    creating.current = true;
    const build = stops.every((stop) => stop.realm === 'fantasy')
      ? buildFantasyItems
      : buildDefaultItems;
    upsert.mutate(
      build(() => Crypto.randomUUID(), listName),
      {
        onSuccess: go,
        onError: (error) => toast.error(toErrorMessage(error, '체크리스트를 만들지 못했습니다.')),
        onSettled: () => {
          creating.current = false;
        },
      },
    );
  };

  const confirmDelete = () =>
    Alert.alert('여정 삭제', `'${data.title}' 여정을 지웁니다. 기록은 그대로 남습니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onSuccess: () => router.back(),
            onError: (error) => toast.error(toErrorMessage(error, '삭제하지 못했습니다.')),
          }),
      },
    ]);

  return (
    <View flex={1} backgroundColor="surface">
      <Header
        title="여정"
        right={<HeaderTextButton label="편집" onPress={() => router.push(`/trip/${id}/edit`)} />}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <YStack padding={20} gap={6}>
          <AppText size="headline" accessibilityRole="header" testID="trip-detail-title">
            {data.title}
          </AppText>
          <AppText tone="muted">{formatTripDates(data)}</AppText>
          <AppText tone="ink">
            {stops.length}곳 중 {visited}곳 다녀옴
          </AppText>
          {data.memo ? <AppText>{data.memo}</AppText> : null}
        </YStack>
        {stops.length > 0 ? (
          <View
            height={200}
            accessible
            accessibilityLabel={`여정 지도, ${stops.map((stop) => stop.name).join(', ')} 순서`}
          >
            <AppMapView
              style={{ flex: 1 }}
              pointerEvents="none"
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              region={regionOf(stops)}
            >
              <Polyline
                coordinates={stops.map(({ latitude, longitude }) => ({ latitude, longitude }))}
                strokeColor={colors.brandText}
                strokeWidth={3}
                geodesic
              />
              {stops.map((stop) => (
                <PlaceMarker
                  key={stop.id}
                  coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                  kind={stop.realm}
                />
              ))}
            </AppMapView>
          </View>
        ) : null}
        {stops.map((stop, index) => (
          <YStack key={stop.id}>
            {index > 0 ? <Divider inset={58} /> : null}
            <ListRow
              testID={`trip-stop-${stop.id}`}
              title={`${index + 1}. ${stop.name}`}
              subtitle={`${stop.location}${(saved.get(stop.id)?.recordCount ?? 0) > 0 ? ' · 다녀옴' : ''}`}
              icon={<KindIcon kind={stop.realm} />}
              chevron
              onPress={() => router.push(`/destination/${stop.id}`)}
            />
          </YStack>
        ))}
        <YStack padding={20} gap={10}>
          <Button
            testID="trip-checklist"
            variant="outline"
            label="이 여정의 체크리스트"
            loading={upsert.isPending}
            onPress={openChecklist}
          />
          <Button
            testID="trip-delete"
            variant="danger"
            label="여정 삭제"
            loading={remove.isPending}
            onPress={confirmDelete}
          />
        </YStack>
      </ScrollView>
    </View>
  );
};
