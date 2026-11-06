import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { View, XStack, YStack } from 'tamagui';
import { sync, useSyncState, type OutboxOp } from '@/shared/api';
import { AppText, Button, Divider, Header, MessageView } from '@/shared/ui';

const Row = ({ op }: { op: OutboxOp }) => {
  const failed = op.status === 'failed';
  const confirmDiscard = () => {
    Alert.alert('변경 버리기', `${op.label}\n이 변경은 서버에 올라가지 않고 사라집니다.`, [
      { text: '취소', style: 'cancel' },
      { text: '버리기', style: 'destructive', onPress: () => sync.discard(op.id) },
    ]);
  };
  return (
    <YStack padding={20} gap={10}>
      <YStack gap={2} accessible accessibilityLabel={`${op.label}, ${failed ? '실패' : '대기 중'}`}>
        <AppText numberOfLines={2}>{op.label}</AppText>
        <AppText size="caption" tone={failed ? 'danger' : 'muted'}>
          {failed ? '서버가 저장을 거절했습니다.' : '연결되면 자동으로 올립니다.'}
        </AppText>
      </YStack>
      {failed ? (
        <XStack gap={8}>
          <View flex={1}>
            <Button variant="outline" label="다시 시도" onPress={() => void sync.retry(op.id)} />
          </View>
          <View flex={1}>
            <Button variant="danger" label="버리기" onPress={confirmDiscard} />
          </View>
        </XStack>
      ) : null}
    </YStack>
  );
};

export const SyncPage = () => {
  const { online, ops } = useSyncState();
  const [flushing, setFlushing] = useState(false);
  const flushNow = async () => {
    setFlushing(true);
    await sync.flush({ force: true }).finally(() => setFlushing(false));
  };
  return (
    <View flex={1} backgroundColor="white">
      <Header title="동기화" />
      <YStack paddingHorizontal={20} paddingBottom={12} gap={12}>
        <AppText testID="sync-status" accessibilityLiveRegion="polite">
          {!online
            ? '오프라인입니다. 저장한 내용은 기기에 보관됩니다.'
            : ops.length === 0
              ? '모든 변경을 서버에 올렸습니다.'
              : `올리지 못한 변경이 ${ops.length}건 있습니다.`}
        </AppText>
        {ops.some((op) => op.status === 'pending') ? (
          <Button testID="sync-now" label="지금 동기화" loading={flushing} onPress={flushNow} />
        ) : null}
      </YStack>
      <Divider />
      {ops.length === 0 ? (
        <MessageView message="대기 중인 변경이 없습니다." />
      ) : (
        <ScrollView>
          {ops.map((op, index) => (
            <YStack key={op.id}>
              {index > 0 ? <Divider /> : null}
              <Row op={op} />
            </YStack>
          ))}
        </ScrollView>
      )}
    </View>
  );
};
