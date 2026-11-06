// Kakao 로컬 API 응답을 앱에서 쓰는 형태로 바꿉니다. Deno와 Jest 양쪽에서 실행됩니다.
export type SearchResult = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type KakaoKeyword = {
  id: string;
  place_name: string;
  road_address_name?: string;
  address_name?: string;
  x: string;
  y: string;
};
type KakaoAddress = { address_name: string; x: string; y: string };

const toResult = (id: string, name: string, address: string, x: string, y: string) => {
  const latitude = Number(y);
  const longitude = Number(x);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { id, name, address, latitude, longitude };
};

/** 주소 일치 결과를 앞에 두고 같은 좌표의 중복을 제거합니다. */
export const mergeSearchResults = (
  addresses: KakaoAddress[],
  keywords: KakaoKeyword[],
): SearchResult[] => {
  const results = [
    ...addresses.map((item) =>
      toResult(`address:${item.x},${item.y}`, item.address_name, item.address_name, item.x, item.y),
    ),
    ...keywords.map((item) =>
      toResult(
        `place:${item.id}`,
        item.place_name,
        item.road_address_name || item.address_name || '',
        item.x,
        item.y,
      ),
    ),
  ].filter((item): item is SearchResult => item !== null);
  const seen = new Set<string>();
  return results.filter((item) => {
    const key = `${item.name}|${item.latitude}|${item.longitude}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

type KakaoCoord = {
  road_address?: { address_name: string } | null;
  address?: { address_name: string } | null;
};

export const pickReverseAddress = (documents: KakaoCoord[]): string => {
  const first = documents[0];
  return first?.road_address?.address_name || first?.address?.address_name || '';
};
