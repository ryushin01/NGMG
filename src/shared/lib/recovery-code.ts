import * as Crypto from 'expo-crypto';

/** 헷갈리는 글자(0/O, 1/I/L)와 U를 뺀 30자에서 12자를 뽑습니다. 약 59비트라 추측하기 어렵습니다. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const LENGTH = 12;

/** 보여 줄 때는 4자씩 끊습니다. 예: K7MQ-2XWD-9PTA */
export const formatRecoveryCode = (code: string) => code.match(/.{1,4}/g)?.join('-') ?? code;

/** 입력한 코드를 저장한 형식으로 맞춥니다. 대소문자와 띄어쓰기, 하이픈은 따지지 않습니다. */
export const normalizeRecoveryCode = (input: string) =>
  input.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const isRecoveryCode = (input: string) => {
  const code = normalizeRecoveryCode(input);
  return code.length === LENGTH && [...code].every((char) => ALPHABET.includes(char));
};

export const createRecoveryCode = () => {
  // 30으로 나눈 나머지가 고르게 나오도록 30의 배수(240) 이상인 바이트는 버립니다.
  let code = '';
  while (code.length < LENGTH) {
    for (const byte of Crypto.getRandomBytes(LENGTH * 2)) {
      if (byte < 240 && code.length < LENGTH) code += ALPHABET[byte % ALPHABET.length];
    }
  }
  return code;
};

/** 서버와 기기에는 코드 원문이 아니라 SHA-256 해시만 저장합니다. */
export const hashRecoveryCode = (input: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, normalizeRecoveryCode(input));
