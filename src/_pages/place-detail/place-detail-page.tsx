import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Copy, ExternalLink, MapPin, Share2 } from 'lucide-react-native';
import { Alert, Platform, ScrollView, Share } from 'react-native';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { KIND_META, KindBadge, useDeletePlace, usePlace } from '@/entities/place';
import { RecordRow, useRecords } from '@/entities/record';
import type { Place } from '@/shared/api';
import { formatCoordinate, toErrorMessage } from '@/shared/lib';
import {
  AppIcon,
  AppMapView,
  AppText,
  BottomCta,
  Button,
  Divider,
  Header,
  HeaderTextButton,
  LoadingView,
  MessageView,
  Tag,
  Touchable,
} from '@/shared/ui';
import { PlaceMarker } from '@/widgets/place-map';

const openInMaps = ({ latitude, longitude, name }: Place) => {
  const label = encodeURIComponent(name);
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
  Linking.openURL(url).catch(() => toast.error('지도 앱을 열지 못했습니다.'));
};

const ActionButton = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) => (
  <Touchable
    onPress={onPress}
    accessibilityLabel={label}
    flex={1}
    alignItems="center"
    justifyContent="center"
    paddingVertical={8}
    gap={4}
  >
    {icon}
    <AppText size="caption" tone="ink">
      {label}
    </AppText>
  </Touchable>
);

export const PlaceDetailPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = usePlace(id);
  const records = useRecords(id);
  const remove = useDeletePlace();

  if (!place.data) {
    return (
      <View flex={1} backgroundColor="surface">
        <Header title="장소" />
        {place.isError ? (
          <MessageView
            message={toErrorMessage(place.error)}
            actionLabel="다시 시도"
            onAction={() => place.refetch()}
          />
        ) : (
          <LoadingView />
        )}
      </View>
    );
  }

  const data = place.data;
  // 수록된 여행지는 도감 상세가 정보와 기록을 함께 보여 줍니다.
  if (data.catalogId) return <Redirect href={`/destination/${data.catalogId}`} />;
  const coordinate = { latitude: data.latitude, longitude: data.longitude };

  const confirmDelete = () => {
    Alert.alert(
      '장소 삭제',
      `'${data.name}'과(와) 기록 ${data.recordCount}건, 첨부 사진이 모두 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () =>
            remove.mutate(id, {
              onSuccess: () => {
                toast.success('장소를 삭제했습니다.');
                router.dismissTo('/');
              },
              onError: (error) => toast.error(toErrorMessage(error, '삭제하지 못했습니다.')),
            }),
        },
      ],
    );
  };

  return (
    <View flex={1} backgroundColor="surface">
      <Header
        title={KIND_META[data.kind].label}
        right={<HeaderTextButton label="편집" onPress={() => router.push(`/place/${id}/edit`)} />}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View height={180} accessible accessibilityLabel={`${data.name} 위치 지도`}>
          <AppMapView
            style={{ flex: 1 }}
            liteMode
            pointerEvents="none"
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            region={{ ...coordinate, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
          >
            <PlaceMarker coordinate={coordinate} kind={data.kind} />
          </AppMapView>
        </View>
        <YStack padding={20} gap={10}>
          <KindBadge kind={data.kind} />
          <AppText size="headline" accessibilityRole="header" testID="place-title">
            {data.name}
          </AppText>
          <XStack gap={6}>
            <AppIcon icon={MapPin} size={18} color="muted" strokeWidth={1.75} />
            <YStack flex={1}>
              <AppText>{data.address || '주소 없음'}</AppText>
              <AppText size="caption" tone="muted">
                위도·경도 {formatCoordinate(data.latitude, data.longitude)}
              </AppText>
            </YStack>
          </XStack>
          {data.tags.length > 0 ? (
            <XStack gap={6} flexWrap="wrap">
              {data.tags.map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
            </XStack>
          ) : null}
          {data.memo ? <AppText>{data.memo}</AppText> : null}
        </YStack>
        <XStack paddingHorizontal={20} paddingBottom={12}>
          <ActionButton
            label="지도 앱"
            icon={<AppIcon icon={ExternalLink} size={20} color="ink" strokeWidth={1.5} />}
            onPress={() => openInMaps(data)}
          />
          <ActionButton
            label="주소 복사"
            icon={<AppIcon icon={Copy} size={20} color="ink" strokeWidth={1.5} />}
            onPress={async () => {
              await Clipboard.setStringAsync(
                data.address || formatCoordinate(data.latitude, data.longitude),
              );
              toast.success('복사했습니다.');
            }}
          />
          <ActionButton
            label="공유"
            icon={<AppIcon icon={Share2} size={20} color="ink" strokeWidth={1.5} />}
            onPress={() =>
              Share.share({
                message: `${data.name}\n${data.address}\n${formatCoordinate(data.latitude, data.longitude)}`,
              })
            }
          />
        </XStack>
        <View height={8} backgroundColor="surfaceMuted" />
        <AppText size="title" padding={20} paddingBottom={6} accessibilityRole="header">
          기록 {records.data?.length ?? data.recordCount}건
        </AppText>
        {records.isPending ? (
          <View height={120}>
            <LoadingView />
          </View>
        ) : records.data?.length ? (
          records.data.map((record, index) => (
            <View key={record.id}>
              {index > 0 ? <Divider inset={20} /> : null}
              <RecordRow record={record} onPress={() => router.push(`/record/${record.id}`)} />
            </View>
          ))
        ) : (
          <AppText tone="muted" textAlign="center" padding={24}>
            아직 기록이 없습니다.
          </AppText>
        )}
        <View padding={20} paddingTop={32}>
          <Button
            testID="place-delete"
            variant="danger"
            label="장소 삭제"
            loading={remove.isPending}
            onPress={confirmDelete}
          />
        </View>
      </ScrollView>
      <BottomCta
        testID="place-add-record"
        label="기록 추가"
        onPress={() => router.push(`/record/new?placeId=${id}`)}
      />
    </View>
  );
};
