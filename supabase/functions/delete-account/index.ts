// 계정 삭제: 사진 파일을 지운 뒤 사용자를 삭제합니다. 데이터는 외래 키로 함께 삭제됩니다.
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (request) => {
  const authorization = request.headers.get('Authorization');
  if (!authorization) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const token = authorization.replace(/^Bearer /, '');
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const userId = data.user.id;
  const { data: photos, error: listError } = await admin
    .from('record_photos')
    .select('storage_path')
    .eq('user_id', userId);
  if (listError) return Response.json({ error: listError.message }, { status: 500 });

  const paths = (photos ?? []).map((photo) => photo.storage_path);
  for (let index = 0; index < paths.length; index += 100) {
    const { error: removeError } = await admin.storage
      .from('record-photos')
      .remove(paths.slice(index, index + 100));
    if (removeError) return Response.json({ error: removeError.message }, { status: 500 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });
  return Response.json({ ok: true });
});
