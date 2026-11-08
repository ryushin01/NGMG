// OpenStreetMap Nominatim 응답을 앱에서 쓰는 형태로 바꿉니다. Deno와 Jest 양쪽에서 실행됩니다.
export type SearchResult = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type NominatimPlace = {
  place_id: number;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
};

/** 좌표가 잘못된 결과와 같은 이름·좌표의 중복을 제거합니다. */
export const normalizeResults = (places: NominatimPlace[]): SearchResult[] => {
  const seen = new Set<string>();
  return places.flatMap((place) => {
    const latitude = Number(place.lat);
    const longitude = Number(place.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const name = place.name || place.display_name.split(',')[0].trim();
    const key = `${name}|${latitude}|${longitude}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [
      { id: `osm:${place.place_id}`, name, address: place.display_name, latitude, longitude },
    ];
  });
};

export const pickReverseAddress = (place: { display_name?: string } | null): string =>
  place?.display_name ?? '';
