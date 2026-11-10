import * as Clipboard from 'expo-clipboard';
import { KeyRound } from 'lucide-react-native';
import { Modal } from 'react-native';
import { toast } from 'sonner-native';
import { View, YStack } from 'tamagui';
import { formatRecoveryCode } from '@/shared/lib';
import { AppIcon, AppText, Button } from '@/shared/ui';
import { useRecoveryCodeStore } from '../model/recovery-store';

/** 발급한 복구 코드를 한 번만 보여 줍니다. 닫으면 다시 볼 수 없으므로 보관했는지 묻습니다. */
export const RecoveryCodeModal = () => {
  const code = useRecoveryCodeStore((state) => state.code);
  const clear = useRecoveryCodeStore((state) => state.clear);
  const formatted = code ? formatRecoveryCode(code) : '';
  const copy = async () => {
    await Clipboard.setStringAsync(formatted);
    toast.success('복구 코드를 복사했습니다.');
  };
  return (
    <Modal
      visible={code !== null}
      transparent
      animationType="fade"
      onRequestClose={() => undefined}
    >
      <View
        flex={1}
        backgroundColor="rgba(0,0,0,0.6)"
        alignItems="center"
        justifyContent="center"
        padding={16}
        accessibilityViewIsModal
      >
        <YStack
          testID="recovery-code-modal"
          width={360}
          maxWidth="100%"
          backgroundColor="surface"
          borderRadius={20}
          padding={24}
          gap={16}
        >
          <YStack alignItems="center" gap={8}>
            <AppIcon icon={KeyRound} size={36} color="brandText" strokeWidth={1.75} />
            <AppText size="headline" textAlign="center" accessibilityRole="header">
              복구 코드를 보관하세요
            </AppText>
            <AppText textAlign="center">
              비밀번호를 잊었을 때 이 코드로만 다시 설정할 수 있습니다. 지금 한 번만 보여 드립니다.
            </AppText>
          </YStack>
          <View
            backgroundColor="brandSoft"
            borderRadius={12}
            paddingVertical={16}
            alignItems="center"
            accessible
            accessibilityLabel={`복구 코드 ${[...formatted].join(' ')}`}
          >
            <AppText testID="recovery-code" size="headline" latin letterSpacing={2}>
              {formatted}
            </AppText>
          </View>
          <AppText size="caption" tone="muted">
            메모 앱이나 비밀번호 관리 앱처럼 나만 볼 수 있는 곳에 적어 두세요. 코드를 쓰면 새 코드가
            발급되고, MY에서 다시 발급할 수도 있습니다.
          </AppText>
          <Button testID="recovery-code-copy" variant="outline" label="코드 복사" onPress={copy} />
          <Button testID="recovery-code-done" label="보관했어요" onPress={clear} />
        </YStack>
      </View>
    </Modal>
  );
};
