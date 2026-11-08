import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, YStack } from 'tamagui';
import { ForgotPasswordForm, NewPasswordForm, SignInForm, SignUpForm } from '@/features/auth';
import { backend } from '@/shared/api';
import { AppText, Header, useColors } from '@/shared/ui';

const FormScroll = ({ children }: { children: ReactNode }) => {
  const colors = useColors();
  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 24 }}
    >
      {children}
    </KeyboardAwareScrollView>
  );
};

export const SignInPage = () => {
  const { top } = useSafeAreaInsets();
  return (
    <View flex={1} paddingTop={top} backgroundColor="surface">
      <FormScroll>
        <YStack alignItems="center" paddingTop={40} paddingBottom={40} gap={8}>
          <Image
            source={require('~/assets/icon.png')}
            style={{ width: 88, height: 88, borderRadius: 20 }}
            accessibilityLabel="신세계 앱 아이콘, 별빛 아래의 계단식 피라미드"
          />
          <AppText size="headline" accessibilityRole="header">
            신세계
          </AppText>
          <AppText tone="muted">현실의 유적부터 전설의 땅까지</AppText>
        </YStack>
        {backend.mode === 'demo' ? (
          <View backgroundColor="brandSoft" padding={12} borderRadius={6} marginBottom={20}>
            <AppText size="caption" tone="ink">
              데모 모드: 아무 이메일과 비밀번호로 로그인할 수 있습니다.
            </AppText>
          </View>
        ) : null}
        <SignInForm />
      </FormScroll>
    </View>
  );
};

export const SignUpPage = () => (
  <View flex={1} backgroundColor="surface">
    <Header title="회원가입" />
    <FormScroll>
      <SignUpForm />
    </FormScroll>
  </View>
);

export const ForgotPasswordPage = () => (
  <View flex={1} backgroundColor="surface">
    <Header title="비밀번호 찾기" />
    <FormScroll>
      <ForgotPasswordForm />
    </FormScroll>
  </View>
);

export const ResetPasswordPage = () => (
  <View flex={1} backgroundColor="surface">
    <Header title="새 비밀번호 설정" />
    <FormScroll>
      <NewPasswordForm />
    </FormScroll>
  </View>
);
