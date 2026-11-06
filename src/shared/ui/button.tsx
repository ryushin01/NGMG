import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, XStack } from 'tamagui';
import { Touchable } from './pressable';
import { AppText } from './typography';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
  testID?: string;
};

export const Button = ({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  testID,
}: ButtonProps) => {
  const inactive = disabled || loading;
  const primary = variant === 'primary';
  return (
    <Touchable
      testID={testID}
      onPress={inactive ? undefined : onPress}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      height={52}
      borderRadius={6}
      alignItems="center"
      justifyContent="center"
      backgroundColor={primary ? (inactive ? 'muted' : 'ink') : 'white'}
      borderWidth={primary ? 0 : 1}
      borderColor={variant === 'danger' ? 'danger' : 'ink'}
    >
      {loading ? (
        <ActivityIndicator color={primary ? '#ffffff' : '#1a254f'} />
      ) : (
        <AppText
          bold
          tone={primary ? 'inverse' : variant === 'danger' ? 'danger' : 'ink'}
          size="row"
        >
          {label}
        </AppText>
      )}
    </Touchable>
  );
};

/** 화면 하단에 꽉 차게 붙는 주요 버튼 */
export const BottomCta = ({
  label,
  onPress,
  disabled,
  loading,
  testID,
}: Omit<ButtonProps, 'variant'>) => {
  const { bottom } = useSafeAreaInsets();
  const inactive = disabled || loading;
  return (
    <Touchable
      testID={testID}
      onPress={inactive ? undefined : onPress}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      backgroundColor={inactive ? 'muted' : 'ink press:inkPressed'}
      paddingBottom={bottom}
    >
      <XStack height={60} alignItems="center" justifyContent="center">
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <AppText bold tone="inverse" size="row">
            {label}
          </AppText>
        )}
      </XStack>
    </Touchable>
  );
};

export const ScreenSpacer = ({ height = 24 }: { height?: number }) => <View height={height} />;
