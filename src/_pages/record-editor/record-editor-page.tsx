import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'tamagui';
import { findDestination } from '@/entities/destination';
import { usePlace } from '@/entities/place';
import { useRecord } from '@/entities/record';
import { useEnsureCatalogPlace } from '@/features/destination-save';
import { RecordForm } from '@/features/record-editor';
import { toErrorMessage } from '@/shared/lib';
import { Header, LoadingView, MessageView } from '@/shared/ui';

const CatalogRecordNew = ({ catalogId }: { catalogId: string }) => {
  const router = useRouter();
  const destination = findDestination(catalogId);
  const ensurePlace = useEnsureCatalogPlace();
  if (!destination) {
    return (
      <View flex={1} backgroundColor="surface">
        <Header title="새 기록" />
        <MessageView message="여행지를 찾을 수 없습니다." />
      </View>
    );
  }
  return (
    <View flex={1} backgroundColor="surface">
      <Header title={`${destination.name} 기록`} />
      <RecordForm
        resolvePlaceId={() => ensurePlace(destination)}
        kind={destination.realm}
        coordinate={destination}
        onSaved={(record) => router.replace(`/record/${record.id}`)}
      />
    </View>
  );
};

const PlaceRecordNew = ({ placeId }: { placeId: string }) => {
  const router = useRouter();
  const place = usePlace(placeId);
  return (
    <View flex={1} backgroundColor="surface">
      <Header title={place.data ? `${place.data.name} 기록` : '새 기록'} />
      {place.data ? (
        <RecordForm
          placeId={placeId}
          kind={place.data.kind}
          coordinate={place.data}
          onSaved={(record) => router.replace(`/record/${record.id}`)}
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

export const RecordNewPage = () => {
  const { placeId, catalogId } = useLocalSearchParams<{ placeId?: string; catalogId?: string }>();
  return catalogId ? (
    <CatalogRecordNew catalogId={catalogId} />
  ) : (
    <PlaceRecordNew placeId={placeId ?? ''} />
  );
};

export const RecordEditPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useRecord(id);
  const place = usePlace(record.data?.placeId ?? '', { enabled: !!record.data });
  return (
    <View flex={1} backgroundColor="surface">
      <Header title="기록 수정" />
      {record.data ? (
        <RecordForm
          placeId={record.data.placeId}
          kind={record.data.placeKind}
          record={record.data}
          coordinate={place.data}
          onSaved={() => router.back()}
        />
      ) : record.isError ? (
        <MessageView
          message={toErrorMessage(record.error)}
          actionLabel="다시 시도"
          onAction={() => record.refetch()}
        />
      ) : (
        <LoadingView />
      )}
    </View>
  );
};
