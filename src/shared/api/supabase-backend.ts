import 'react-native-url-polyfill/auto';
import { createClient, type Session as SupabaseSession } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { AppState } from 'react-native';
import { env, PHOTO_BUCKET } from '../config';
import { isTransientError } from '../lib/errors';
import { compressPhoto } from '../lib/photo';
import { storageAdapter } from '../lib/storage';
import type {
  Backend,
  ChecklistItem,
  LocalPhoto,
  Photo,
  Place,
  PlaceInput,
  RecordSaveInput,
  Session,
  Trip,
  TripRecord,
} from './types';

const AUTH_STORAGE_KEY = 'newworld.supabase-auth';
const SIGN_OUT_TIMEOUT = 5000;
const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    storageKey: AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 앱이 앞으로 나올 때만 토큰을 갱신합니다.
AppState.addEventListener('change', (state) => {
  if (state === 'active') client.auth.startAutoRefresh();
  else client.auth.stopAutoRefresh();
});

const LAST_SESSION_KEY = 'newworld.last-session';

const localSignOutListeners = new Set<(session: Session | null) => void>();

const toSession = (session: SupabaseSession | null): Session | null =>
  session ? { userId: session.user.id, email: session.user.email ?? '' } : null;

const rememberSession = (session: Session | null) => {
  if (session) storageAdapter.setItem(LAST_SESSION_KEY, JSON.stringify(session));
  return session;
};

const lastSession = (): Session | null => {
  const raw = storageAdapter.getItem(LAST_SESSION_KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
};

type PlaceRow = {
  id: string;
  name: string;
  kind: Place['kind'];
  address: string;
  latitude: number;
  longitude: number;
  memo: string;
  tags: string[];
  catalog_id: string | null;
  wishlisted: boolean;
  created_at: string;
  record_count?: number;
  last_visited_at?: string | null;
};

const toPlace = (row: PlaceRow): Place => ({
  id: row.id,
  name: row.name,
  kind: row.kind,
  address: row.address,
  latitude: row.latitude,
  longitude: row.longitude,
  memo: row.memo,
  tags: row.tags,
  catalogId: row.catalog_id,
  wishlisted: row.wishlisted,
  recordCount: row.record_count ?? 0,
  lastVisitedAt: row.last_visited_at ?? null,
  createdAt: row.created_at,
});

const placePayload = ({ catalogId, ...input }: PlaceInput) => ({
  ...input,
  catalog_id: catalogId,
});

type ChecklistRow = Omit<ChecklistItem, 'listName'> & { list_name: string };

type TripRow = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  stops: string[];
  memo: string;
};

const toTrip = (row: TripRow): Trip => ({
  id: row.id,
  title: row.title,
  startDate: row.start_date,
  endDate: row.end_date,
  stops: row.stops,
  memo: row.memo,
});

type PhotoRow = {
  id: string;
  storage_path: string;
  width: number;
  height: number;
  position: number;
};

type RecordRow = {
  id: string;
  place_id: string;
  visited_at: string;
  title: string;
  memo: string;
  party_size: number | null;
  members: string[];
  rating: number | null;
  weather: string;
  temperature: number | string | null;
  transport: string;
  lodging: string;
  cost: number | null;
  currency: string;
  highlights: string;
  gateway: string;
  encounters: string;
  souvenir: string;
  places: { name: string; kind: Place['kind'] } | null;
  record_photos: PhotoRow[];
};

const RECORD_SELECT =
  '*, places(name, kind), record_photos(id, storage_path, width, height, position)';

const signPhotos = async (rows: PhotoRow[]): Promise<Map<string, string>> => {
  if (rows.length === 0) return new Map();
  const { data, error } = await client.storage.from(PHOTO_BUCKET).createSignedUrls(
    rows.map((row) => row.storage_path),
    SIGNED_URL_TTL,
  );
  if (error) throw error;
  return new Map(
    data.flatMap((item) => (item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [])),
  );
};

const toRecords = async (rows: RecordRow[]): Promise<TripRecord[]> => {
  const urls = await signPhotos(rows.flatMap((row) => row.record_photos));
  return rows.map((row) => ({
    id: row.id,
    placeId: row.place_id,
    placeName: row.places?.name ?? '',
    placeKind: row.places?.kind ?? 'real',
    visitedAt: row.visited_at,
    title: row.title,
    memo: row.memo,
    partySize: row.party_size,
    members: row.members,
    rating: row.rating,
    weather: row.weather,
    temperature: row.temperature === null ? null : Number(row.temperature),
    transport: row.transport,
    lodging: row.lodging,
    cost: row.cost,
    currency: row.currency,
    highlights: row.highlights,
    gateway: row.gateway,
    encounters: row.encounters,
    souvenir: row.souvenir,
    photos: [...row.record_photos]
      .sort((a, b) => a.position - b.position)
      .map((photo): Photo => ({
        id: photo.id,
        path: photo.storage_path,
        url: urls.get(photo.storage_path) ?? '',
        width: photo.width,
        height: photo.height,
      })),
  }));
};

const recordPayload = ({ record }: RecordSaveInput) => ({
  place_id: record.placeId,
  visited_at: record.visitedAt,
  title: record.title,
  memo: record.memo,
  party_size: record.partySize,
  members: record.members,
  rating: record.rating,
  weather: record.weather,
  temperature: record.temperature,
  transport: record.transport,
  lodging: record.lodging,
  cost: record.cost,
  currency: record.currency,
  highlights: record.highlights,
  gateway: record.gateway,
  encounters: record.encounters,
  souvenir: record.souvenir,
});

const currentUserId = async () => {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error('로그인이 필요합니다.');
  return data.session.user.id;
};

const removeFiles = async (paths: string[]) => {
  if (paths.length === 0) return;
  const { error } = await client.storage.from(PHOTO_BUCKET).remove(paths);
  if (error) throw error;
};

/** 업로드 직후 끊겨 행 없이 남은 파일을 지웁니다. 실패해도 저장 결과에는 영향이 없습니다. */
const removeOrphanFiles = async (userId: string, recordId: string) => {
  try {
    const folder = `${userId}/${recordId}`;
    const [{ data: files }, { data: rows }] = await Promise.all([
      client.storage.from(PHOTO_BUCKET).list(folder),
      client.from('record_photos').select('storage_path').eq('record_id', recordId),
    ]);
    const used = new Set((rows ?? []).map((row) => row.storage_path));
    const orphans = (files ?? [])
      .map((file) => `${folder}/${file.name}`)
      .filter((path) => !used.has(path));
    await removeFiles(orphans);
  } catch {
    // 다음 저장 때 다시 정리합니다.
  }
};

const syncPhotos = async (recordId: string, input: RecordSaveInput) => {
  const userId = await currentUserId();
  const { data: existing, error } = await client
    .from('record_photos')
    .select('id, storage_path')
    .eq('record_id', recordId);
  if (error) throw error;

  const keptIds = new Set(input.keptPhotos.map((photo) => photo.id));
  const removed = (existing ?? []).filter((row) => !keptIds.has(row.id));

  const uploaded: string[] = [];
  try {
    const rows = await uploadAll(
      userId,
      recordId,
      input.newPhotos,
      input.keptPhotos.length,
      uploaded,
    );
    if (rows.length > 0) {
      const { error: insertError } = await client.from('record_photos').insert(rows);
      if (insertError) throw insertError;
    }
  } catch (uploadError) {
    // 일부만 올라간 파일이 저장소에 남지 않게 지웁니다.
    await removeFiles(uploaded).catch(() => undefined);
    throw uploadError;
  }

  const orderResults = await Promise.all(
    input.keptPhotos.map((photo, position) =>
      client.from('record_photos').update({ position }).eq('id', photo.id),
    ),
  );
  const orderError = orderResults.find((result) => result.error)?.error;
  if (orderError) throw orderError;
  if (removed.length > 0) {
    const { error: deleteError } = await client
      .from('record_photos')
      .delete()
      .in(
        'id',
        removed.map((row) => row.id),
      );
    if (deleteError) throw deleteError;
    await removeFiles(removed.map((row) => row.storage_path));
  }
  await removeOrphanFiles(userId, recordId);
};

const uploadAll = async (
  userId: string,
  recordId: string,
  photos: LocalPhoto[],
  startPosition: number,
  uploaded: string[],
) => {
  const rows = [];
  for (const [index, photo] of photos.entries()) {
    const { bytes, width, height } = await compressPhoto(photo);
    const path = `${userId}/${recordId}/${Crypto.randomUUID()}.jpg`;
    const { error } = await client.storage
      .from(PHOTO_BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg' });
    if (error) throw error;
    uploaded.push(path);
    rows.push({
      record_id: recordId,
      storage_path: path,
      width,
      height,
      position: startPosition + index,
    });
  }
  return rows;
};

const getRecord = async (id: string) => {
  const { data, error } = await client.from('records').select(RECORD_SELECT).eq('id', id).single();
  if (error) throw error;
  const [record] = await toRecords([data as RecordRow]);
  return record;
};

const getPlace = async (id: string) => {
  const { data, error } = await client.from('place_summaries').select('*').eq('id', id).single();
  if (error) throw error;
  return toPlace(data as PlaceRow);
};

export const supabaseBackend: Backend = {
  mode: 'supabase',
  auth: {
    getCachedSession: lastSession,
    async getSession() {
      const { data, error } = await client.auth.getSession();
      // 토큰이 만료된 채 오프라인이면 갱신에 실패합니다. 이때 로그아웃시키지 않습니다.
      if (!data.session && error && isTransientError(error)) return lastSession();
      return rememberSession(toSession(data.session));
    },
    async isReady() {
      // 갱신에 실패하면 클라이언트가 anon 키로 요청을 보내, 저장은 거절되고 조회는 빈 목록이 됩니다.
      const { data } = await client.auth.getSession();
      return !!data.session;
    },
    subscribe(listener) {
      localSignOutListeners.add(listener);
      const { data } = client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') storageAdapter.removeItem(LAST_SESSION_KEY);
        else if (!session) {
          // 초기 이벤트의 빈 세션은 오프라인 토큰 갱신 실패일 수 있습니다.
          listener(lastSession());
          return;
        }
        listener(rememberSession(toSession(session)));
      });
      return () => {
        localSignOutListeners.delete(listener);
        data.subscription.unsubscribe();
      };
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(email, password) {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;
      return { needsConfirmation: !data.session };
    },
    async signOut() {
      // 토큰이 만료된 채 끊겨 있으면 갱신 재시도가 길어지므로 오래 기다리지 않습니다.
      const { error } = await Promise.race([
        client.auth.signOut(),
        new Promise<{ error: Error }>((resolve) =>
          setTimeout(
            () => resolve({ error: new TypeError('Network request failed') }),
            SIGN_OUT_TIMEOUT,
          ),
        ),
      ]);
      if (!error) return;
      if (!isTransientError(error)) throw error;
      // 끊긴 상태에서도 이 기기에서는 로그아웃되어야 합니다. 서버 토큰은 만료되면 사라집니다.
      storageAdapter.removeItem(AUTH_STORAGE_KEY);
      storageAdapter.removeItem(LAST_SESSION_KEY);
      localSignOutListeners.forEach((listener) => listener(null));
    },
    async sendPasswordReset(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: Linking.createURL('/'),
      });
      if (error) throw error;
    },
    async applyRecoveryLink(url) {
      const params = new URLSearchParams(url.split('#')[1] ?? '');
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (params.get('type') !== 'recovery' || !access_token || !refresh_token) return false;
      const { error } = await client.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
      return true;
    },
    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
    },
    async deleteAccount() {
      const { error } = await client.functions.invoke('delete-account', { method: 'POST' });
      if (error) throw error;
      await client.auth.signOut({ scope: 'local' });
    },
  },
  places: {
    async list() {
      const { data, error } = await client
        .from('place_summaries')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as PlaceRow[]).map(toPlace);
    },
    get: getPlace,
    async create(input, id) {
      const { data, error } = await client
        .from('places')
        .upsert({ ...placePayload(input), ...(id ? { id } : {}) })
        .select('id')
        .single();
      if (error) throw error;
      return getPlace(data.id);
    },
    async update(id, input) {
      const { error } = await client.from('places').update(placePayload(input)).eq('id', id);
      if (error) throw error;
      return getPlace(id);
    },
    async remove(id) {
      // 행이 먼저 지워지면 경로를 알 수 없으므로 사진 경로부터 조회합니다.
      const { data: records, error: recordError } = await client
        .from('records')
        .select('record_photos(storage_path)')
        .eq('place_id', id);
      if (recordError) throw recordError;
      const paths = (records as { record_photos: { storage_path: string }[] }[]).flatMap((record) =>
        record.record_photos.map((photo) => photo.storage_path),
      );
      const { error } = await client.from('places').delete().eq('id', id);
      if (error) throw error;
      await removeFiles(paths);
    },
  },
  records: {
    async list(filter) {
      let query = client
        .from('records')
        .select(RECORD_SELECT)
        .order('visited_at', { ascending: false });
      if (filter?.placeId) query = query.eq('place_id', filter.placeId);
      const { data, error } = await query;
      if (error) throw error;
      return toRecords(data as RecordRow[]);
    },
    get: getRecord,
    async create(input, id) {
      const { data, error } = await client
        .from('records')
        .upsert({ ...recordPayload(input), ...(id ? { id } : {}) })
        .select('id')
        .single();
      if (error) throw error;
      try {
        await syncPhotos(data.id, input);
      } catch (photoError) {
        // 사진 저장에 실패하면 재시도 시 기록이 중복되지 않도록 되돌립니다.
        await client.from('records').delete().eq('id', data.id);
        throw photoError;
      }
      return getRecord(data.id);
    },
    async update(id, input) {
      const { error } = await client.from('records').update(recordPayload(input)).eq('id', id);
      if (error) throw error;
      await syncPhotos(id, input);
      return getRecord(id);
    },
    async remove(id) {
      const { data, error: listError } = await client
        .from('record_photos')
        .select('storage_path')
        .eq('record_id', id);
      if (listError) throw listError;
      const { error } = await client.from('records').delete().eq('id', id);
      if (error) throw error;
      await removeFiles((data ?? []).map((row) => row.storage_path));
    },
  },
  checklist: {
    async list() {
      const { data, error } = await client
        .from('checklist_items')
        .select('id, title, category, checked, position, list_name')
        .order('position');
      if (error) throw error;
      return (data as ChecklistRow[]).map(({ list_name, ...item }) => ({
        ...item,
        listName: list_name,
      }));
    },
    async upsert(items) {
      const { error } = await client
        .from('checklist_items')
        .upsert(items.map(({ listName, ...item }) => ({ ...item, list_name: listName })));
      if (error) throw error;
    },
    async remove(ids) {
      const { error } = await client.from('checklist_items').delete().in('id', ids);
      if (error) throw error;
    },
  },
  trips: {
    async list() {
      const { data, error } = await client
        .from('trips')
        .select('id, title, start_date, end_date, stops, memo')
        .order('start_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data as TripRow[]).map(toTrip);
    },
    async save({ id, title, startDate, endDate, stops, memo }) {
      const { data, error } = await client
        .from('trips')
        .upsert({ id, title, start_date: startDate, end_date: endDate, stops, memo })
        .select('id, title, start_date, end_date, stops, memo')
        .single();
      if (error) throw error;
      return toTrip(data as TripRow);
    },
    async remove(id) {
      const { error } = await client.from('trips').delete().eq('id', id);
      if (error) throw error;
    },
  },
  search: {
    async places(query) {
      const { data, error } = await client.functions.invoke('place-search', { body: { query } });
      if (error) throw error;
      return data.results;
    },
    async reverseGeocode(latitude, longitude) {
      const { data, error } = await client.functions.invoke('place-search', {
        body: { latitude, longitude },
      });
      if (error) throw error;
      return data.address;
    },
  },
};
