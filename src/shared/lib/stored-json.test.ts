import { isRecord, parseStoredJson } from './stored-json';

describe('parseStoredJson', () => {
  it('저장한 JSON을 읽고, 없거나 깨졌으면 undefined', () => {
    expect(parseStoredJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseStoredJson(null)).toBeUndefined();
    expect(parseStoredJson(undefined)).toBeUndefined();
    expect(parseStoredJson('{oops')).toBeUndefined();
  });

  it('isRecord는 배열·null이 아닌 객체만 참입니다', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
  });
});
