import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'tamagui';
import { findCourse } from '@/entities/destination';
import { useTrip } from '@/entities/trip';
import { TripForm } from '@/features/trip-editor';
import { toErrorMessage } from '@/shared/lib';
import { Header, LoadingView, MessageView } from '@/shared/ui';

export const TripNewPage = () => {
  const router = useRouter();
  const { course: courseId } = useLocalSearchParams<{ course?: string }>();
  const course = courseId ? findCourse(courseId) : undefined;
  return (
    <View flex={1} backgroundColor="surface">
      <Header title="새 여정" />
      <TripForm
        initialTitle={course?.title}
        initialStops={course?.stops}
        onSaved={(trip) => router.replace(`/trip/${trip.id}`)}
      />
    </View>
  );
};

export const TripEditPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTrip(id);
  return (
    <View flex={1} backgroundColor="surface">
      <Header title="여정 수정" />
      {trip.data ? (
        <TripForm trip={trip.data} onSaved={() => router.back()} />
      ) : trip.isError ? (
        <MessageView message={toErrorMessage(trip.error)} />
      ) : (
        <LoadingView />
      )}
    </View>
  );
};
