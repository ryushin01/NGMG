import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import {
  buildDefaultItems,
  buildFantasyItems,
  CHECKLIST_CATEGORIES,
  ChecklistRow,
  copyList,
  DEFAULT_LIST_NAME,
  groupChecklist,
  listNames,
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

  const [selected, setSelected] = useState<string | null>(null);
  const [newListName, setNewListName] = useState<string | null>(null);

  const allItems = checklist.data ?? [];
  const lists = listNames(allItems);
  const listName =
    selected && lists.includes(selected) ? selected : (lists[0] ?? DEFAULT_LIST_NAME);
  const items = allItems.filter((item) => item.listName === listName);
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
          position: nextPosition(allItems),
          listName,
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

  const createList = () => {
    const name = newListName?.trim();
    if (!name) return;
    if (lists.includes(name)) {
      toast.warning('같은 이름의 목록이 있습니다.');
      return;
    }
    // 지금 보는 목록을 복사해 시작합니다. 항목이 없으면 기본 준비물로 채웁니다.
    upsert.mutate(
      items.length > 0 ? copyList(items, name, newId) : buildDefaultItems(newId, name),
      {
        onError,
      },
    );
    setSelected(name);
    setNewListName(null);
  };

  const confirmDeleteList = () => {
    Alert.alert('목록 삭제', `${listName} 목록의 항목 ${items.length}개를 모두 지웁니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          remove.mutate(
            items.map((item) => item.id),
            { onError },
          );
          setSelected(null);
        },
      },
    ]);
  };

  const confirmReset = () => {
    Alert.alert(
      '체크 모두 해제',
      '다음 여행을 위해 체크를 모두 지웁니다. 항목은 그대로 남습니다.',
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
    <View flex={1} backgroundColor="surface">
      <Header
        title="여행 체크리스트"
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
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <YStack padding={20} gap={12}>
            {lists.length > 0 ? (
              <YStack gap={8}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <XStack
                    gap={8}
                    accessibilityRole="radiogroup"
                    accessibilityLabel="체크리스트 목록"
                  >
                    {lists.map((name) => (
                      <Chip
                        key={name}
                        testID={`checklist-list-${name}`}
                        label={name}
                        selected={name === listName}
                        onPress={() => setSelected(name)}
                      />
                    ))}
                  </XStack>
                </ScrollView>
                {newListName === null ? (
                  <XStack gap={8}>
                    <View flex={1}>
                      <Button
                        testID="checklist-new-list"
                        variant="outline"
                        label="이 목록 복사해 새 목록"
                        onPress={() => setNewListName('')}
                      />
                    </View>
                    {lists.length > 1 ? (
                      <Button
                        testID="checklist-delete-list"
                        variant="danger"
                        label="목록 삭제"
                        onPress={confirmDeleteList}
                      />
                    ) : null}
                  </XStack>
                ) : (
                  <YStack gap={8}>
                    <Field
                      testID="checklist-new-list-name"
                      label="새 목록 이름"
                      placeholder="예: 페루 5월"
                      value={newListName}
                      onChangeText={setNewListName}
                      onSubmitEditing={createList}
                      submitBehavior="submit"
                      returnKeyType="done"
                      maxLength={50}
                      autoFocusNative
                    />
                    <XStack gap={8}>
                      <View flex={1}>
                        <Button
                          variant="outline"
                          label="취소"
                          onPress={() => setNewListName(null)}
                        />
                      </View>
                      <View flex={1}>
                        <Button
                          testID="checklist-new-list-save"
                          label="만들기"
                          onPress={createList}
                        />
                      </View>
                    </XStack>
                  </YStack>
                )}
              </YStack>
            ) : null}
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
              placeholder="예: 고산병약"
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
              <>
                <Button
                  testID="checklist-defaults"
                  label="유적 여행 기본 목록으로 시작"
                  onPress={() => upsert.mutate(buildDefaultItems(newId, listName), { onError })}
                />
                <Button
                  testID="checklist-fantasy-defaults"
                  variant="outline"
                  label="환상 여행 목록으로 시작"
                  onPress={() => upsert.mutate(buildFantasyItems(newId, listName), { onError })}
                />
              </>
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
