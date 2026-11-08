// 세계 장소 검색과 좌표→주소 변환. 사용 정책을 지키도록 서버에서 호출합니다.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { isValidCoordinate, normalizeResults, pickReverseAddress } from './normalize.ts';

const PHOTON = 'https://photon.komoot.io';
const USER_AGENT = 'NewWorld/1.0 (https://github.com/ryushin01/NewWorld)';
const TIMEOUT_MS = 8000;

const photon = async (path: string, params: Record<string, string>) => {
  const response = await fetch(`${PHOTON}/${path}?${new URLSearchParams(params)}`, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Photon 오류: ${response.status}`);
  const body = await response.json();
  return body.features ?? [];
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
      const features = await photon('api', { q: query, limit: '15' });
      return Response.json({ results: normalizeResults(features) });
    }
    if (isValidCoordinate(latitude, longitude)) {
      const features = await photon('reverse', {
        lat: String(latitude),
        lon: String(longitude),
      });
      return Response.json({ address: pickReverseAddress(features) });
    }
    return Response.json({ error: 'query 또는 좌표가 필요합니다.' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: '검색에 실패했습니다.' }, { status: 502 });
  }
});
