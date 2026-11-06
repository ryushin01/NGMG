export type Conditions = { weather: string; wind: string; waterTemp: number | null };

const WMO: [number[], string][] = [
  [[0], '맑음'],
  [[1, 2], '구름 조금'],
  [[3], '흐림'],
  [[45, 48], '안개'],
  [[51, 53, 55, 56, 57], '이슬비'],
  [[61, 63, 65, 66, 67, 80, 81, 82], '비'],
  [[71, 73, 75, 77, 85, 86], '눈'],
  [[95, 96, 99], '뇌우'],
];

const DIRECTIONS = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];

export const describeWeather = (code: number) =>
  WMO.find(([codes]) => codes.includes(code))?.[1] ?? '';

/** 풍향은 바람이 불어오는 방향입니다. */
export const describeWind = (speed: number, degrees: number) =>
  `${DIRECTIONS[Math.round(degrees / 45) % 8]}풍 ${speed.toFixed(1)}m/s`;

const KST_MS = 9 * 60 * 60 * 1000;

/** 응답의 시각 문자열과 맞추기 위한 한국 시각 (YYYY-MM-DDTHH:00) */
export const toKstHour = (iso: string) =>
  `${new Date(new Date(iso).getTime() + KST_MS).toISOString().slice(0, 13)}:00`;

type Hourly = { time: string[] } & Record<string, (number | null)[] | string[]>;
type WeatherResponse = { hourly?: Hourly };

const valueAt = (data: WeatherResponse | null, field: string, hour: string) => {
  const index = data?.hourly?.time.indexOf(hour) ?? -1;
  if (index < 0) return null;
  const value = data?.hourly?.[field]?.[index];
  return typeof value === 'number' ? value : null;
};

export const parseConditions = (
  weather: WeatherResponse | null,
  marine: WeatherResponse | null,
  iso: string,
): Conditions | null => {
  const hour = toKstHour(iso);
  const code = valueAt(weather, 'weather_code', hour);
  const speed = valueAt(weather, 'wind_speed_10m', hour);
  const direction = valueAt(weather, 'wind_direction_10m', hour);
  const water = valueAt(marine, 'sea_surface_temperature', hour);
  if (code === null && speed === null && water === null) return null;
  return {
    weather: code === null ? '' : describeWeather(code),
    wind: speed === null || direction === null ? '' : describeWind(speed, direction),
    waterTemp: water,
  };
};

const ARCHIVE_AFTER_DAYS = 80;

const getJson = async (url: string): Promise<WeatherResponse | null> => {
  const response = await fetch(url);
  // 내륙 좌표는 해양 API가 값을 주지 않으므로 수온 없이 진행합니다.
  return response.ok ? ((await response.json()) as WeatherResponse) : null;
};

/** 해당 날짜와 시각의 날씨, 바람, 수온을 Open-Meteo에서 가져옵니다. */
export const fetchConditions = async (latitude: number, longitude: number, iso: string) => {
  const date = toKstHour(iso).slice(0, 10);
  const common = `latitude=${latitude}&longitude=${longitude}&start_date=${date}&end_date=${date}&timezone=Asia%2FSeoul`;
  const age = (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000);
  const host =
    age > ARCHIVE_AFTER_DAYS
      ? 'archive-api.open-meteo.com/v1/archive'
      : 'api.open-meteo.com/v1/forecast';
  const [weather, marine] = await Promise.all([
    getJson(
      `https://${host}?${common}&hourly=weather_code,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms`,
    ),
    getJson(
      `https://marine-api.open-meteo.com/v1/marine?${common}&hourly=sea_surface_temperature`,
    ).catch(() => null),
  ]);
  return parseConditions(weather, marine, iso);
};
