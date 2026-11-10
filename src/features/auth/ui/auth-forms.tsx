import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm, type Control, type FieldValues, type Path } from 'react-hook-form';
import { toast } from 'sonner-native';
import { YStack } from 'tamagui';
import { z } from 'zod';
import { backend } from '@/shared/api';
import { toErrorMessage, useSubmitLock } from '@/shared/lib';
import { AppText, Button, Field } from '@/shared/ui';
import {
  changePasswordSchema,
  currentPasswordSchema,
  recoverSchema,
  signInSchema,
  signUpSchema,
} from '../model/schema';
import { useRecoveryCodeStore } from '../model/recovery-store';

type FieldKind = 'username' | 'password' | 'new-password' | 'nickname' | 'name' | 'code';

type FormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  kind: FieldKind;
  hint?: string;
  required?: boolean;
  /** 키보드의 완료 키를 눌렀을 때 실행합니다. 제출 버튼이 키보드에 가려져도 보낼 수 있습니다. */
  onSubmit?: () => void;
};

// 비밀번호 칸이 둘이면 iOS가 강력한 암호 시트를 입력 중에 다시 띄워 글자 입력을 끊습니다.
// 앱에 연결된 도메인이 없어 그 암호를 저장해 쓸 수도 없으므로 새 비밀번호는 시트가 뜨지 않는 유형을 씁니다.
const KIND_PROPS = {
  username: {
    textContentType: 'username',
    autoComplete: 'username',
    keyboardType: 'ascii-capable',
  },
  password: {
    textContentType: 'password',
    autoComplete: 'current-password',
    keyboardType: 'default',
    secret: true,
  },
  'new-password': {
    textContentType: 'oneTimeCode',
    autoComplete: 'new-password',
    keyboardType: 'default',
    secret: true,
  },
  nickname: { textContentType: 'nickname', autoComplete: 'nickname', keyboardType: 'default' },
  name: { textContentType: 'name', autoComplete: 'name', keyboardType: 'default' },
  code: { textContentType: 'none', autoComplete: 'off', keyboardType: 'ascii-capable' },
} as const;

export const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  kind,
  hint,
  required = true,
  onSubmit,
}: FormFieldProps<T>) => {
  const { secret, ...props } = { secret: false, ...KIND_PROPS[kind] };
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          testID={`field-${name}`}
          label={label}
          hint={hint}
          required={required}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          onSubmitEditing={onSubmit}
          returnKeyType={onSubmit ? 'go' : 'next'}
          autoCorrect={false}
          secureTextEntry={secret}
          autoCapitalize="none"
          {...props}
        />
      )}
    />
  );
};

export const SignInForm = () => {
  const lock = useSubmitLock();
  const { control, handleSubmit } = useForm<
    z.input<typeof signInSchema>,
    unknown,
    z.output<typeof signInSchema>
  >({
    resolver: zodResolver(signInSchema),
    defaultValues: { username: '', password: '' },
  });
  const signIn = useMutation({
    mutationFn: (data: z.output<typeof signInSchema>) =>
      backend.auth.signIn(data.username, data.password),
    onError: (error) => {
      lock.release();
      toast.error(toErrorMessage(error));
    },
  });
  const submit = handleSubmit((data) => {
    if (lock.take()) signIn.mutate(data);
  });
  return (
    <YStack gap={20}>
      <FormField control={control} name="username" label="아이디" kind="username" />
      <FormField
        control={control}
        name="password"
        label="비밀번호"
        kind="password"
        onSubmit={submit}
      />
      <Button testID="sign-in-submit" label="로그인" loading={signIn.isPending} onPress={submit} />
      <YStack alignItems="center">
        <Link
          href="/sign-up"
          testID="go-sign-up"
          accessibilityRole="link"
          style={{ paddingVertical: 12 }}
        >
          <AppText tone="brand">아이디로 회원가입</AppText>
        </Link>
        <Link
          href="/recover"
          testID="go-recover"
          accessibilityRole="link"
          style={{ paddingVertical: 12 }}
        >
          <AppText tone="brand">비밀번호를 잊었다면 복구 코드로 재설정</AppText>
        </Link>
      </YStack>
    </YStack>
  );
};

export const SignUpForm = () => {
  const lock = useSubmitLock();
  const { control, handleSubmit } = useForm<
    z.input<typeof signUpSchema>,
    unknown,
    z.output<typeof signUpSchema>
  >({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: '', password: '', passwordConfirm: '', nickname: '', name: '' },
  });
  // 가입하면 바로 로그인되어 보호된 화면으로 넘어갑니다.
  const showCode = useRecoveryCodeStore((state) => state.show);
  const signUp = useMutation({
    mutationFn: ({ username, password, nickname, name }: z.output<typeof signUpSchema>) =>
      backend.auth.signUp({ username, password, nickname, name }),
    onSuccess: ({ recoveryCode }) => {
      if (recoveryCode) showCode(recoveryCode);
      else toast.error('복구 코드를 만들지 못했습니다. MY에서 복구 코드를 다시 발급해 주세요.');
    },
    onError: (error) => {
      lock.release();
      toast.error(toErrorMessage(error));
    },
  });
  const submit = handleSubmit((data) => {
    if (lock.take()) signUp.mutate(data);
  });
  return (
    <YStack gap={20}>
      <FormField
        control={control}
        name="username"
        label="아이디"
        kind="username"
        hint="영문 소문자, 숫자, 밑줄(_)로 4~20자"
      />
      <FormField
        control={control}
        name="password"
        label="비밀번호 (8자 이상)"
        kind="new-password"
      />
      <FormField
        control={control}
        name="passwordConfirm"
        label="비밀번호 확인"
        kind="new-password"
      />
      <FormField
        control={control}
        name="nickname"
        label="닉네임"
        kind="nickname"
        hint="여권과 공유 이미지에 보이는 이름입니다. 2~20자"
      />
      <FormField
        control={control}
        name="name"
        label="이름"
        kind="name"
        required={false}
        hint="본인만 볼 수 있습니다."
        onSubmit={submit}
      />
      <AppText size="caption" tone="muted">
        이메일 없이 가입합니다. 가입하면 복구 코드를 한 번 보여 드리니, 비밀번호를 잊었을 때를 위해
        안전한 곳에 보관하세요.
      </AppText>
      <Button
        testID="sign-up-submit"
        label="가입하기"
        loading={signUp.isPending}
        onPress={submit}
      />
    </YStack>
  );
};

export const ChangePasswordForm = () => {
  const router = useRouter();
  const lock = useSubmitLock();
  const { control, handleSubmit } = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: '', password: '', passwordConfirm: '' },
  });
  const update = useMutation({
    mutationFn: (data: z.infer<typeof changePasswordSchema>) =>
      backend.auth.updatePassword(data.current, data.password),
    onSuccess: () => {
      toast.success('비밀번호를 변경했습니다.');
      router.back();
    },
    onError: (error) => {
      lock.release();
      toast.error(toErrorMessage(error));
    },
  });
  const submit = handleSubmit((data) => {
    if (lock.take()) update.mutate(data);
  });
  return (
    <YStack gap={20}>
      <FormField control={control} name="current" label="지금 비밀번호" kind="password" />
      <FormField
        control={control}
        name="password"
        label="새 비밀번호 (8자 이상)"
        kind="new-password"
      />
      <FormField
        control={control}
        name="passwordConfirm"
        label="새 비밀번호 확인"
        kind="new-password"
      />
      <Button
        testID="password-submit"
        label="변경하기"
        loading={update.isPending}
        onPress={submit}
      />
    </YStack>
  );
};

export const RecoverForm = () => {
  const lock = useSubmitLock();
  const showCode = useRecoveryCodeStore((state) => state.show);
  const { control, handleSubmit } = useForm<
    z.input<typeof recoverSchema>,
    unknown,
    z.output<typeof recoverSchema>
  >({
    resolver: zodResolver(recoverSchema),
    defaultValues: { username: '', code: '', password: '', passwordConfirm: '' },
  });
  // 성공하면 로그인되어 보호된 화면으로 넘어가고, 쓴 코드 대신 새 코드를 보여 줍니다.
  const recover = useMutation({
    mutationFn: ({ username, code, password }: z.output<typeof recoverSchema>) =>
      backend.auth.recover({ username, code, password }),
    onSuccess: ({ recoveryCode }) => {
      toast.success('비밀번호를 바꿨습니다.');
      if (recoveryCode) showCode(recoveryCode);
      else toast.error('새 복구 코드를 만들지 못했습니다. MY에서 다시 발급해 주세요.');
    },
    onError: (error) => {
      lock.release();
      toast.error(toErrorMessage(error));
    },
  });
  const submit = handleSubmit((data) => {
    if (lock.take()) recover.mutate(data);
  });
  return (
    <YStack gap={20}>
      <AppText tone="muted">
        가입할 때 받은 복구 코드로 새 비밀번호를 정합니다. 5번 틀리면 15분 동안 잠깁니다.
      </AppText>
      <FormField control={control} name="username" label="아이디" kind="username" />
      <FormField
        control={control}
        name="code"
        label="복구 코드"
        kind="code"
        hint="예: K7MQ-2XWD-9PTA (하이픈과 대소문자는 상관없습니다)"
      />
      <FormField
        control={control}
        name="password"
        label="새 비밀번호 (8자 이상)"
        kind="new-password"
      />
      <FormField
        control={control}
        name="passwordConfirm"
        label="새 비밀번호 확인"
        kind="new-password"
        onSubmit={submit}
      />
      <Button
        testID="recover-submit"
        label="비밀번호 재설정"
        loading={recover.isPending}
        onPress={submit}
      />
    </YStack>
  );
};

export const ResetRecoveryCodeForm = () => {
  const router = useRouter();
  const lock = useSubmitLock();
  const showCode = useRecoveryCodeStore((state) => state.show);
  const { control, handleSubmit } = useForm<z.infer<typeof currentPasswordSchema>>({
    resolver: zodResolver(currentPasswordSchema),
    defaultValues: { current: '' },
  });
  const reset = useMutation({
    mutationFn: (data: z.infer<typeof currentPasswordSchema>) =>
      backend.auth.resetRecoveryCode(data.current),
    onSuccess: ({ recoveryCode }) => {
      if (recoveryCode) showCode(recoveryCode);
      router.back();
    },
    onError: (error) => {
      lock.release();
      toast.error(toErrorMessage(error));
    },
  });
  const submit = handleSubmit((data) => {
    if (lock.take()) reset.mutate(data);
  });
  return (
    <YStack gap={20}>
      <AppText tone="muted">새 코드를 발급하면 이전 복구 코드는 더 이상 쓸 수 없습니다.</AppText>
      <FormField
        control={control}
        name="current"
        label="지금 비밀번호"
        kind="password"
        onSubmit={submit}
      />
      <Button
        testID="recovery-reset-submit"
        label="새 코드 발급"
        loading={reset.isPending}
        onPress={submit}
      />
    </YStack>
  );
};
