/**
 * 기기에 저장한 JSON을 읽습니다. 값이 없거나 깨졌으면 undefined를 돌려줍니다.
 * 깨진 저장값 하나 때문에 로그인이나 앱 시작이 막히지 않게, 모양은 읽는 쪽에서 확인합니다.
 */
export function parseStoredJson(raw: string | null | undefined): unknown {
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
