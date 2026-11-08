import { zodResolver } from '@hookform/resolvers/zod';
import * as Crypto from 'expo-crypto';
import { ArrowDown, ArrowUp, X } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { findDestination, searchDestinations } from '@/entities/destination';
import { KindIcon, usePlaces } from '@/entities/place';
import { useSaveTrip } from '@/entities/trip';
import { savedMessage, type Trip } from '@/shared/api';
import { toErrorMessage, useUnsavedGuard } from '@/shared/lib';
import { AppIcon, AppText, Field, ListRow, StickyBottomCta, Touchable } from '@/shared/ui';
import { moveStop, tripSchema, type TripFormValues } from '../model/schema';
import { TripDateField } from './trip-date-field';

type TripFormProps = {
  trip?: Trip;
  initialTitle?: string;
  initialStops?: string[];
  onSaved: (trip: Trip) => void;
};

const IconButton = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: typeof X;
  onPress: () => void;
}) => (
  <Touchable
    onPress={onPress}
    accessibilityLabel={label}
    alignItems="center"
    justifyContent="center"
  >
    <AppIcon icon={icon} size={20} color="ink" strokeWidth={1.75} />
  </Touchable>
);

export const TripForm = ({ trip, initialTitle, initialStops, onSaved }: TripFormProps) => {
  const save = useSaveTrip();
  const places = usePlaces();
  const locked = useRef(false);
  const [query, setQuery] = useState('');
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      title: trip?.title ?? initialTitle ?? '',
      startDate: trip?.startDate ?? null,
      endDate: trip?.endDate ?? null,
      stops: trip?.stops ?? initialStops ?? [],
      memo: trip?.memo ?? '',
    },
  });
  const allowLeave = useUnsavedGuard(isDirty);

  const wished = useMemo(
    () =>
      (places.data ?? []).flatMap((place) => {
        const found = place.wishlisted && place.catalogId ? findDestination(place.catalogId) : null;
        return found ? [found] : [];
      }),
    [places.data],
  );

  const submit = () =>
    handleSubmit((values) => {
      if (locked.current) return;
      locked.current = true;
      save.mutate(
        { ...values, id: trip?.id ?? Crypto.randomUUID() },
        {
          onSuccess: (saved) => {
            toast.success(savedMessage('여정'));
            allowLeave();
            onSaved(saved);
          },
          onError: (error) => {
            locked.current = false;
            toast.error(toErrorMessage(error, '여정을 저장하지 못했습니다.'));
          },
        },
      );
    })();

  return (
    <View flex={1}>
      <KeyboardAwareScrollView
        bottomOffset={96}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 40 }}
      >
        <Controller
          control={control}
          name="title"
          render={({ field, fieldState }) => (
            <Field
              testID="trip-title"
              label="여정 이름"
              required
              placeholder="예: 페루 잉카 일주"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="startDate"
          render={({ field }) => (
            <TripDateField
              testID="trip-start"
              label="출발일"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="endDate"
          render={({ field, fieldState }) => (
            <TripDateField
              testID="trip-end"
              label="돌아오는 날"
              value={field.value}
              error={fieldState.error?.message}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="stops"
          render={({ field, fieldState }) => {
            const stops = field.value;
            const add = (id: string) => {
              if (!stops.includes(id)) field.onChange([...stops, id]);
              setQuery('');
            };
            const candidates = query.trim()
              ? searchDestinations(query).slice(0, 6)
              : wished.slice(0, 6);
            return (
              <YStack gap={10}>
                <AppText size="row" tone="ink" bold accessibilityRole="header">
                  여행지 {stops.length}곳
                </AppText>
                {fieldState.error ? (
                  <AppText size="caption" tone="danger" accessibilityLiveRegion="polite">
                    {fieldState.error.message}
                  </AppText>
                ) : null}
                {stops.map((id, index) => {
                  const stop = findDestination(id);
                  if (!stop) return null;
                  return (
                    <XStack key={id} alignItems="center" gap={4}>
                      <AppText width={24} tone="muted">
                        {index + 1}
                      </AppText>
                      <AppText flex={1} numberOfLines={1}>
                        {stop.name}
                      </AppText>
                      <IconButton
                        label={`${stop.name} 앞으로`}
                        icon={ArrowUp}
                        onPress={() => field.onChange(moveStop(stops, index, -1))}
                      />
                      <IconButton
                        label={`${stop.name} 뒤로`}
                        icon={ArrowDown}
                        onPress={() => field.onChange(moveStop(stops, index, 1))}
                      />
                      <IconButton
                        label={`${stop.name} 빼기`}
                        icon={X}
                        onPress={() => field.onChange(stops.filter((item) => item !== id))}
                      />
                    </XStack>
                  );
                })}
                <Field
                  testID="trip-stop-search"
                  label="여행지 추가"
                  placeholder="이름이나 지역으로 찾기"
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                />
                {!query.trim() && candidates.length > 0 ? (
                  <AppText size="caption" tone="muted">
                    가고 싶어요에서 고르기
                  </AppText>
                ) : null}
                {candidates
                  .filter((item) => !stops.includes(item.id))
                  .map((item) => (
                    <ListRow
                      key={item.id}
                      testID={`trip-add-${item.id}`}
                      title={item.name}
                      subtitle={item.location}
                      icon={<KindIcon kind={item.realm} />}
                      onPress={() => add(item.id)}
                    />
                  ))}
              </YStack>
            );
          }}
        />
        <Controller
          control={control}
          name="memo"
          render={({ field }) => (
            <Field
              testID="trip-memo"
              label="메모"
              multiline
              placeholder="예산, 예약 번호, 하고 싶은 일"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      </KeyboardAwareScrollView>
      <StickyBottomCta
        testID="trip-save"
        label="저장하기"
        loading={save.isPending}
        onPress={submit}
      />
    </View>
  );
};
