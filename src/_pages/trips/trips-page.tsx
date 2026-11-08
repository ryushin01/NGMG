import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { View } from 'tamagui';
import { TripRow, useTrips } from '@/entities/trip';
import { toErrorMessage } from '@/shared/lib';
import { BottomCta, Divider, Header, LoadingView, MessageView } from '@/shared/ui';

export const TripsPage = () => {
  const router = useRouter();
  const trips = useTrips();
  return (
    <View flex={1} backgroundColor="surface">
      <Header title="내 여정" />
      {trips.isPending ? (
        <LoadingView />
      ) : trips.isError && !trips.data ? (
        <MessageView
          message={toErrorMessage(trips.error)}
          actionLabel="다시 시도"
          onAction={() => trips.refetch()}
        />
      ) : (
        <FlashList
          data={trips.data ?? []}
          keyExtractor={(trip) => trip.id}
          ItemSeparatorComponent={() => <Divider inset={58} />}
          ListEmptyComponent={
            <MessageView message="아직 여정이 없습니다. 코스에서 시작하거나 새로 만들어 보세요." />
          }
          renderItem={({ item }) => (
            <TripRow trip={item} onPress={() => router.push(`/trip/${item.id}`)} />
          )}
        />
      )}
      <BottomCta testID="trip-new" label="새 여정" onPress={() => router.push('/trip/new')} />
    </View>
  );
};
