import { z } from 'zod';

/** 아이디는 영문 소문자로 맞춰 저장합니다. 대문자로 입력해도 같은 아이디입니다. */
export const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, '아이디를 입력해 주세요.')
  .regex(/^[a-z0-9_]{4,20}$/, '아이디는 영문 소문자, 숫자, 밑줄(_)로 4~20자입니다.');
const password = z.string().min(8, '비밀번호는 8자 이상으로 입력해 주세요.');
export const nickname = z
  .string()
  .trim()
  .min(2, '닉네임은 2자 이상으로 입력해 주세요.')
  .max(20, '닉네임은 20자까지 입력할 수 있습니다.');
export const realName = z.string().trim().max(40, '이름은 40자까지 입력할 수 있습니다.');

const samePassword = <T extends { password: string; passwordConfirm: string }>(value: T) =>
  value.password === value.passwordConfirm;
const mismatch = { path: ['passwordConfirm'], message: '비밀번호가 서로 다릅니다.' };

export const signInSchema = z.object({
  username,
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});
export const signUpSchema = z
  .object({ username, password, passwordConfirm: z.string(), nickname, name: realName })
  .refine(samePassword, mismatch);
export const changePasswordSchema = z
  .object({
    current: z.string().min(1, '지금 비밀번호를 입력해 주세요.'),
    password,
    passwordConfirm: z.string(),
  })
  .refine(samePassword, mismatch);
export const profileSchema = z.object({ nickname, name: realName });
