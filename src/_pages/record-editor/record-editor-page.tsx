import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'tamagui';
import { usePlace } from '@/entities/place';
import { useRecord } from '@/entities/record';
import { RecordForm } from '@/features/record-editor';
import { toErrorMessage } from '@/shared/lib';
import { Header, LoadingView, MessageView } from '@/shared/ui';

export const RecordNewPage = () => {
  const router = useRouter();
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
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
