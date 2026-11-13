import dayjs from 'dayjs';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ArrowLeft, ExternalLink, Heart, Mail, MapPin, Share2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Modal, Platform, ScrollView, Share, type View as NativeView } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import {
  findDestination,
  linksOf,
  LORE_LABELS,
  Postcard,
  READING_LINKS,
  type Destination,
} from '@/entities/destination';
import { KindBadge, KindIcon, usePlaces } from '@/entities/place';
import { RecordRow, useRecords } from '@/entities/record';
import { savedByCatalogId, useToggleWish } from '@/features/destination-save';
import { useAutoPosition } from '@/features/nearby';
import { distanceKm, formatCoordinate, toErrorMessage } from '@/shared/lib';
import {
  AppIcon,
  AppMapView,
  AppText,
  BottomCta,
  Button,
  Divider,
  Header,
  ListRow,
  MessageView,
  Tag,
  Touchable,
} from '@/shared/ui';
import { CheckInPanel } from '@/widgets/check-in-panel';
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

/** 한자·그리스 문자 원어명에는 라틴 전용 글꼴을 쓰지 않습니다. */
const isLatin = (text: string) => /^[\p{Script=Latin}\p{N}\s.,'’-]+$/u.test(text);

const SOLID_AFTER = 230;
const ON_SITE_KM = 5;

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

const SOURCES_URL = 'https://github.com/ryushin01/NewWorld#출처';

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
  const [solid, setSolid] = useState(false);
  const postcard = useRef<NativeView>(null);
  const sharingPostcard = useRef(false);
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const sharePostcard = async () => {
    // 이미지로 찍는 동안 다시 누르면 공유 창이 겹치므로 막습니다.
    if (sharingPostcard.current) return;
    sharingPostcard.current = true;
    setSharing(true);
    try {
      const target = postcard as unknown as Parameters<typeof captureRef>[0];
      const uri = await captureRef(target, { format: 'jpg', quality: 0.9 });
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: '엽서 공유' });
    } catch {
      toast.error('엽서를 만들지 못했습니다.');
    } finally {
      sharingPostcard.current = false;
      setSharing(false);
    }
  };
  const position = useAutoPosition();

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
  const onSite = !fantasy && !!position && distanceKm(position, destination) <= ON_SITE_KM;
  const links = linksOf(destination.id).flatMap((link) => {
    const target = findDestination(link.id);
    return target ? [{ target, note: link.note }] : [];
  });
  const reading = READING_LINKS[destination.id] ?? [];

  return (
    <View flex={1} backgroundColor="surface">
      <ScrollView
        style={{ marginTop: top }}
        contentContainerStyle={{ paddingBottom: 32 }}
        scrollEventThrottle={64}
        onScroll={(event) => {
          const next = event.nativeEvent.contentOffset.y > SOLID_AFTER;
          if (next !== solid) setSolid(next);
        }}
      >
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
          <AppText tone="muted" latin={isLatin(destination.originalName)}>
            {destination.originalName}
          </AppText>
          <AppText tone="ink">{destination.tagline}</AppText>
          <XStack gap={6} flexWrap="wrap">
            <Tag label={LORE_LABELS[destination.lore]} />
            <Tag label={destination.group} />
            <Tag label={destination.era} />
          </XStack>
          {destination.realm === 'real' && destination.loreNote ? (
            <AppText testID="destination-lore-note" size="caption" tone="muted">
              얽힌 이야기: {destination.loreNote}
            </AppText>
          ) : null}
        </YStack>
        <XStack paddingHorizontal={20} paddingBottom={12}>
          <IconAction
            label={fantasy ? '연고지 지도' : '지도 앱'}
            icon={ExternalLink}
            onPress={() => openInMaps(destination)}
          />
          <IconAction label="엽서" icon={Mail} onPress={() => setPostcardOpen(true)} />
          <IconAction
            label="공유"
            icon={Share2}
            onPress={() =>
              Share.share({
                message: `${destination.name}\n${destination.tagline}\n${Linking.createURL(`/destination/${destination.id}`)}`,
              })
            }
          />
        </XStack>
        <CheckInPanel destination={destination} />
        {onSite ? (
          <View paddingHorizontal={20} paddingBottom={12}>
            <Touchable
              testID="destination-on-site"
              onPress={() => router.push(`/record/new?catalogId=${destination.id}`)}
              accessibilityLabel="지금 현장에 있어요, 바로 기록 남기기"
              backgroundColor="brandSoft"
              borderRadius={8}
              padding={14}
              justifyContent="center"
            >
              <AppText tone="ink" bold>
                지금 현장에 있어요. 바로 기록을 남겨 보세요.
              </AppText>
            </Touchable>
          </View>
        ) : null}
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
                <LinkLine label="외교부 해외안전여행 열기" url="https://www.0404.go.kr/" />
              </Section>
            </>
          ) : (
            <>
              <Section title="처음 기록된 곳">
                <AppText>{destination.origin}</AppText>
              </Section>
              <Section title="이곳으로 가는 길">
                <BulletList items={destination.gateways} />
                {reading.map((book) => (
                  <LinkLine key={book.url} label={`읽기: ${book.label}`} url={book.url} />
                ))}
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
        {links.length > 0 ? (
          <>
            <View height={8} backgroundColor="surfaceMuted" />
            <AppText size="title" padding={20} paddingBottom={6} accessibilityRole="header">
              전설의 현장
            </AppText>
            {links.map(({ target, note }) => (
              <ListRow
                key={target.id}
                testID={`related-${target.id}`}
                title={target.name}
                subtitle={note}
                icon={<KindIcon kind={target.realm} />}
                chevron
                onPress={() => router.push(`/destination/${target.id}`)}
              />
            ))}
          </>
        ) : null}
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
        {/* 사진·참고 자료의 출처는 화면이 아니라 README와 docs/credits.md에 두고, 여기서는 그곳으로 잇습니다. */}
        <YStack padding={20} gap={6}>
          <LinkLine label="자료·사진 출처 (README)" url={SOURCES_URL} />
        </YStack>
      </ScrollView>
      {solid ? (
        <View
          position="absolute"
          top={0}
          left={0}
          right={0}
          height={top + 60}
          backgroundColor="surface"
          borderBottomWidth={1}
          borderBottomColor="line"
          justifyContent="flex-end"
          alignItems="center"
          paddingBottom={18}
        >
          <AppText size="row" tone="ink" numberOfLines={1} maxWidth="60%">
            {destination.name}
          </AppText>
        </View>
      ) : null}
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
      {/* 엽서는 미리 보여 준 뒤 보이는 그대로 이미지로 찍어 공유합니다. iOS는 화면 밖 뷰를 찍지 못합니다. */}
      <Modal
        visible={postcardOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPostcardOpen(false)}
      >
        <View
          flex={1}
          backgroundColor="rgba(0,0,0,0.6)"
          alignItems="center"
          justifyContent="center"
          padding={16}
          accessibilityViewIsModal
        >
          <YStack gap={16} alignItems="center">
            <Postcard
              ref={postcard}
              destination={destination}
              dateLabel={dayjs().format('YYYY. M. D.')}
            />
            <XStack gap={8} width={360} maxWidth="100%">
              <View flex={1}>
                <Button
                  testID="postcard-close"
                  variant="outline"
                  label="닫기"
                  onPress={() => setPostcardOpen(false)}
                />
              </View>
              <View flex={1}>
                <Button
                  testID="postcard-share"
                  label="엽서 공유"
                  loading={sharing}
                  onPress={sharePostcard}
                />
              </View>
            </XStack>
          </YStack>
        </View>
      </Modal>
      <BottomCta
        testID="destination-add-record"
        label={fantasy ? '상상 여행기 쓰기' : '여행 기록 쓰기'}
        onPress={() => router.push(`/record/new?catalogId=${destination.id}`)}
      />
    </View>
  );
};
