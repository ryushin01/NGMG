import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { KIND_META, PLACE_KINDS, useSavePlace } from '@/entities/place';
import { savedMessage, type Place, type PlaceInput } from '@/shared/api';
import { formatCoordinate, toErrorMessage, useUnsavedGuard } from '@/shared/lib';
import { AppIcon, AppText, StickyBottomCta, Chip, Field, TagInput } from '@/shared/ui';
import { placeSchema } from '../model/schema';

type PlaceFormProps = {
  placeId?: string;
  initial: PlaceInput;
  onSaved: (place: Place) => void;
};

export const PlaceForm = ({ placeId, initial, onSaved }: PlaceFormProps) => {
  const save = useSavePlace(placeId);
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<PlaceInput>({
    resolver: zodResolver(placeSchema),
    defaultValues: initial,
  });
  const allowLeave = useUnsavedGuard(isDirty);
  // 위치는 이 폼에서 바꾸지 않으므로 초기값을 그대로 보여 줍니다.
  const { latitude, longitude, address } = initial;

  // isPending은 다음 렌더에야 바뀌어 빠른 두 번 누름을 막지 못하므로 ref로 잠급니다.
  // 저장하면 화면을 떠나므로 실패했을 때만 풉니다.
  const submitting = useRef(false);
  const submit = () =>
    handleSubmit((data) => {
      if (submitting.current) return;
      submitting.current = true;
      save.mutate(data, {
        onSuccess: (place) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.success(savedMessage('장소'));
          allowLeave();
          onSaved(place);
        },
        onError: (error) => {
          submitting.current = false;
          toast.error(toErrorMessage(error, '장소를 저장하지 못했습니다.'));
        },
      });
    })();

  return (
    <View flex={1}>
      <KeyboardAwareScrollView
        bottomOffset={96}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: 20, gap: 24 }}
      >
        <XStack gap={10} backgroundColor="brandSoft" padding={14} borderRadius={6}>
          <AppIcon icon={MapPin} size={20} color="brandText" strokeWidth={1.75} />
          <YStack flex={1}>
            <AppText>{address || '주소 정보 없음'}</AppText>
            <AppText size="caption" tone="muted">
              위도·경도 {formatCoordinate(latitude, longitude)}
            </AppText>
          </YStack>
        </XStack>
        <Controller
          control={control}
          name="kind"
          render={({ field }) => (
            <YStack gap={8}>
              <AppText size="caption" tone="muted" bold>
                분류 (필수)
              </AppText>
              <XStack gap={8} accessibilityRole="radiogroup">
                {PLACE_KINDS.map((kind) => (
                  <Chip
                    key={kind}
                    testID={`kind-${kind}`}
                    label={KIND_META[kind].label}
                    selected={field.value === kind}
                    onPress={() => field.onChange(kind)}
                  />
                ))}
              </XStack>
            </YStack>
          )}
        />
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field
              testID="place-name"
              label="장소 이름"
              required
              placeholder="예: 이름 모를 고분군"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <TagInput
              label="태그"
              placeholder="예: 신전, 잉카"
              value={field.value}
              onChange={field.onChange}
              testID="place-tag"
            />
          )}
        />
        <Controller
          control={control}
          name="memo"
          render={({ field }) => (
            <Field
              testID="place-memo"
              label="메모"
              multiline
              placeholder="찾아가는 길, 입장 방법, 주의할 점 등"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      </KeyboardAwareScrollView>
      <StickyBottomCta
        testID="place-save"
        label="저장하기"
        loading={save.isPending}
        onPress={submit}
      />
    </View>
  );
};
