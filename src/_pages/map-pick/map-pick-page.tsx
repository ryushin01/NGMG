import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import type { Region } from 'react-native-maps';
import { View, YStack } from 'tamagui';
import { backend } from '@/shared/api';
import { DEFAULT_REGION } from '@/shared/config';
import { formatCoordinate } from '@/shared/lib';
import { AppMapView, AppText, BottomCta, Header } from '@/shared/ui';

const PIN_WIDTH = 40;
const PIN_HEIGHT = 50;

export const MapPickPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const [initial] = useState<Region>(() =>
    params.lat && params.lng
      ? {
          latitude: Number(params.lat),
          longitude: Number(params.lng),
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : DEFAULT_REGION,
  );
  const [center, setCenter] = useState(initial);

  const address = useQuery({
    queryKey: ['reverse-geocode', center.latitude.toFixed(5), center.longitude.toFixed(5)],
    queryFn: () => backend.search.reverseGeocode(center.latitude, center.longitude),
    meta: { persist: false },
    gcTime: 60 * 1000,
    retry: 1,
  });

  const confirm = () => {
    const query = new URLSearchParams({
      lat: String(center.latitude),
      lng: String(center.longitude),
      address: address.data ?? '',
    });
    router.replace(`/place/new?${query}`);
  };

  return (
    <View flex={1} backgroundColor="surface">
      <Header title="지도에서 설정" />
      <View flex={1}>
        <AppMapView
          testID="map-pick"
          style={StyleSheet.absoluteFill}
          initialRegion={initial}
          onRegionChangeComplete={setCenter}
          showsCompass={false}
          toolbarEnabled={false}
        />
        <View
          position="absolute"
          top="50%"
          left="50%"
          marginLeft={-PIN_WIDTH / 2}
          marginTop={-PIN_HEIGHT}
          pointerEvents="none"
        >
          <Image
            source={require('~/assets/pins/real.png')}
            style={{ width: PIN_WIDTH, height: PIN_HEIGHT }}
            accessibilityLabel="지도 중앙의 선택 위치"
          />
        </View>
      </View>
      <YStack padding={20} gap={4} accessibilityLiveRegion="polite">
        <AppText size="row" tone="ink" numberOfLines={2}>
          {address.isPending
            ? '주소를 찾는 중입니다.'
            : address.data || '주소를 찾지 못했습니다. 좌표로 저장할 수 있습니다.'}
        </AppText>
        <AppText size="caption" tone="muted">
          위도·경도 {formatCoordinate(center.latitude, center.longitude)}
        </AppText>
      </YStack>
      <BottomCta testID="map-pick-confirm" label="이 위치로 설정" onPress={confirm} />
    </View>
  );
};
