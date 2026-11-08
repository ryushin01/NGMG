import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { DESTINATIONS, Stamp } from '@/entities/destination';
import { usePlaces } from '@/entities/place';
import { savedByCatalogId } from '@/features/destination-save';
import { AppText, Button, Header } from '@/shared/ui';

const COLUMNS = 3;
const GUTTER = 20;
const GAP = 16;
const RECENT_LIMIT = 5;

export const PassportPage = () => {
  const router = useRouter();
  const places = usePlaces();
  const { width } = useWindowDimensions();
  const card = useRef(null) as unknown as Parameters<typeof captureRef>[0];
  const [sharing, setSharing] = useState(false);
  const size = (width - GUTTER * 2 - GAP * (COLUMNS - 1)) / COLUMNS - 8;

  const saved = useMemo(() => savedByCatalogId(places.data ?? []), [places.data]);
  const yearOf = (id: string) => {
    const place = saved.get(id);
    return place && place.recordCount > 0 && place.lastVisitedAt
      ? dayjs(place.lastVisitedAt).year()
      : null;
  };
  const stamped = DESTINATIONS.filter((item) => yearOf(item.id) !== null);
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
        {section('real', '실존 유적')}
        {section('fantasy', '환상 세계')}
      </ScrollView>
    </View>
  );
};
