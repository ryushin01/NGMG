import { isTransientError, toErrorMessage } from './errors';

it('알려진 오류를 한국어 안내로 바꾸고 모르는 오류는 내부 내용을 노출하지 않습니다', () => {
  expect(toErrorMessage(new Error('Invalid login credentials'))).toBe(
    '이메일 또는 비밀번호가 맞지 않습니다.',
  );
  expect(toErrorMessage(new Error('Network request failed'))).toBe(
    '네트워크 연결을 확인해 주세요.',
  );
  expect(toErrorMessage(new Error('duplicate key value'), '저장 실패')).toBe('저장 실패');
});

describe('isTransientError', () => {
  it('연결과 인증 만료는 다시 시도할 수 있습니다', () => {
    expect(isTransientError(new TypeError('Network request failed'))).toBe(true);
    expect(isTransientError({ message: 'TypeError: Network request failed', code: '' })).toBe(true);
    expect(isTransientError({ message: 'JWT expired', code: 'PGRST303' })).toBe(true);
    expect(isTransientError({ message: 'x', status: 503 })).toBe(true);
  });
  it('제약 조건 위반과 권한 거부는 다시 보내도 실패합니다', () => {
    expect(isTransientError({ message: 'violates row-level security', code: '42501' })).toBe(false);
    expect(isTransientError({ message: 'bad', status: 400 })).toBe(false);
    expect(isTransientError(null)).toBe(false);
  });
});

it('서버에 닿지 못한 오류는 원인을 알 수 있는 안내로 바꿉니다', () => {
  expect(toErrorMessage(new TypeError('Network request failed'))).toBe(
    '네트워크 연결을 확인해 주세요.',
  );
  expect(toErrorMessage({ name: 'AuthRetryableFetchError', message: '' })).toBe(
    '네트워크 연결을 확인해 주세요.',
  );
  expect(toErrorMessage({ message: 'x', code: '23514' }, '저장 실패')).toBe('저장 실패');
});
