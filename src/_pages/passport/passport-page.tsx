import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { useCheckins } from '@/entities/checkin';
import { DESTINATIONS, Stamp } from '@/entities/destination';
import { usePlaces } from '@/entities/place';
import { BadgeMedal, BadgeShare, evaluateBadges } from '@/features/badges';
import { savedByCatalogId } from '@/features/destination-save';
import { AppText, Button, Header } from '@/shared/ui';

const COLUMNS = 3;
const GUTTER = 20;
const GAP = 16;
const RECENT_LIMIT = 5;

export const PassportPage = () => {
  const router = useRouter();
  const places = usePlaces();
  const checkins = useCheckins();
  const { width } = useWindowDimensions();
  const card = useRef(null) as unknown as Parameters<typeof captureRef>[0];
  const [sharing, setSharing] = useState(false);
  const [badgeShareOpen, setBadgeShareOpen] = useState(false);
  const size = (width - GUTTER * 2 - GAP * (COLUMNS - 1)) / COLUMNS - 8;

  const saved = useMemo(() => savedByCatalogId(places.data ?? []), [places.data]);
  const yearOf = (id: string) => {
    const place = saved.get(id);
    return place && place.recordCount > 0 && place.lastVisitedAt
      ? dayjs(place.lastVisitedAt).year()
      : null;
  };
  const verified = useMemo(
    () => new Map((checkins.data ?? []).map((item) => [item.catalogId, item.checkedAt])),
    [checkins.data],
  );
  const badges = useMemo(() => evaluateBadges(checkins.data ?? []), [checkins.data]);
  const earned = badges.filter((item) => item.earned);
  const stamped = DESTINATIONS.filter((item) => verified.has(item.id) || yearOf(item.id) !== null);
  const count = (realm: 'real' | 'fantasy') =>
    `${stamped.filter((item) => item.realm === realm).length}/${
      DESTINATIONS.filter((item) => item.realm === realm).length
    }`;

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '신세계 여권 공유' });
    } catch {
      toast.error('여권을 공유하지 못했습니다.');
    } finally {
      setSharing(false);
    }
  };

  const section = (realm: 'real' | 'fantasy', title: string) => (
    <YStack gap={12}>
      <AppText size="title" accessibilityRole="header">
        {title} {count(realm)}
      </AppText>
      <XStack flexWrap="wrap" gap={GAP}>
        {DESTINATIONS.filter((item) => item.realm === realm).map((item) => (
          <Stamp
            key={item.id}
            destination={item}
            year={yearOf(item.id)}
            verifiedAt={verified.get(item.id) ?? null}
            size={size}
            onPress={() => router.push(`/destination/${item.id}`)}
          />
        ))}
      </XStack>
    </YStack>
  );

  return (
    <View flex={1} backgroundColor="surface">
      <Header title="여행 여권" />
      <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 28, paddingBottom: 40 }}>
        <YStack gap={12}>
          <View
            ref={card as never}
            collapsable={false}
            backgroundColor="ink"
            borderRadius={16}
            padding={20}
          >
            <YStack gap={14}>
              <AppText size="headline" tone="inverse">
                신세계 여행 여권
              </AppText>
              <AppText tone="inverse" testID="passport-summary">
                실존 유적 {count('real')} · 환상 세계 {count('fantasy')}
              </AppText>
              <AppText tone="inverse" testID="passport-badges-summary">
                현장 인증 {verified.size} · 기념 뱃지 {earned.length}/{badges.length}
              </AppText>
              <XStack gap={8}>
                {stamped.slice(0, RECENT_LIMIT).map((item) => (
                  <Image
                    key={item.id}
                    source={item.image}
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                  />
                ))}
              </XStack>
            </YStack>
          </View>
          <Button
            testID="passport-share"
            variant="outline"
            label="여권 이미지 공유"
            loading={sharing}
            onPress={share}
          />
        </YStack>
        <YStack gap={12}>
          <AppText size="title" accessibilityRole="header">
            기념 뱃지 {earned.length}/{badges.length}
          </AppText>
          <AppText size="caption" tone="muted">
            여행지 상세에서 현장 인증을 하면 스탬프와 함께 뱃지를 모을 수 있어요.
          </AppText>
          <Button
            testID="passport-badge-share"
            variant="outline"
            label="뱃지 이미지 공유"
            disabled={earned.length === 0}
            onPress={() => setBadgeShareOpen(true)}
          />
          <XStack flexWrap="wrap" gap={8} testID="passport-badges">
            {[...earned, ...badges.filter((item) => !item.earned)].map((status) => (
              <BadgeMedal key={status.badge.id} status={status} size={64} />
            ))}
          </XStack>
        </YStack>
        {section('real', '실존 유적')}
        {section('fantasy', '환상 세계')}
      </ScrollView>
      <BadgeShare
        statuses={badges}
        visible={badgeShareOpen}
        onClose={() => setBadgeShareOpen(false)}
      />
    </View>
  );
};
