import { changePasswordSchema, profileSchema, signInSchema, signUpSchema } from './schema';

const signUp = (overrides: Partial<Record<string, string>> = {}) =>
  signUpSchema.safeParse({
    username: 'ryushin0',
    password: 'password1',
    passwordConfirm: 'password1',
    nickname: '유신',
    name: '',
    ...overrides,
  });

it('아이디는 영문 소문자·숫자·밑줄 4~20자이고 대문자는 소문자로 맞춥니다', () => {
  expect(signUp().success).toBe(true);
  expect(signUp({ username: 'RyuShin0' }).data?.username).toBe('ryushin0');
  for (const username of ['abc', 'a'.repeat(21), 'ryu shin', 'ryu@shin', '류신아이디']) {
    expect(signUp({ username }).success).toBe(false);
  }
  expect(signInSchema.safeParse({ username: 'ryushin0', password: '' }).success).toBe(false);
});

it('비밀번호 길이와 일치, 닉네임 2~20자, 이름은 선택으로 검사합니다', () => {
  expect(signUp({ password: 'short', passwordConfirm: 'short' }).success).toBe(false);
  expect(signUp({ passwordConfirm: 'password2' }).success).toBe(false);
  expect(signUp({ nickname: '유' }).success).toBe(false);
  expect(signUp({ nickname: ' 유신 ' }).data?.nickname).toBe('유신');
  expect(signUp({ name: '가'.repeat(41) }).success).toBe(false);
  expect(profileSchema.safeParse({ nickname: '유신', name: '' }).success).toBe(true);
});

it('비밀번호를 바꿀 때 지금 비밀번호를 받습니다', () => {
  const base = { password: 'password1', passwordConfirm: 'password1' };
  expect(changePasswordSchema.safeParse({ ...base, current: '' }).success).toBe(false);
  expect(changePasswordSchema.safeParse({ ...base, current: 'old-password' }).success).toBe(true);
});
