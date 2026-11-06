import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'tamagui';
import { PlaceForm } from '@/features/place-editor';
import { Header, MessageView } from '@/shared/ui';

export const PlaceNewPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    name?: string;
    address?: string;
  }>();
  const latitude = Number(params.lat);
  const longitude = Number(params.lng);
  const valid = Number.isFinite(latitude) && Number.isFinite(longitude);

  return (
    <View flex={1} backgroundColor="surface">
      <Header title="새 장소" />
      {valid ? (
        <PlaceForm
          initial={{
            name: params.name ?? '',
            kind: 'fishing',
            address: params.address ?? '',
            latitude,
            longitude,
            memo: '',
            tags: [],
          }}
          onSaved={(place) => router.replace(`/place/${place.id}`)}
        />
      ) : (
        <MessageView
          message="위치 정보가 없습니다. 검색하거나 지도에서 위치를 골라 주세요."
          actionLabel="지도에서 설정"
          onAction={() => router.replace('/map-pick')}
        />
      )}
    </View>
  );
};
