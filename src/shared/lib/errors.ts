const MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, '이메일 또는 비밀번호가 맞지 않습니다.'],
  [/already registered/i, '이미 가입된 이메일입니다.'],
  [/email not confirmed/i, '이메일 인증을 먼저 완료해 주세요.'],
  [/network request failed|failed to fetch/i, '네트워크 연결을 확인해 주세요.'],
];

export const toErrorMessage = (
  error: unknown,
  fallback = '문제가 발생했습니다. 다시 시도해 주세요.',
) => {
  const message = error instanceof Error ? error.message : '';
  return MESSAGES.find(([pattern]) => pattern.test(message))?.[1] ?? fallback;
};

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
