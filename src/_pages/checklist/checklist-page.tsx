import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import {
  buildDefaultItems,
  CHECKLIST_CATEGORIES,
  ChecklistRow,
  groupChecklist,
  nextPosition,
  useChecklist,
  useRemoveChecklist,
  useUpsertChecklist,
} from '@/entities/checklist';
import type { ChecklistItem } from '@/shared/api';
import { toErrorMessage } from '@/shared/lib';
import {
  AppText,
  Button,
  Chip,
  Divider,
  Field,
  Header,
  HeaderTextButton,
  LoadingView,
  MessageView,
} from '@/shared/ui';

const newId = () => Crypto.randomUUID();

export const ChecklistPage = () => {
  const checklist = useChecklist();
  const upsert = useUpsertChecklist();
  const remove = useRemoveChecklist();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(CHECKLIST_CATEGORIES[0]);

  const items = checklist.data ?? [];
  const checkedItems = items.filter((item) => item.checked);
  const onError = (error: unknown) => toast.error(toErrorMessage(error, '저장하지 못했습니다.'));

  const add = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (items.some((item) => item.title === trimmed && item.category === category)) {
      toast.warning('이미 목록에 있습니다.');
      return;
    }
    upsert.mutate(
      [
        {
          id: newId(),
          title: trimmed,
          category,
          checked: false,
          position: nextPosition(items),
        },
      ],
      { onError },
    );
    setTitle('');
  };

  const toggle = (item: ChecklistItem) => {
    Haptics.selectionAsync();
    upsert.mutate([{ ...item, checked: !item.checked }], { onError });
  };

  const confirmReset = () => {
    Alert.alert(
      '체크 모두 해제',
      '다음 출조를 위해 체크를 모두 지웁니다. 항목은 그대로 남습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
          onPress: () =>
            upsert.mutate(
              checkedItems.map((item) => ({ ...item, checked: false })),
              { onError },
            ),
        },
      ],
    );
  };

  const confirmRemove = (item: ChecklistItem) => {
    Alert.alert('항목 삭제', `${item.title}을(를) 목록에서 지웁니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => remove.mutate([item.id], { onError }),
      },
    ]);
  };

  return (
    <View flex={1} backgroundColor="white">
      <Header
        title="출조 체크리스트"
        right={
          checkedItems.length > 0 ? (
            <HeaderTextButton label="모두 해제" onPress={confirmReset} />
          ) : undefined
        }
      />
      {checklist.isPending ? (
        <LoadingView />
      ) : checklist.isError && !checklist.data ? (
        <MessageView
          message={toErrorMessage(checklist.error)}
          actionLabel="다시 시도"
          onAction={() => checklist.refetch()}
        />
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <YStack padding={20} gap={12}>
            <AppText
              testID="checklist-progress"
              size="title"
              accessibilityRole="header"
              accessibilityLiveRegion="polite"
            >
              {items.length === 0
                ? '챙길 것을 적어 두세요'
                : `${items.length}개 중 ${checkedItems.length}개 챙김`}
            </AppText>
            <Field
              testID="checklist-input"
              label="항목 추가"
              placeholder="예: 구명조끼"
              value={title}
              onChangeText={setTitle}
              onSubmitEditing={add}
              submitBehavior="submit"
              returnKeyType="done"
              maxLength={100}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap={8} accessibilityRole="radiogroup" accessibilityLabel="항목 분류">
                {CHECKLIST_CATEGORIES.map((item) => (
                  <Chip
                    key={item}
                    testID={`checklist-category-${item}`}
                    label={item}
                    selected={category === item}
                    onPress={() => setCategory(item)}
                  />
                ))}
              </XStack>
            </ScrollView>
            <Button testID="checklist-add" variant="outline" label="추가" onPress={add} />
            {items.length === 0 ? (
              <Button
                testID="checklist-defaults"
                label="기본 목록으로 시작"
                onPress={() => upsert.mutate(buildDefaultItems(newId), { onError })}
              />
            ) : null}
          </YStack>
          {groupChecklist(items).map((section) => (
            <YStack key={section.category}>
              <View height={8} backgroundColor="surfaceMuted" />
              <AppText
                size="row"
                tone="ink"
                bold
                paddingHorizontal={20}
                paddingTop={16}
                paddingBottom={4}
                accessibilityRole="header"
              >
                {section.category} ({section.items.filter((item) => item.checked).length}/
                {section.items.length})
              </AppText>
              {section.items.map((item, index) => (
                <YStack key={item.id}>
                  {index > 0 ? <Divider inset={20} /> : null}
                  <ChecklistRow
                    item={item}
                    onToggle={() => toggle(item)}
                    onRemove={() => confirmRemove(item)}
                  />
                </YStack>
              ))}
            </YStack>
          ))}
        </ScrollView>
      )}
    </View>
  );
};
