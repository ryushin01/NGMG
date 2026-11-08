import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ExternalLink, Heart, MapPin, Share2 } from 'lucide-react-native';
import { Platform, ScrollView, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { findDestination, type Destination } from '@/entities/destination';
import { KindBadge, usePlaces } from '@/entities/place';
import { RecordRow, useRecords } from '@/entities/record';
import { savedByCatalogId, useToggleWish } from '@/features/destination-save';
import { formatCoordinate, toErrorMessage } from '@/shared/lib';
import {
  AppIcon,
  AppMapView,
  AppText,
  BottomCta,
  Divider,
  Header,
  MessageView,
  Tag,
  Touchable,
} from '@/shared/ui';
import { PlaceMarker } from '@/widgets/place-map';

const openLink = (url: string) =>
  Linking.openURL(url).catch(() => toast.error('링크를 열지 못했습니다.'));

const openInMaps = ({ latitude, longitude, name }: Destination) => {
  const label = encodeURIComponent(name);
  openLink(
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <YStack gap={8}>
    <AppText size="row" tone="ink" bold accessibilityRole="header">
      {title}
    </AppText>
    {children}
  </YStack>
);

const BulletList = ({ items }: { items: string[] }) => (
  <YStack gap={6}>
    {items.map((item) => (
      <XStack key={item} gap={8} accessible accessibilityLabel={item}>
        <AppText tone="muted">•</AppText>
        <AppText flex={1}>{item}</AppText>
      </XStack>
    ))}
  </YStack>
);

const LinkLine = ({ label, url }: { label: string; url: string }) => (
  <Touchable
    onPress={() => openLink(url)}
    accessibilityRole="link"
    accessibilityLabel={`${label}, 브라우저에서 열기`}
    justifyContent="center"
  >
    <AppText size="caption" tone="brand">
      {label}
    </AppText>
  </Touchable>
);

const IconAction = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: typeof MapPin;
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
    <AppIcon icon={icon} size={20} color="ink" strokeWidth={1.5} />
    <AppText size="caption" tone="ink">
      {label}
    </AppText>
  </Touchable>
);

export const DestinationDetailPage = () => {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const destination = findDestination(id);
  const places = usePlaces();
  const toggleWish = useToggleWish();
  const saved = savedByCatalogId(places.data ?? []).get(id);
  const records = useRecords(saved?.id);
  const myRecords = saved ? (records.data ?? []) : [];

  if (!destination) {
    return (
      <View flex={1} backgroundColor="surface">
        <Header title="여행지" />
        <MessageView message="여행지를 찾을 수 없습니다." />
      </View>
    );
  }

  const coordinate = { latitude: destination.latitude, longitude: destination.longitude };
  const wished = saved?.wishlisted ?? false;
  const fantasy = destination.realm === 'fantasy';

  return (
    <View flex={1} backgroundColor="surface">
      <ScrollView style={{ marginTop: top }} contentContainerStyle={{ paddingBottom: 32 }}>
        <View height={300} backgroundColor="surfaceMuted">
          <Image
            source={destination.image}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessible
            accessibilityLabel={`${destination.name}을(를) 담은 사진`}
            accessibilityIgnoresInvertColors
          />
        </View>
        <YStack padding={20} gap={10}>
          <KindBadge kind={destination.realm} />
          <AppText size="headline" accessibilityRole="header" testID="destination-title">
            {destination.name}
          </AppText>
          <AppText tone="muted">{destination.originalName}</AppText>
          <AppText tone="ink">{destination.tagline}</AppText>
          <XStack gap={6} flexWrap="wrap">
            <Tag label={destination.group} />
            <Tag label={destination.era} />
          </XStack>
        </YStack>
        <XStack paddingHorizontal={20} paddingBottom={12}>
          <IconAction
            label={fantasy ? '연고지 지도' : '지도 앱'}
            icon={ExternalLink}
            onPress={() => openInMaps(destination)}
          />
          <IconAction
            label="공유"
            icon={Share2}
            onPress={() => Share.share({ message: `${destination.name}\n${destination.tagline}` })}
          />
        </XStack>
        <View height={8} backgroundColor="surfaceMuted" />
        <YStack padding={20} gap={24}>
          <Section title="소개">
            <AppText>{destination.overview}</AppText>
          </Section>
          <Section title={fantasy ? '이곳의 풍경' : '볼거리'}>
            <BulletList items={destination.highlights} />
          </Section>
          {destination.realm === 'real' ? (
            <>
              <Section title="가기 좋은 때">
                <AppText>{destination.bestSeason}</AppText>
              </Section>
              <Section title="여행 팁">
                <BulletList items={destination.tips} />
                <AppText size="caption" tone="muted">
                  입장권, 운영 시간, 여행경보는 바뀔 수 있으니 떠나기 전에 공식 안내를 확인하세요.
                </AppText>
              </Section>
            </>
          ) : (
            <>
              <Section title="처음 기록된 곳">
                <AppText>{destination.origin}</AppText>
              </Section>
              <Section title="이곳으로 가는 길">
                <BulletList items={destination.gateways} />
              </Section>
            </>
          )}
          <Section title={fantasy ? '현실의 연고지' : '위치'}>
            <XStack gap={6}>
              <AppIcon icon={MapPin} size={18} color="muted" strokeWidth={1.75} />
              <YStack flex={1}>
                <AppText>{destination.location}</AppText>
                <AppText size="caption" tone="muted">
                  위도·경도 {formatCoordinate(destination.latitude, destination.longitude)}
                </AppText>
              </YStack>
            </XStack>
            {destination.realm === 'fantasy' ? (
              <AppText testID="destination-location-note">{destination.locationNote}</AppText>
            ) : null}
            <View
              height={180}
              borderRadius={12}
              overflow="hidden"
              accessible
              accessibilityLabel={`${destination.name} 위치 지도`}
            >
              <AppMapView
                style={{ flex: 1 }}
                liteMode
                pointerEvents="none"
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                region={{ ...coordinate, latitudeDelta: 0.4, longitudeDelta: 0.4 }}
              >
                <PlaceMarker coordinate={coordinate} kind={destination.realm} />
              </AppMapView>
            </View>
          </Section>
        </YStack>
        <View height={8} backgroundColor="surfaceMuted" />
        <AppText size="title" padding={20} paddingBottom={6} accessibilityRole="header">
          내 기록 {myRecords.length}건
        </AppText>
        {myRecords.length > 0 ? (
          myRecords.map((record, index) => (
            <View key={record.id}>
              {index > 0 ? <Divider inset={20} /> : null}
              <RecordRow record={record} onPress={() => router.push(`/record/${record.id}`)} />
            </View>
          ))
        ) : (
          <AppText tone="muted" textAlign="center" padding={24}>
            {fantasy ? '아직 이곳을 여행한 기록이 없습니다.' : '아직 다녀온 기록이 없습니다.'}
          </AppText>
        )}
        <YStack padding={20} gap={6}>
          <AppText size="caption" tone="muted" bold accessibilityRole="header">
            자료 출처
          </AppText>
          {destination.sources.map((source) => (
            <LinkLine key={source.url} label={source.label} url={source.url} />
          ))}
          <LinkLine
            label={`사진: ${destination.imageCredit.author} (${destination.imageCredit.license})`}
            url={destination.imageCredit.url}
          />
        </YStack>
      </ScrollView>
      <View position="absolute" top={top + 8} left={16}>
        <Touchable
          onPress={() => router.back()}
          accessibilityLabel="뒤로 가기"
          width={44}
          height={44}
          borderRadius={22}
          backgroundColor="surface"
          alignItems="center"
          justifyContent="center"
        >
          <AppIcon icon={ArrowLeft} size={24} color="ink" strokeWidth={1.75} />
        </Touchable>
      </View>
      <View position="absolute" top={top + 8} right={16}>
        <Touchable
          testID="destination-wish"
          onPress={() =>
            toggleWish(destination, {
              onError: (error) => toast.error(toErrorMessage(error, '저장하지 못했습니다.')),
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`${destination.name} 가고 싶어요`}
          accessibilityState={{ selected: wished }}
          width={44}
          height={44}
          borderRadius={22}
          backgroundColor="surface"
          alignItems="center"
          justifyContent="center"
        >
          <AppIcon
            icon={Heart}
            size={22}
            color={wished ? 'danger' : 'ink'}
            fill={wished ? 'danger' : undefined}
            strokeWidth={1.75}
          />
        </Touchable>
      </View>
      <BottomCta
        testID="destination-add-record"
        label={fantasy ? '상상 여행기 쓰기' : '여행 기록 쓰기'}
        onPress={() => router.push(`/record/new?catalogId=${destination.id}`)}
      />
    </View>
  );
};
