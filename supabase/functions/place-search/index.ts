// 주소·장소 검색과 좌표→주소 변환. Kakao REST 키를 앱에 넣지 않도록 서버에서 호출합니다.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { mergeSearchResults, pickReverseAddress } from './normalize.ts';

const KAKAO = 'https://dapi.kakao.com/v2/local';

const kakao = async (path: string, params: Record<string, string>) => {
  const key = Deno.env.get('KAKAO_REST_API_KEY');
  if (!key) throw new Error('KAKAO_REST_API_KEY가 설정되지 않았습니다.');
  const response = await fetch(`${KAKAO}/${path}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `KakaoAK ${key}` },
  });
  if (!response.ok) throw new Error(`Kakao API 오류: ${response.status}`);
  const body = await response.json();
  return body.documents ?? [];
};

/** 앱에 공개되는 anon 키만으로 Kakao 사용량을 쓰지 못하게 로그인한 사용자만 허용합니다. */
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
      const [addresses, keywords] = await Promise.all([
        kakao('search/address.json', { query, size: '5' }),
        kakao('search/keyword.json', { query, size: '15' }),
      ]);
      return Response.json({ results: mergeSearchResults(addresses, keywords) });
    }
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      const documents = await kakao('geo/coord2address.json', {
        x: String(longitude),
        y: String(latitude),
      });
      return Response.json({ address: pickReverseAddress(documents) });
    }
    return Response.json({ error: 'query 또는 좌표가 필요합니다.' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: '검색에 실패했습니다.' }, { status: 502 });
  }
});
