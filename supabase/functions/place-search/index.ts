// 세계 장소 검색과 좌표→주소 변환. 사용 정책을 지키도록 서버에서 호출합니다.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { isValidCoordinate, normalizeResults, pickReverseAddress } from './normalize.ts';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
// 사용 정책에 따라 앱을 식별할 수 있는 User-Agent를 보냅니다.
const USER_AGENT = 'NewWorld/1.0 (https://github.com/ryushin01/NewWorld)';

const TIMEOUT_MS = 8000;

const nominatim = async (path: string, params: Record<string, string>) => {
  const query = new URLSearchParams({ format: 'jsonv2', 'accept-language': 'ko', ...params });
  const response = await fetch(`${NOMINATIM}/${path}?${query}`, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Nominatim 오류: ${response.status}`);
  return response.json();
};

/** 앱에 공개되는 anon 키만으로 외부 호출을 하지 못하게 로그인한 사용자만 허용합니다. */
const isSignedIn = async (request: Request) => {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!token) return false;
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data, error } = await client.auth.getUser(token);
  return !error && !!data.user;
};

Deno.serve(async (request) => {
  if (!(await isSignedIn(request))) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  try {
    const { query, latitude, longitude } = await request.json();
    if (typeof query === 'string' && query.trim()) {
      const places = await nominatim('search', { q: query, limit: '15' });
      return Response.json({ results: normalizeResults(places) });
    }
    if (isValidCoordinate(latitude, longitude)) {
      const place = await nominatim('reverse', {
        lat: String(latitude),
        lon: String(longitude),
      });
      return Response.json({ address: pickReverseAddress(place) });
    }
    return Response.json({ error: 'query 또는 좌표가 필요합니다.' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: '검색에 실패했습니다.' }, { status: 502 });
  }
});
