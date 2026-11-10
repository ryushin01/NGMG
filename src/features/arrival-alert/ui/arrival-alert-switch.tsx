import { useRef, useState } from 'react';
import { Alert, Linking, Switch } from 'react-native';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { AppText, Touchable } from '@/shared/ui';
import {
  disableArrivalAlert,
  enableArrivalAlert,
  isArrivalAlertEnabled,
  type EnableResult,
} from '../model/settings';
import { MAX_REGIONS } from '../model/regions';

/** 한 칸은 위치 갱신 지역으로 씁니다. */
const NEARBY_COUNT = MAX_REGIONS - 1;

const DENIED: Record<Exclude<EnableResult, 'enabled'>, string> = {
  'location-denied': '위치 권한이 없어 알림을 켜지 못했습니다.',
  'background-denied': "위치 접근을 '항상 허용'으로 바꿔야 앱을 닫아도 알려 드릴 수 있습니다.",
  'notification-denied': '알림 권한이 없어 알림을 켜지 못했습니다.',
  unavailable: '이 기기에서는 위치 기반 지역 알림을 쓸 수 없습니다.',
};

const confirm = () =>
  new Promise<boolean>((resolve) =>
    Alert.alert(
      '근처 여행지 도착 알림',
      "앱을 닫아 두어도 여행지 근처에 도착하면 알려 드리려면 위치 접근을 '항상 허용'으로 설정해야 합니다. 위치는 기기 안에서만 쓰고 서버로 보내지 않습니다.",
      [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        { text: '계속', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );

/** MY 화면의 근처 여행지 도착 알림 스위치 */
export const ArrivalAlertSwitch = ({ checkedIds }: { checkedIds: ReadonlySet<string> }) => {
  const [enabled, setEnabled] = useState(isArrivalAlertEnabled);
  const [busy, setBusy] = useState(false);
  // 권한 창이 뜨는 동안 다시 누르면 요청이 겹치므로 막습니다.
  const lock = useRef(false);

  const toggle = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      if (enabled) {
        await disableArrivalAlert();
        setEnabled(false);
        return;
      }
      if (!(await confirm())) return;
      const result = await enableArrivalAlert(checkedIds);
      if (result === 'enabled') {
        setEnabled(true);
        toast.success('근처 여행지에 도착하면 알려 드릴게요.');
        return;
      }
      Alert.alert(
        '알림을 켜지 못했습니다',
        DENIED[result],
        // 기기가 지원하지 않으면 설정에서 바꿀 것이 없으므로 닫기만 둡니다.
        result === 'unavailable'
          ? [{ text: '닫기', style: 'cancel' }]
          : [
              { text: '닫기', style: 'cancel' },
              { text: '설정 열기', onPress: () => Linking.openSettings() },
            ],
      );
    } catch {
      toast.error('알림 설정을 바꾸지 못했습니다.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <Touchable
      testID="arrival-alert"
      onPress={toggle}
      disabled={busy}
      accessibilityRole="switch"
      accessibilityLabel="근처 여행지 도착 알림"
      accessibilityHint={`아직 인증하지 않은 가까운 여행지 ${NEARBY_COUNT}곳의 3km 안에 들어가면 알려 드립니다`}
      accessibilityState={{ checked: enabled, busy }}
    >
      <XStack alignItems="center" gap={12} minHeight={44}>
        <YStack flex={1} gap={2}>
          <AppText>근처 여행지 도착 알림</AppText>
          <AppText size="caption" tone="muted">
            아직 인증하지 않은 가까운 여행지 {NEARBY_COUNT}곳의 3km 안에 들어가면 알려 드려요. 멀리
            이동하면 새 위치 기준으로 다시 고릅니다.
          </AppText>
        </YStack>
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no">
          <Switch value={enabled} />
        </View>
      </XStack>
    </Touchable>
  );
};
