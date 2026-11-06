import { usePreventRemove } from 'expo-router';
import { Alert } from 'react-native';

/**
 * 입력 중인 내용을 잃지 않도록 화면을 벗어나기 전에 확인합니다.
 * 저장 성공으로 나갈 때는 먼저 돌려받은 함수를 호출합니다.
 */
export const useUnsavedGuard = (dirty: boolean) => {
  const allowLeave = usePreventRemove(dirty, ({ repeat }) => {
    Alert.alert('작성을 그만둘까요?', '입력한 내용이 저장되지 않습니다.', [
      { text: '계속 작성', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: repeat,
      },
    ]);
  });
  return allowLeave;
};
