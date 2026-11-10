import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, ScrollView, Switch } from 'react-native';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { useCheckins } from '@/entities/checkin';
import { ProfileAvatar, useProfile } from '@/entities/profile';
import { summarizeChecklist, useChecklist } from '@/entities/checklist';
import { useSessionStore } from '@/entities/session';
import { ArrivalAlertSwitch } from '@/features/arrival-alert';
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
  const username = useSessionStore((state) => state.session?.username ?? '');
  const profile = useProfile();
  const nickname = profile.data?.nickname ?? username;
  // 둘러보기 계정은 비밀번호가 없습니다.
  const isGuest = backend.mode === 'demo' && username === 'guest';
  const { ops } = useSyncState();
  const checklist = useChecklist();
  const checkins = useCheckins();
  const checkedIds = new Set((checkins.data ?? []).map((item) => item.catalogId));
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

  // isPending은 다음 렌더에야 바뀌어, 빠르게 두 번 누르면 공유 창이 두 번 뜹니다.
  const exporting = useRef(false);
  const runExport = (format: 'json' | 'csv') => {
    if (exporting.current) return;
    exporting.current = true;
    exportData.mutate(format, {
      onError: (error) => toast.error(toErrorMessage(error, '내보내지 못했습니다.')),
      onSettled: () => {
        exporting.current = false;
      },
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
        <XStack
          testID="my-profile"
          alignItems="center"
          gap={16}
          accessible
          accessibilityLabel={`${nickname}, 아이디 ${username}${profile.data?.name ? `, 이름 ${profile.data.name}` : ''}`}
        >
          <ProfileAvatar nickname={nickname} uri={profile.data?.avatarUrl ?? null} size={72} />
          <YStack flex={1} gap={2}>
            <AppText size="title">{nickname}</AppText>
            <AppText tone="muted">@{username}</AppText>
            {profile.data?.name ? (
              <AppText size="caption" tone="muted">
                {profile.data.name} · 본인만 보임
              </AppText>
            ) : null}
          </YStack>
        </XStack>
        <YStack>
          <LinkRow
            testID="my-profile-edit"
            label="프로필 편집"
            onPress={() => router.push('/profile-edit')}
          />
          <Divider />
          {isGuest ? null : (
            <>
              <LinkRow
                testID="my-password"
                label="비밀번호 변경"
                onPress={() => router.push('/password')}
              />
              <Divider />
              <LinkRow
                testID="my-recovery-code"
                label="복구 코드 다시 발급"
                onPress={() => router.push('/recovery-code')}
              />
              <Divider />
            </>
          )}
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
        <ArrivalAlertSwitch checkedIds={checkedIds} />
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
                loading={exportData.isPending && exportData.variables === 'csv'}
                disabled={exportData.isPending && exportData.variables !== 'csv'}
                onPress={() => runExport('csv')}
              />
            </View>
            <View flex={1}>
              <Button
                testID="export-json"
                variant="outline"
                label="전체 JSON"
                loading={exportData.isPending && exportData.variables === 'json'}
                disabled={exportData.isPending && exportData.variables !== 'json'}
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
