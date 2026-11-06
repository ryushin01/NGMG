import { useRouter } from 'expo-router';
import { CloudOff, RefreshCw, TriangleAlert } from 'lucide-react-native';
import { XStack } from 'tamagui';
import { useSyncState } from '@/shared/api';
import { AppText, Touchable } from '@/shared/ui';

/** 끊겼거나 올리지 못한 변경이 있을 때만 지도 위에 나타납니다. */
export const SyncBanner = () => {
  const router = useRouter();
  const { online, ops } = useSyncState();
  const failed = ops.filter((op) => op.status === 'failed').length;
  const pending = ops.length - failed;
  if (online && ops.length === 0) return null;

  const Icon = failed > 0 ? TriangleAlert : online ? RefreshCw : CloudOff;
  const label =
    failed > 0 ? `동기화 실패 ${failed}건` : pending > 0 ? `동기화 대기 ${pending}건` : '오프라인';
  return (
    <Touchable
      testID="sync-banner"
      onPress={() => router.push('/sync')}
      accessibilityLabel={`${label}, 동기화 화면 열기`}
      accessibilityLiveRegion="polite"
      paddingHorizontal={14}
      borderRadius={22}
      backgroundColor="ink"
      justifyContent="center"
    >
      <XStack alignItems="center" gap={8}>
        <Icon size={16} color="#ffffff" strokeWidth={1.75} />
        <AppText size="caption" tone="inverse" bold>
          {label}
        </AppText>
      </XStack>
    </Touchable>
  );
};
