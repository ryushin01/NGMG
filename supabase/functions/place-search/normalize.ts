// OpenStreetMap 기반 Photon 응답을 앱에서 쓰는 형태로 바꿉니다. Deno와 Jest 양쪽에서 실행됩니다.
export type SearchResult = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type PhotonFeature = {
  properties?: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    street?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  geometry?: { coordinates?: [number, number] };
};

/** 이름과 겹치지 않는 지역 단위를 작은 것부터 잇습니다. */
const toAddress = (properties: NonNullable<PhotonFeature['properties']>) => {
  const { name, street, city, county, state, country } = properties;
  return [...new Set([street, city, county, state, country])]
    .filter((part) => part && part !== name)
    .join(', ');
};

/** 좌표나 이름이 없는 결과와 같은 이름·좌표의 중복을 제거합니다. */
export const normalizeResults = (features: PhotonFeature[]): SearchResult[] => {
  const seen = new Set<string>();
  return features.flatMap((feature) => {
    const properties = feature.properties ?? {};
    const [longitude, latitude] = feature.geometry?.coordinates ?? [];
    const name = properties.name || properties.city || properties.state || '';
    if (!name || typeof latitude !== 'number' || typeof longitude !== 'number') return [];
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const key = `${name}|${latitude}|${longitude}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [
      {
        id: `osm:${properties.osm_type ?? ''}${properties.osm_id ?? key}`,
        name,
        address: toAddress(properties),
        latitude,
        longitude,
      },
    ];
  });
};

export const pickReverseAddress = (features: PhotonFeature[]): string => {
  const properties = features[0]?.properties;
  if (!properties) return '';
  const address = toAddress(properties);
  return properties.name && address ? `${properties.name}, ${address}` : properties.name || address;
};

export const isValidCoordinate = (latitude: unknown, longitude: unknown) =>
  typeof latitude === 'number' &&
  typeof longitude === 'number' &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180;
