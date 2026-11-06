import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm, type Control, type FieldValues, type Path } from 'react-hook-form';
import { toast } from 'sonner-native';
import { YStack } from 'tamagui';
import { z } from 'zod';
import { backend } from '@/shared/api';
import { toErrorMessage } from '@/shared/lib';
import { AppText, Button, Field } from '@/shared/ui';
import { newPasswordSchema, resetRequestSchema, signInSchema, signUpSchema } from '../model/schema';

type FormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  secret?: boolean;
  newPassword?: boolean;
  /** 키보드의 완료 키를 눌렀을 때 실행합니다. 제출 버튼이 키보드에 가려져도 보낼 수 있습니다. */
  onSubmit?: () => void;
};

const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  secret,
  newPassword,
  onSubmit,
}: FormFieldProps<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => (
      <Field
        testID={`field-${name}`}
        label={label}
        required
        value={field.value}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        error={fieldState.error?.message}
        onSubmitEditing={onSubmit}
        returnKeyType={onSubmit ? 'go' : 'next'}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secret}
        keyboardType={secret ? 'default' : 'email-address'}
        // 비밀번호 칸이 둘이면 iOS가 강력한 암호 시트를 입력 중에 다시 띄워 글자 입력을 끊습니다.
        // 앱에 연결된 도메인이 없어 그 암호를 저장해 쓸 수도 없으므로 시트가 뜨지 않는 유형을 씁니다.
        textContentType={secret ? (newPassword ? 'oneTimeCode' : 'password') : 'username'}
        autoComplete={secret ? (newPassword ? 'new-password' : 'current-password') : 'email'}
      />
    )}
  />
);

const SignInLink = ({
  href,
  label,
  testID,
}: {
  href: '/sign-up' | '/forgot-password';
  label: string;
  testID: string;
}) => (
  <Link href={href} testID={testID} accessibilityRole="link" style={{ paddingVertical: 12 }}>
    <AppText tone="brand">{label}</AppText>
  </Link>
);

export const SignInForm = () => {
  const { control, handleSubmit } = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  const signIn = useMutation({
    mutationFn: (data: z.infer<typeof signInSchema>) =>
      backend.auth.signIn(data.email, data.password),
    onError: (error) => toast.error(toErrorMessage(error)),
  });
  const submit = handleSubmit((data) => {
    if (!signIn.isPending) signIn.mutate(data);
  });
  return (
    <YStack gap={20}>
      <FormField control={control} name="email" label="이메일" />
      <FormField control={control} name="password" label="비밀번호" secret onSubmit={submit} />
      <Button testID="sign-in-submit" label="로그인" loading={signIn.isPending} onPress={submit} />
      <YStack alignItems="center">
        <SignInLink testID="go-sign-up" href="/sign-up" label="이메일로 회원가입" />
        <SignInLink testID="go-forgot" href="/forgot-password" label="비밀번호를 잊으셨나요?" />
      </YStack>
    </YStack>
  );
};

export const SignUpForm = () => {
  const router = useRouter();
  const { control, handleSubmit } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', passwordConfirm: '' },
  });
  const signUp = useMutation({
    mutationFn: (data: z.infer<typeof signUpSchema>) =>
      backend.auth.signUp(data.email, data.password),
    onSuccess: ({ needsConfirmation }) => {
      if (needsConfirmation) {
        toast.success('인증 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.');
        router.back();
      }
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  });
  return (
    <YStack gap={20}>
      <FormField control={control} name="email" label="이메일" />
      <FormField control={control} name="password" label="비밀번호 (8자 이상)" secret newPassword />
      <FormField
        control={control}
        name="passwordConfirm"
        label="비밀번호 확인"
        secret
        newPassword
      />
      <Button
        testID="sign-up-submit"
        label="가입하기"
        loading={signUp.isPending}
        onPress={handleSubmit((data) => signUp.mutate(data))}
      />
    </YStack>
  );
};

export const ForgotPasswordForm = () => {
  const router = useRouter();
  const { control, handleSubmit } = useForm<z.infer<typeof resetRequestSchema>>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: '' },
  });
  const send = useMutation({
    mutationFn: (data: z.infer<typeof resetRequestSchema>) =>
      backend.auth.sendPasswordReset(data.email),
    onSuccess: () => {
      toast.success('재설정 메일을 보냈습니다.');
      router.back();
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  });
  return (
    <YStack gap={20}>
      <AppText tone="muted">가입한 이메일로 비밀번호 재설정 링크를 보내 드립니다.</AppText>
      <FormField control={control} name="email" label="이메일" />
      <Button
        testID="reset-submit"
        label="메일 보내기"
        loading={send.isPending}
        onPress={handleSubmit((data) => send.mutate(data))}
      />
    </YStack>
  );
};

export const NewPasswordForm = () => {
  const router = useRouter();
  const { control, handleSubmit } = useForm<z.infer<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', passwordConfirm: '' },
  });
  const update = useMutation({
    mutationFn: (data: z.infer<typeof newPasswordSchema>) =>
      backend.auth.updatePassword(data.password),
    onSuccess: () => {
      toast.success('비밀번호를 변경했습니다.');
      router.replace('/');
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  });
  return (
    <YStack gap={20}>
      <FormField
        control={control}
        name="password"
        label="새 비밀번호 (8자 이상)"
        secret
        newPassword
      />
      <FormField
        control={control}
        name="passwordConfirm"
        label="새 비밀번호 확인"
        secret
        newPassword
      />
      <Button
        label="변경하기"
        loading={update.isPending}
        onPress={handleSubmit((data) => update.mutate(data))}
      />
    </YStack>
  );
};
