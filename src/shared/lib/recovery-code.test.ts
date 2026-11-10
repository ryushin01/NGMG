import {
  createRecoveryCode,
  formatRecoveryCode,
  hashRecoveryCode,
  isRecoveryCode,
  normalizeRecoveryCode,
} from './recovery-code';

it('헷갈리는 글자 없이 12자를 만들고 4자씩 끊어 보여 줍니다', () => {
  const codes = new Set(Array.from({ length: 50 }, () => createRecoveryCode()));
  expect(codes.size).toBe(50);
  for (const code of codes) {
    expect(code).toMatch(/^[A-HJKMNP-TV-Z2-9]{12}$/);
    expect(isRecoveryCode(code)).toBe(true);
  }
  expect(formatRecoveryCode('K7MQ2XWD9PTA')).toBe('K7MQ-2XWD-9PTA');
});

it('대소문자, 띄어쓰기, 하이픈은 따지지 않고 같은 해시를 만듭니다', async () => {
  expect(normalizeRecoveryCode(' k7mq-2xwd 9pta ')).toBe('K7MQ2XWD9PTA');
  expect(await hashRecoveryCode('k7mq-2xwd-9pta')).toBe(await hashRecoveryCode('K7MQ2XWD9PTA'));
  expect(await hashRecoveryCode('K7MQ2XWD9PTA')).toMatch(/^[0-9a-f]{64}$/);
  expect(isRecoveryCode('K7MQ-2XWD-9PT0')).toBe(false);
  expect(isRecoveryCode('short')).toBe(false);
});
