import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, type Control, type FieldPath } from 'react-hook-form';
import { Linking } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';
import { View, YStack } from 'tamagui';
import { useRecords, useSaveRecord } from '@/entities/record';
import {
  fetchConditions,
  savedMessage,
  type LocalPhoto,
  type Photo,
  type PlaceKind,
  type TripRecord,
} from '@/shared/api';
import { toErrorMessage, useUnsavedGuard } from '@/shared/lib';
import { AppText, StickyBottomCta, Button, Field, TagInput, Touchable } from '@/shared/ui';
import {
  recordFormSchema,
  toFormValues,
  toRecordInput,
  type RecordFormValues,
} from '../model/schema';
import { collectMembers } from '../model/history';
import { DateField } from './date-field';
import { PhotoPicker } from './photo-picker';
import { RatingField } from './rating-field';

type TextName = Exclude<
  FieldPath<RecordFormValues>,
  'members' | 'rating' | 'visitedAt' | `members.${number}`
>;

type TextFieldProps = {
  control: Control<RecordFormValues>;
  name: TextName;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
};

const TextField = ({ control, name, label, placeholder, multiline, numeric }: TextFieldProps) => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => (
      <Field
        testID={`record-${name}`}
        label={label}
        placeholder={placeholder}
        multiline={multiline}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        value={field.value as string}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        error={fieldState.error?.message}
      />
    )}
  />
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <YStack gap={16}>
    <AppText size="title" accessibilityRole="header">
      {title}
    </AppText>
    {children}
  </YStack>
);

type RecordFormProps = {
  /** 이미 저장된 장소. 없으면 저장하는 순간 resolvePlaceId로 만듭니다. */
  placeId?: string;
  resolvePlaceId?: () => Promise<string>;
  kind: PlaceKind;
  record?: TripRecord;
  /** 날씨를 불러올 장소 좌표 */
  coordinate?: { latitude: number; longitude: number };
  onSaved: (record: TripRecord) => void;
};

export const RecordForm = ({
  placeId,
  resolvePlaceId,
  kind,
  record,
  coordinate,
  onSaved,
}: RecordFormProps) => {
  const save = useSaveRecord(record?.id);
  const history = useRecords();
  const [loadingConditions, setLoadingConditions] = useState(false);
  const [kept, setKept] = useState<Photo[]>(record?.photos ?? []);
  const [added, setAdded] = useState<LocalPhoto[]>([]);
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { isDirty },
  } = useForm<RecordFormValues>({
    resolver: zodResolver(recordFormSchema),
    defaultValues: toFormValues(record),
  });
  const photosChanged = added.length > 0 || kept.length !== (record?.photos.length ?? 0);
  const allowLeave = useUnsavedGuard(isDirty || photosChanged);

  const memberSuggestions = useMemo(
    () => collectMembers(history.data ?? [], kind),
    [history.data, kind],
  );
  /** 사용자가 이미 적은 칸은 덮어쓰지 않습니다. */
  const fillEmpty = (values: Partial<Record<TextName, string>>) => {
    let filled = 0;
    for (const [name, value] of Object.entries(values) as [TextName, string][]) {
      if (value && !String(getValues(name) ?? '').trim()) {
        setValue(name, value, { shouldDirty: true });
        filled += 1;
      }
    }
    return filled;
  };

  const loadConditions = async () => {
    if (!coordinate || loadingConditions) return;
    const visitedAt = getValues('visitedAt');
    const { latitude, longitude } = coordinate;
    setLoadingConditions(true);
    try {
      const conditions = await fetchConditions(latitude, longitude, visitedAt);
      if (!conditions) throw new Error('no data');
      fillEmpty({
        weather: conditions.weather,
        temperature: conditions.temperature?.toString() ?? '',
      });
      toast.success('날씨를 채웠습니다. 실제와 다르면 고쳐 주세요.');
    } catch {
      toast.warning('날씨를 불러오지 못했습니다. 연결 후 다시 시도해 주세요.');
    } finally {
      setLoadingConditions(false);
    }
  };

  // isPending은 다음 렌더에야 바뀌고 장소 생성도 먼저 끝나야 하므로 ref로 중복 저장을 막습니다.
  const submitting = useRef(false);
  const unlock = () => {
    submitting.current = false;
  };
  const failed = (error: unknown) => {
    unlock();
    toast.error(
      toErrorMessage(error, '기록을 저장하지 못했습니다. 입력한 내용은 그대로 있습니다.'),
    );
  };

  const submit = () =>
    handleSubmit(async (values) => {
      if (submitting.current) return;
      submitting.current = true;
      try {
        const resolved = placeId ?? (await resolvePlaceId?.());
        if (!resolved) throw new Error('여행지를 찾을 수 없습니다.');
        save.mutate(
          { record: toRecordInput(resolved, kind, values), keptPhotos: kept, newPhotos: added },
          {
            onSuccess: (saved) => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toast.success(savedMessage('기록'));
              allowLeave();
              onSaved(saved);
            },
            onError: failed,
          },
        );
      } catch (error) {
        failed(error);
      }
    })();

  return (
    <View flex={1}>
      <KeyboardAwareScrollView
        bottomOffset={96}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: 20, gap: 32 }}
      >
        <Section title="기본 정보">
          <Controller
            control={control}
            name="visitedAt"
            render={({ field }) => <DateField value={field.value} onChange={field.onChange} />}
          />
          <TextField
            control={control}
            name="title"
            label="제목"
            placeholder={kind === 'real' ? '예: 새벽의 태양의 문' : '예: 복사꽃 숲을 따라서'}
          />
          <PhotoPicker kept={kept} added={added} onChangeKept={setKept} onChangeAdded={setAdded} />
        </Section>
        <Section title="함께한 사람">
          <TextField
            control={control}
            name="partySize"
            label="인원 (명)"
            numeric
            placeholder="예: 2"
          />
          <Controller
            control={control}
            name="members"
            render={({ field }) => (
              <TagInput
                testID="record-member"
                label="동행"
                placeholder="이름 입력"
                value={field.value}
                onChange={field.onChange}
                suggestions={memberSuggestions}
              />
            )}
          />
        </Section>
        <Section title="감동">
          <Controller
            control={control}
            name="rating"
            render={({ field }) => <RatingField value={field.value} onChange={field.onChange} />}
          />
        </Section>
        {kind === 'real' ? (
          <>
            <Section title="인상 깊은 곳">
              <TextField
                control={control}
                name="highlights"
                label="내용"
                multiline
                placeholder="가장 오래 머문 곳, 잊지 못할 장면"
              />
            </Section>
            <Section title="여행 정보">
              {coordinate ? (
                <YStack gap={8}>
                  <Button
                    testID="record-load-conditions"
                    variant="outline"
                    label="그날 날씨 불러오기"
                    loading={loadingConditions}
                    onPress={loadConditions}
                  />
                  <Touchable
                    onPress={() => Linking.openURL('https://open-meteo.com/')}
                    accessibilityRole="link"
                    accessibilityLabel="날씨 정보 제공, Open-Meteo 웹사이트 열기"
                    justifyContent="center"
                  >
                    <AppText size="caption" tone="muted">
                      날씨 정보 Open-Meteo. 이 버튼을 누르면 장소 좌표가 Open-Meteo로 전송됩니다.
                    </AppText>
                  </Touchable>
                </YStack>
              ) : null}
              <TextField control={control} name="weather" label="날씨" placeholder="예: 맑음" />
              <TextField
                control={control}
                name="temperature"
                label="기온 (℃)"
                numeric
                placeholder="예: 24"
              />
              <TextField
                control={control}
                name="transport"
                label="교통"
                placeholder="예: 쿠스코에서 기차와 셔틀버스"
              />
              <TextField control={control} name="lodging" label="숙소" placeholder="묵은 곳" />
              <TextField
                control={control}
                name="cost"
                label="비용 (원)"
                numeric
                placeholder="예: 450000"
              />
            </Section>
          </>
        ) : (
          <Section title="상상 여행">
            <TextField
              control={control}
              name="gateway"
              label="들어간 길"
              multiline
              placeholder="어떤 책, 영화, 꿈으로 갔나요?"
            />
            <TextField
              control={control}
              name="encounters"
              label="만난 존재"
              multiline
              placeholder="그곳에서 만난 이들"
            />
            <TextField
              control={control}
              name="souvenir"
              label="가져온 것"
              multiline
              placeholder="기억에 남은 말, 풍경, 깨달음"
            />
          </Section>
        )}
        <Section title="메모">
          <TextField
            control={control}
            name="memo"
            label="메모"
            multiline
            placeholder="기억해 둘 내용"
          />
        </Section>
      </KeyboardAwareScrollView>
      <StickyBottomCta
        testID="record-save"
        label="저장하기"
        loading={save.isPending}
        onPress={submit}
      />
    </View>
  );
};
