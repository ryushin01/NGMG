import { getLunarDay, getTide } from './tide';

const dangiDay = (date: Date) =>
  Number(
    new Intl.DateTimeFormat('en-u-ca-dangi', { day: 'numeric', timeZone: 'Asia/Seoul' }).format(
      date,
    ),
  );

const kstNoon = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 3));

describe('getLunarDay', () => {
  it('설날과 추석의 음력 일을 맞춥니다', () => {
    expect(getLunarDay(kstNoon(2026, 2, 17))).toBe(1);
    expect(getLunarDay(kstNoon(2026, 9, 25))).toBe(15);
    expect(getLunarDay(kstNoon(2027, 2, 7))).toBe(1);
  });

  it('2020~2040년 모든 날짜가 단기 달력과 일치합니다', () => {
    const start = Date.UTC(2020, 0, 1, 3);
    const days = 21 * 365;
    const mismatches: string[] = [];
    for (let i = 0; i < days; i += 1) {
      const date = new Date(start + i * 86400000);
      if (getLunarDay(date) !== dangiDay(date)) mismatches.push(date.toISOString().slice(0, 10));
    }
    expect(mismatches).toEqual([]);
  });
});

describe('getTide', () => {
  // 기준표: https://www.badatime.com/guide
  const EXPECTED: [number, string, string][] = [
    [1, '7물', '8물'],
    [7, '13물', '14물'],
    [8, '조금', '조금'],
    [9, '무시', '1물'],
    [10, '1물', '2물'],
    [15, '6물', '7물'],
    [16, '7물', '8물'],
    [23, '조금', '조금'],
    [24, '무시', '1물'],
    [30, '6물', '7물'],
  ];

  it.each(EXPECTED)('음력 %i일은 서해 %s, 남해 %s입니다', (lunarDay, west, south) => {
    // 2026-02-17이 음력 1일, 2월은 30일까지 있습니다.
    const date = new Date(kstNoon(2026, 2, 17).getTime() + (lunarDay - 1) * 86400000);
    if (getLunarDay(date) !== lunarDay) return; // 작은달이면 건너뜁니다.
    expect(getTide(date, 36.5, 126.3).name).toBe(west);
    expect(getTide(date, 34.03, 127.3).name).toBe(south);
  });

  it('해역에 따라 물때식을 고릅니다', () => {
    const date = kstNoon(2026, 11, 6);
    expect(getTide(date, 37.4, 126.5).system).toBe('7물때식');
    expect(getTide(date, 33.5, 126.5).system).toBe('8물때식');
    expect(getTide(date, 37.5, 129.1).system).toBe('8물때식');
  });
});
