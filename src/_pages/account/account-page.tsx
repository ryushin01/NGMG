import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Switch } from 'react-native';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { summarizeChecklist, useChecklist } from '@/entities/checklist';
import { useSessionStore } from '@/entities/session';
import { useExportData } from '@/features/data-export';
import { backend, isDemoOffline, setDemoOffline, sync, useSyncState } from '@/shared/api';
import { toErrorMessage } from '@/shared/lib';
import { AppIcon, AppText, Button, Divider, Header, Touchable } from '@/shared/ui';

const Row = ({ label, value }: { label: string; value: string }) => (
  <YStack paddingVertical={14} gap={2} accessible accessibilityLabel={`${label}, ${value}`}>
    <AppText size="caption" tone="muted">
      {label}
    </AppText>
    <AppText size="row">{value}</AppText>
  </YStack>
);

const LinkRow = ({
  label,
  value,
  onPress,
  testID,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  testID: string;
}) => (
  <Touchable
    testID={testID}
    onPress={onPress}
    accessibilityLabel={value ? `${label}, ${value}` : label}
    paddingVertical={14}
  >
    <XStack alignItems="center" gap={8}>
      <AppText flex={1} size="row">
        {label}
      </AppText>
      {value ? (
        <AppText size="caption" tone="muted">
          {value}
        </AppText>
      ) : null}
      <AppIcon icon={ChevronRight} size={18} color="muted" strokeWidth={1.75} />
    </XStack>
  </Touchable>
);

export const AccountPage = () => {
  const router = useRouter();
  const email = useSessionStore((state) => state.session?.email ?? '');
  const { ops } = useSyncState();
  const checklist = useChecklist();
  const exportData = useExportData();
  const [demoOffline, setDemoOfflineState] = useState(isDemoOffline);
  const signOut = useMutation({
    mutationFn: () => backend.auth.signOut(),
    onError: (error) => toast.error(toErrorMessage(error)),
  });
  const deleteAccount = useMutation({
    mutationFn: () => backend.auth.deleteAccount(),
    onError: (error) => toast.error(toErrorMessage(error, '계정을 삭제하지 못했습니다.')),
  });

  const confirmDelete = () => {
    Alert.alert('계정 삭제', '모든 여행지, 기록, 사진이 영구 삭제되며 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      { text: '계정 삭제', style: 'destructive', onPress: () => deleteAccount.mutate() },
    ]);
  };

  const confirmSignOut = () => {
    if (ops.length === 0) {
      signOut.mutate();
      return;
    }
    Alert.alert(
      '로그아웃',
      `아직 올리지 못한 변경 ${ops.length}건은 이 기기에 남고, 같은 계정으로 다시 로그인하면 이어서 올립니다.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', onPress: () => signOut.mutate() },
      ],
    );
  };

  const runExport = (format: 'json' | 'csv') => {
    if (exportData.isPending) return;
    exportData.mutate(format, {
      onError: (error) => toast.error(toErrorMessage(error, '내보내지 못했습니다.')),
    });
  };

  const toggleDemoOffline = (next: boolean) => {
    setDemoOffline(next);
    setDemoOfflineState(next);
    if (!next) void sync.flush({ force: true });
  };

  return (
    <View flex={1} backgroundColor="surface">
      <Header title="MY" hideBack />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 40 }}>
        <YStack>
          <Row label="이메일" value={email} />
          <Divider />
          <LinkRow testID="my-places" label="내 여행지" onPress={() => router.push('/places')} />
          <Divider />
          <LinkRow testID="my-trips" label="내 여정" onPress={() => router.push('/trips')} />
          <Divider />
          <LinkRow
            testID="my-passport"
            label="여행 여권"
            onPress={() => router.push('/passport')}
          />
          <Divider />
          <LinkRow
            testID="my-checklist"
            label="여행 체크리스트"
            value={summarizeChecklist(checklist.data ?? [])}
            onPress={() => router.push('/checklist')}
          />
          <Divider />
          <LinkRow testID="my-stats" label="통계" onPress={() => router.push('/stats')} />
          <Divider />
          <LinkRow
            testID="my-sync"
            label="동기화"
            value={ops.length > 0 ? `${ops.length}건 대기` : '완료'}
            onPress={() => router.push('/sync')}
          />
          <Divider />
          <Row
            label="데이터 저장"
            value={backend.mode === 'demo' ? '데모 모드 (이 기기에 저장)' : '서버 동기화'}
          />
          <Divider />
          <Row label="앱 버전" value={Constants.expoConfig?.version ?? '-'} />
        </YStack>
        {backend.mode === 'demo' ? (
          <Touchable
            testID="demo-offline"
            onPress={() => toggleDemoOffline(!demoOffline)}
            accessibilityRole="switch"
            accessibilityLabel="데모 모드 연결 끊기"
            accessibilityState={{ checked: demoOffline }}
          >
            <XStack alignItems="center" gap={12} minHeight={44}>
              <AppText flex={1}>데모 모드 연결 끊기</AppText>
              <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no">
                <Switch value={demoOffline} />
              </View>
            </XStack>
          </Touchable>
        ) : null}
        <YStack gap={10}>
          <AppText size="row" tone="ink" bold accessibilityRole="header">
            데이터 내보내기
          </AppText>
          <XStack gap={8}>
            <View flex={1}>
              <Button
                testID="export-csv"
                variant="outline"
                label="기록 CSV"
                onPress={() => runExport('csv')}
              />
            </View>
            <View flex={1}>
              <Button
                testID="export-json"
                variant="outline"
                label="전체 JSON"
                onPress={() => runExport('json')}
              />
            </View>
          </XStack>
        </YStack>
        <YStack gap={10}>
          <Button
            testID="sign-out"
            variant="outline"
            label="로그아웃"
            loading={signOut.isPending}
            onPress={confirmSignOut}
          />
          <Button
            testID="delete-account"
            variant="danger"
            label="계정 삭제"
            loading={deleteAccount.isPending}
            onPress={confirmDelete}
          />
        </YStack>
      </ScrollView>
    </View>
  );
};
