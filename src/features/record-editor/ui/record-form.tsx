import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
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
import { getTide, toErrorMessage, useUnsavedGuard } from '@/shared/lib';
import { AppText, StickyBottomCta, Button, Field, TagInput, Touchable } from '@/shared/ui';
import {
  recordFormSchema,
  toFormValues,
  toRecordInput,
  type RecordFormValues,
} from '../model/schema';
import { collectMembers, findLastFishing } from '../model/history';
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
  placeId: string;
  kind: PlaceKind;
  record?: TripRecord;
  /** 날씨와 물때를 불러올 장소 좌표 */
  coordinate?: { latitude: number; longitude: number };
  onSaved: (record: TripRecord) => void;
};

export const RecordForm = ({ placeId, kind, record, coordinate, onSaved }: RecordFormProps) => {
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
  const lastFishing = useMemo(
    () => findLastFishing(history.data ?? [], placeId),
    [history.data, placeId],
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

  const loadLastGear = () => {
    if (!lastFishing) return;
    const filled = fillEmpty({
      gear: lastFishing.gear,
      rig: lastFishing.rig,
      bait: lastFishing.bait,
      partySize: lastFishing.partySize?.toString() ?? '',
    });
    if (getValues('members').length === 0 && lastFishing.members.length > 0) {
      setValue('members', lastFishing.members, { shouldDirty: true });
    }
    toast.success(filled > 0 ? '지난 장비와 채비를 불러왔습니다.' : '비어 있는 칸이 없습니다.');
  };

  const loadConditions = async () => {
    if (!coordinate || loadingConditions) return;
    const visitedAt = getValues('visitedAt');
    const { latitude, longitude } = coordinate;
    const tide = getTide(new Date(visitedAt), latitude, longitude);
    fillEmpty({ tide: `${tide.name} (음력 ${tide.lunarDay}일, ${tide.system})` });
    setLoadingConditions(true);
    try {
      const conditions = await fetchConditions(latitude, longitude, visitedAt);
      if (!conditions) throw new Error('no data');
      fillEmpty({
        weather: conditions.weather,
        wind: conditions.wind,
        waterTemp: conditions.waterTemp?.toString() ?? '',
      });
      toast.success('날씨와 물때를 채웠습니다. 실제와 다르면 고쳐 주세요.');
    } catch {
      toast.warning('물때만 채웠습니다. 날씨는 연결 후 다시 불러와 주세요.');
    } finally {
      setLoadingConditions(false);
    }
  };

  const submit = handleSubmit((values) => {
    if (save.isPending) return;
    save.mutate(
      { record: toRecordInput(placeId, kind, values), keptPhotos: kept, newPhotos: added },
      {
        onSuccess: (saved) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.success(savedMessage('기록'));
          allowLeave();
          onSaved(saved);
        },
        onError: (error) =>
          toast.error(
            toErrorMessage(error, '기록을 저장하지 못했습니다. 입력한 내용은 그대로 있습니다.'),
          ),
      },
    );
  });

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
            placeholder={kind === 'fishing' ? '예: 가을 감성돔 출조' : '예: 철수 후 점심'}
          />
          <PhotoPicker kept={kept} added={added} onChangeKept={setKept} onChangeAdded={setAdded} />
        </Section>
        <Section title={kind === 'fishing' ? '출조 인원' : '함께한 사람'}>
          <TextField
            control={control}
            name="partySize"
            label="인원 (명)"
            numeric
            placeholder="예: 3"
          />
          <Controller
            control={control}
            name="members"
            render={({ field }) => (
              <TagInput
                testID="record-member"
                label={kind === 'fishing' ? '출조 멤버' : '동행'}
                placeholder="이름 입력"
                value={field.value}
                onChange={field.onChange}
                suggestions={memberSuggestions}
              />
            )}
          />
        </Section>
        {kind === 'fishing' ? (
          <>
            <Section title="장비와 채비">
              {!record && lastFishing ? (
                <Button
                  testID="record-load-last"
                  variant="outline"
                  label="지난 기록의 장비·채비 불러오기"
                  onPress={loadLastGear}
                />
              ) : null}
              <TextField
                control={control}
                name="gear"
                label="출조 장비"
                multiline
                placeholder="낚싯대, 릴, 원줄 등"
              />
              <TextField
                control={control}
                name="rig"
                label="채비"
                multiline
                placeholder="찌, 목줄, 바늘 등"
              />
              <TextField control={control} name="bait" label="미끼" placeholder="예: 크릴" />
            </Section>
            <Section title="조건">
              {coordinate ? (
                <YStack gap={8}>
                  <Button
                    testID="record-load-conditions"
                    variant="outline"
                    label="날씨·물때 불러오기"
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
                      날씨 정보 Open-Meteo. 물때는 음력으로 계산한 값입니다. 이 버튼을 누르면 장소
                      좌표가 Open-Meteo로 전송됩니다.
                    </AppText>
                  </Touchable>
                </YStack>
              ) : null}
              <TextField control={control} name="weather" label="날씨" placeholder="예: 맑음" />
              <TextField control={control} name="tide" label="물때" placeholder="예: 7물, 들물" />
              <TextField control={control} name="wind" label="바람" placeholder="예: 북동풍 3m/s" />
              <TextField
                control={control}
                name="waterTemp"
                label="수온 (℃)"
                numeric
                placeholder="예: 19.5"
              />
            </Section>
            <Section title="조과">
              <TextField
                control={control}
                name="catches"
                label="조과"
                multiline
                placeholder="어종, 크기, 마릿수"
              />
            </Section>
          </>
        ) : (
          <Section title="식사">
            <TextField
              control={control}
              name="menu"
              label="메뉴"
              multiline
              placeholder="먹은 메뉴"
            />
            <TextField
              control={control}
              name="price"
              label="가격 (원)"
              numeric
              placeholder="예: 45000"
            />
            <Controller
              control={control}
              name="rating"
              render={({ field }) => <RatingField value={field.value} onChange={field.onChange} />}
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
