import { z } from 'zod';

const email = z
  .string()
  .trim()
  .min(1, '이메일을 입력해 주세요.')
  .email('이메일 형식을 확인해 주세요.');
const password = z.string().min(8, '비밀번호는 8자 이상으로 입력해 주세요.');

export const signInSchema = z.object({
  email,
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});
export const signUpSchema = z
  .object({ email, password, passwordConfirm: z.string() })
  .refine((value) => value.password === value.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 서로 다릅니다.',
  });
export const resetRequestSchema = z.object({ email });
export const newPasswordSchema = z
  .object({ password, passwordConfirm: z.string() })
  .refine((value) => value.password === value.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 서로 다릅니다.',
  });
