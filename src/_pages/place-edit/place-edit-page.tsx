import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'tamagui';
import { usePlace } from '@/entities/place';
import { PlaceForm } from '@/features/place-editor';
import { toErrorMessage } from '@/shared/lib';
import { Header, LoadingView, MessageView } from '@/shared/ui';

export const PlaceEditPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = usePlace(id);
  return (
    <View flex={1} backgroundColor="surface">
      <Header title="장소 수정" />
      {place.data ? (
        <PlaceForm
          placeId={id}
          initial={{
            name: place.data.name,
            kind: place.data.kind,
            address: place.data.address,
            latitude: place.data.latitude,
            longitude: place.data.longitude,
            memo: place.data.memo,
            tags: place.data.tags,
            catalogId: place.data.catalogId,
            wishlisted: place.data.wishlisted,
          }}
          // 링크로 바로 열어 돌아갈 화면이 없으면 장소 화면으로 바꿉니다. 그대로 두면 저장 잠금이 걸린 폼에 남습니다.
          onSaved={() => (router.canGoBack() ? router.back() : router.replace(`/place/${id}`))}
        />
      ) : place.isError ? (
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
};
