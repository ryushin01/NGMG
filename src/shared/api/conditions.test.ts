import { describeWind, parseConditions, toKstHour } from './conditions';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'id' }));

it('UTC 시각을 한국 시각 시간대로 맞춥니다', () => {
  expect(toKstHour('2026-11-06T00:40:00.000Z')).toBe('2026-11-06T09:00');
});

it('풍향 각도를 불어오는 방향으로 표현합니다', () => {
  expect(describeWind(10.74, 331)).toBe('북서풍 10.7m/s');
  expect(describeWind(3, 0)).toBe('북풍 3.0m/s');
  expect(describeWind(3, 359)).toBe('북풍 3.0m/s');
});

const time = ['2026-11-06T08:00', '2026-11-06T09:00'];
const weather = {
  hourly: {
    time,
    weather_code: [3, 0],
    wind_speed_10m: [1, 10.74],
    wind_direction_10m: [0, 331],
  },
};

it('기록 시각의 값을 고르고 수온이 없어도 나머지를 돌려줍니다', () => {
  const iso = '2026-11-06T00:10:00.000Z';
  const marine = { hourly: { time, sea_surface_temperature: [18, 18.5] } };
  expect(parseConditions(weather, marine, iso)).toEqual({
    weather: '맑음',
    wind: '북서풍 10.7m/s',
    waterTemp: 18.5,
  });
  expect(parseConditions(weather, null, iso)?.waterTemp).toBeNull();
});

it('해당 시각의 값이 없으면 null입니다', () => {
  expect(parseConditions(weather, null, '2020-01-01T00:00:00.000Z')).toBeNull();
});
