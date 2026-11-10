const NETWORK_MESSAGE = '네트워크 연결을 확인해 주세요.';

const MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, '아이디 또는 비밀번호가 맞지 않습니다.'],
  [/already registered/i, '이미 사용 중인 아이디입니다.'],
  [/unsupported photo format/i, '이 사진은 저장할 수 없는 형식입니다. 다른 사진을 골라 주세요.'],
  [/invalid recovery code/i, '아이디 또는 복구 코드가 맞지 않습니다.'],
  [
    /recovery locked/i,
    '복구 코드를 여러 번 틀려 15분 동안 잠겼습니다. 잠시 후 다시 시도해 주세요.',
  ],
];

const TRANSIENT_NAMES = new Set(['AuthRetryableFetchError', 'FunctionsFetchError']);
const TRANSIENT_MESSAGE =
  /network request failed|failed to fetch|fetch failed|network error|load failed|timed? ?out|aborted|jwt expired/i;

/** 연결이나 서버 상태 문제라 나중에 다시 보내면 성공할 수 있는 오류인지 판단합니다. */
export const isTransientError = (error: unknown) => {
  if (typeof error !== 'object' || error === null) return false;
  const { name, message, status, code } = error as {
    name?: string;
    message?: string;
    status?: number;
    code?: string;
  };
  if (name && TRANSIENT_NAMES.has(name)) return true;
  if (code === 'PGRST301' || code === 'PGRST303') return true;
  if (status === 401 || (typeof status === 'number' && status >= 500)) return true;
  return TRANSIENT_MESSAGE.test(message ?? '');
};

export const toErrorMessage = (
  error: unknown,
  fallback = '문제가 발생했습니다. 다시 시도해 주세요.',
) => {
  const message = (error as { message?: string } | null)?.message ?? '';
  const known = MESSAGES.find(([pattern]) => pattern.test(message))?.[1];
  if (known) return known;
  return isTransientError(error) ? NETWORK_MESSAGE : fallback;
};
