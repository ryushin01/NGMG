import { useRouter } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, XStack } from 'tamagui';
import { Touchable } from './pressable';
import { AppText } from './typography';
import { AppIcon } from './icon';

type HeaderProps = {
  title: string;
  right?: ReactNode;
  closeIcon?: boolean;
  onBack?: () => void;
  /** 탭의 첫 화면처럼 돌아갈 곳이 없으면 뒤로 버튼을 숨깁니다. */
  hideBack?: boolean;
};

export const Header = ({ title, right, closeIcon, onBack, hideBack }: HeaderProps) => {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const Icon = closeIcon ? X : ArrowLeft;
  return (
    <View paddingTop={top} backgroundColor="surface">
      <XStack height={52} alignItems="center" paddingHorizontal={8}>
        {hideBack ? (
          <View width={44} />
        ) : (
          <Touchable
            onPress={onBack ?? (() => router.back())}
            accessibilityLabel={closeIcon ? '닫기' : '뒤로 가기'}
            alignItems="center"
            justifyContent="center"
          >
            <AppIcon icon={Icon} color="ink" size={24} strokeWidth={1.75} />
          </Touchable>
        )}
        <View flex={1} alignItems="center">
          <AppText size="row" tone="ink" numberOfLines={1} accessibilityRole="header">
            {title}
          </AppText>
        </View>
        <View minWidth={44} alignItems="flex-end">
          {right}
        </View>
      </XStack>
    </View>
  );
};

export const HeaderTextButton = ({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) => (
  <Touchable
    onPress={onPress}
    accessibilityLabel={label}
    alignItems="center"
    justifyContent="center"
    paddingHorizontal={8}
  >
    <AppText tone={danger ? 'danger' : 'muted'}>{label}</AppText>
  </Touchable>
);
