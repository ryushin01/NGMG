import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRef, type ReactNode } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { View, YStack } from 'tamagui';
import { ForgotPasswordForm, NewPasswordForm, SignInForm, SignUpForm } from '@/features/auth';
import { backend } from '@/shared/api';
import { toErrorMessage } from '@/shared/lib';
import { AppText, Button, Header, useColors } from '@/shared/ui';

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

const GUEST_EMAIL = 'guest@newworld.demo';

export const SignInPage = () => {
  const { top } = useSafeAreaInsets();
  // isPending은 다음 렌더에야 바뀌므로 빠른 연속 탭은 ref로 막습니다.
  const browsing = useRef(false);
  const browse = useMutation({
    mutationFn: () => backend.auth.signIn(GUEST_EMAIL, 'demo'),
    onError: (error) => {
      browsing.current = false;
      toast.error(toErrorMessage(error, '데모를 시작하지 못했습니다.'));
    },
  });
  const startBrowsing = () => {
    if (browsing.current) return;
    browsing.current = true;
    browse.mutate();
  };
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
        <SignInForm />
        {backend.mode === 'demo' ? (
          <YStack backgroundColor="brandSoft" padding={12} borderRadius={6} marginTop={24} gap={10}>
            <AppText size="caption" tone="ink">
              포트폴리오용 데모입니다. 가상 데이터로 동작하며 변경 내용은 이 기기에만 저장됩니다.
            </AppText>
            <Button
              testID="demo-browse"
              label="둘러보기"
              loading={browse.isPending}
              onPress={startBrowsing}
            />
          </YStack>
        ) : null}
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
