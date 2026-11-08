import { parseConditions, toUtcHour } from './conditions';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'id' }));

it('기록 시각을 UTC 시간 단위로 맞춥니다', () => {
  expect(toUtcHour('2026-11-06T00:40:00.000Z')).toBe('2026-11-06T00:00');
});

const data = {
  hourly: {
    time: ['2026-11-06T00:00', '2026-11-06T01:00'],
    weather_code: [3, 0],
    temperature_2m: [18, 18.5],
  },
};

it('기록 시각의 날씨와 기온을 고릅니다', () => {
  expect(parseConditions(data, '2026-11-06T01:10:00.000Z')).toEqual({
    weather: '맑음',
    temperature: 18.5,
  });
});

it('해당 시각의 값이 없으면 null입니다', () => {
  expect(parseConditions(data, '2020-01-01T00:00:00.000Z')).toBeNull();
  expect(parseConditions(null, '2026-11-06T01:10:00.000Z')).toBeNull();
});
