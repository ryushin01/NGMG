const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

type Coordinate = { latitude: number; longitude: number };

/** 두 좌표 사이의 대권 거리(km)를 구합니다. */
export const distanceKm = (from: Coordinate, to: Coordinate) => {
  const latitude = toRadians(to.latitude - from.latitude);
  const longitude = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitude / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
};

export const formatDistance = (km: number) =>
  km < 10 ? `${km.toFixed(1)}km` : `${Math.round(km).toLocaleString('ko-KR')}km`;
