import { newPasswordSchema, signInSchema, signUpSchema } from './schema';

it('이메일 형식과 비밀번호 길이, 일치 여부를 검사합니다', () => {
  expect(signInSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
  expect(
    signUpSchema.safeParse({ email: 'a@b.co', password: 'short', passwordConfirm: 'short' })
      .success,
  ).toBe(false);
  expect(
    signUpSchema.safeParse({ email: 'a@b.co', password: 'password1', passwordConfirm: 'password2' })
      .success,
  ).toBe(false);
  expect(
    signUpSchema.safeParse({ email: 'a@b.co', password: 'password1', passwordConfirm: 'password1' })
      .success,
  ).toBe(true);
  expect(newPasswordSchema.safeParse({ password: 'password1', passwordConfirm: 'x' }).success).toBe(
    false,
  );
});
