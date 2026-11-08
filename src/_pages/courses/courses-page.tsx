import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { View, YStack } from 'tamagui';
import { COURSES, findDestination } from '@/entities/destination';
import { KindIcon } from '@/entities/place';
import { AppText, Button, Divider, Header, ListRow } from '@/shared/ui';

export const CoursesPage = () => {
  const router = useRouter();
  return (
    <View flex={1} backgroundColor="surface">
      <Header title="전설의 현장 코스" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {COURSES.map((course, index) => (
          <YStack key={course.id}>
            {index > 0 ? <View height={8} backgroundColor="surfaceMuted" /> : null}
            <YStack padding={20} gap={6}>
              <AppText size="title" accessibilityRole="header">
                {course.title}
              </AppText>
              <AppText tone="muted">{course.summary}</AppText>
            </YStack>
            {course.stops.map((id, stop) => {
              const destination = findDestination(id);
              if (!destination) return null;
              return (
                <YStack key={id}>
                  {stop > 0 ? <Divider inset={58} /> : null}
                  <ListRow
                    testID={`course-${course.id}-${id}`}
                    title={`${stop + 1}. ${destination.name}`}
                    subtitle={destination.location}
                    icon={<KindIcon kind={destination.realm} />}
                    chevron
                    onPress={() => router.push(`/destination/${id}`)}
                  />
                </YStack>
              );
            })}
            <View padding={20}>
              <Button
                testID={`course-plan-${course.id}`}
                variant="outline"
                label="이 코스로 여정 만들기"
                onPress={() => router.push(`/trip/new?course=${course.id}`)}
              />
            </View>
          </YStack>
        ))}
      </ScrollView>
    </View>
  );
};
