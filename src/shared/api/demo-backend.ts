import * as Crypto from 'expo-crypto';
import { compressPhoto, photoStore } from '../lib/photo';
import { createRecoveryCode, hashRecoveryCode } from '../lib/recovery-code';
import { storageAdapter } from '../lib/storage';
import { DEMO_PLACES, DEMO_RECORDS, DEMO_SEARCH } from './demo-data';
import type {
  Backend,
  ChecklistItem,
  Photo,
  Place,
  Profile,
  RecordSaveInput,
  Session,
  CheckIn,
  Trip,
  TripRecord,
} from './types';

/**
 * Supabase 환경 변수가 없을 때 쓰는 가상 데이터 백엔드입니다.
 * 서버 없이 앱을 체험할 수 있도록 변경 내용을 이 기기에 저장합니다.
 */
const STATE_KEY = 'newworld.demo.state';
const PHOTO_PREFIX = 'demo-photo:';

type UserData = { places: Place[]; records: TripRecord[] };

type DemoState = {
  session: Session | null;
  /** 이전 버전은 장소와 기록을 계정 구분 없이 저장했습니다. 불러올 때 둘러보기 계정으로 옮깁니다. */
  places?: Place[];
  records?: TripRecord[];
  /** 회원 id별 장소와 기록 */
  userData?: [string, UserData][];
  checklists: [string, ChecklistItem[]][];
  trips: [string, Trip[]][];
  checkins?: [string, CheckIn[]][];
  /** 아이디별 비밀번호 해시. 원문은 저장하지 않습니다. */
  accounts?: [string, DemoAccount][];
  /** 회원 id별 프로필. avatar는 사진 보관소의 파일 이름입니다. */
  profiles?: [string, StoredProfile][];
  sequence: number;
};

type DemoAccount = {
  salt: string;
  hash: string;
  /** 복구 코드 해시. 이전 버전에서 만든 계정에는 없습니다. */
  recoveryHash?: string;
  failures?: number;
  lockedUntil?: number;
};

/** 복구 코드를 연달아 틀리면 잠가 무작위 대입을 막습니다. 서버와 같은 규칙입니다. */
const MAX_RECOVERY_FAILURES = 5;
const RECOVERY_LOCK_MS = 15 * 60 * 1000;
type StoredProfile = { nickname: string; name: string; avatar: string | null };

/** 둘러보기 계정. 이전 버전에서 쌓인 데이터를 이어 쓰도록 회원 id를 그대로 둡니다. */
export const GUEST_USERNAME = 'guest';
const GUEST_SESSION: Session = { userId: 'demo-guest@newworld.demo', username: GUEST_USERNAME };
const AVATAR_EDGE = 512;

const hashPassword = (salt: string, password: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);

/** iOS는 앱 업데이트 때 컨테이너 경로가 바뀌므로 저장한 파일 이름으로 주소를 다시 만듭니다. */
const withPhotoUrls = (record: TripRecord): TripRecord => ({
  ...record,
  photos: record.photos.map((photo) =>
    photo.path.startsWith(PHOTO_PREFIX)
      ? { ...photo, url: photoStore.uriOf(photo.path.slice(PHOTO_PREFIX.length)) }
      : photo,
  ),
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasId = (value: unknown) => isObject(value) && typeof value.id === 'string';

const isRecord = (value: unknown) =>
  hasId(value) &&
  typeof (value as { visitedAt?: unknown }).visitedAt === 'string' &&
  Array.isArray((value as { photos?: unknown }).photos) &&
  (value as { photos: unknown[] }).photos.every(
    (photo) => isObject(photo) && typeof photo.path === 'string',
  );

const isOwnerEntry = (value: unknown, isItem: (item: unknown) => boolean = hasId) =>
  Array.isArray(value) &&
  value.length === 2 &&
  typeof value[0] === 'string' &&
  Array.isArray(value[1]) &&
  value[1].every(isItem);

/** 뱃지 계산이 날짜로 정렬하므로 여행지와 인증 날짜가 있는 항목만 받습니다. */
const isCheckIn = (value: unknown) =>
  hasId(value) &&
  typeof (value as { catalogId?: unknown }).catalogId === 'string' &&
  typeof (value as { checkedAt?: unknown }).checkedAt === 'string';

/** 배열이 아니면 없는 값으로 보고, 형식이 틀린 항목은 버립니다. */
const validItems = <T>(value: unknown, isValid: (item: unknown) => boolean) =>
  Array.isArray(value) ? (value.filter(isValid) as T[]) : undefined;

/** 형식이 틀린 저장값 때문에 앱이 시작되지 못하는 일이 없도록 칸별로 검사합니다. */
const loadState = (): Partial<DemoState> => {
  try {
    const value: unknown = JSON.parse(storageAdapter.getItem(STATE_KEY) ?? '{}');
    if (!isObject(value)) return {};
    const state = value;
    const stored = state.session as {
      userId?: unknown;
      username?: unknown;
      email?: unknown;
    } | null;
    // 이메일로 로그인하던 이전 버전의 세션은 아이디로 바꿉니다.
    const username =
      typeof stored?.username === 'string'
        ? stored.username
        : typeof stored?.email === 'string'
          ? stored.email.split('@')[0]
          : null;
    return {
      session:
        typeof stored?.userId === 'string' && username !== null
          ? { userId: stored.userId, username }
          : null,
      places: validItems<Place>(state.places, hasId),
      records: validItems<TripRecord>(state.records, isRecord),
      userData: validItems<[string, UserData]>(
        state.userData,
        (entry) =>
          Array.isArray(entry) &&
          typeof entry[0] === 'string' &&
          isObject(entry[1]) &&
          Array.isArray(entry[1].places) &&
          Array.isArray(entry[1].records),
      )?.map(([userId, data]): [string, UserData] => [
        userId,
        {
          places: data.places.filter(hasId),
          records: data.records.filter(isRecord),
        },
      ]),
      checklists: validItems<[string, ChecklistItem[]]>(state.checklists, (entry) =>
        isOwnerEntry(entry),
      ),
      trips: validItems<[string, Trip[]]>(state.trips, (entry) => isOwnerEntry(entry)),
      checkins: validItems<[string, CheckIn[]]>(state.checkins, (entry) =>
        isOwnerEntry(entry, isCheckIn),
      ),
      accounts: validItems<[string, DemoAccount]>(
        state.accounts,
        (entry) =>
          Array.isArray(entry) &&
          typeof entry[0] === 'string' &&
          isObject(entry[1]) &&
          typeof entry[1].salt === 'string' &&
          typeof entry[1].hash === 'string' &&
          (entry[1].recoveryHash === undefined || typeof entry[1].recoveryHash === 'string'),
      ),
      profiles: validItems<[string, StoredProfile]>(
        state.profiles,
        (entry) =>
          Array.isArray(entry) &&
          typeof entry[0] === 'string' &&
          isObject(entry[1]) &&
          typeof entry[1].nickname === 'string' &&
          typeof entry[1].name === 'string' &&
          (entry[1].avatar === null || typeof entry[1].avatar === 'string'),
      ),
      sequence: typeof state.sequence === 'number' ? state.sequence : undefined,
    };
  } catch {
    return {};
  }
};

const saved = loadState();

let session: Session | null = saved.session ?? null;
const listeners = new Set<(session: Session | null) => void>();
const persist = () => {
  if (activeUserId) userData.set(activeUserId, { places, records });
  const state: DemoState = {
    session,
    userData: [...userData],
    checklists: [...checklists],
    trips: [...trips],
    checkins: [...checkins],
    accounts: [...accounts],
    profiles: [...profiles],
    sequence,
  };
  storageAdapter.setItem(STATE_KEY, JSON.stringify(state));
};

const setSession = (next: Session | null) => {
  switchUser(next?.userId ?? '');
  session = next;
  persist();
  listeners.forEach((listener) => listener(next));
};

/** 예시 장소와 기록은 둘러보기 계정에만 두고, 가입한 계정은 빈 상태로 시작합니다. */
const freshData = (userId: string): UserData =>
  userId === GUEST_SESSION.userId
    ? { places: [...DEMO_PLACES], records: [...DEMO_RECORDS] }
    : { places: [], records: [] };

const userData = new Map<string, UserData>(saved.userData);
// 이전 버전에는 아이디 가입이 없어 저장된 장소와 기록은 모두 둘러보기 데이터였습니다.
if (!saved.userData && (saved.places || saved.records)) {
  userData.set(GUEST_SESSION.userId, {
    places: saved.places ?? [],
    records: saved.records ?? [],
  });
}

let activeUserId = session?.userId ?? '';
const dataOf = (userId: string) => {
  const data = userData.get(userId) ?? freshData(userId);
  return { places: data.places, records: data.records.map(withPhotoUrls) };
};
let { places, records } = dataOf(activeUserId);

/** 로그인한 계정이 바뀌면 그 계정의 장소와 기록으로 바꿉니다. */
const switchUser = (userId: string) => {
  if (userId === activeUserId) return;
  if (activeUserId) userData.set(activeUserId, { places, records });
  activeUserId = userId;
  ({ places, records } = dataOf(userId));
};
let sequence = saved.sequence ?? 1000;
const nextId = () => `demo-${(sequence += 1)}`;

let offline = false;
/** 시뮬레이터에서 끊을 수 없는 네트워크를 대신해 데모 모드의 연결을 끊습니다. */
export const setDemoOffline = (next: boolean) => {
  offline = next;
};
export const isDemoOffline = () => offline;

const wait = async () => {
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (offline) throw new TypeError('Network request failed');
};

/** 계정별 저장을 확인할 수 있도록 체크리스트만 이메일별로 나눕니다. */
const checklists = new Map<string, ChecklistItem[]>(saved.checklists);
const myChecklist = () => checklists.get(session?.userId ?? '') ?? [];
const trips = new Map<string, Trip[]>(saved.trips);
const checkins = new Map<string, CheckIn[]>(saved.checkins);
const myCheckins = () => checkins.get(session?.userId ?? '') ?? [];
const myTrips = () => trips.get(session?.userId ?? '') ?? [];
const accounts = new Map<string, DemoAccount>(saved.accounts);
const profiles = new Map<string, StoredProfile>(saved.profiles);
const userIdOf = (username: string) => `demo-${username}`;

const toProfile = (stored: StoredProfile | undefined): Profile => ({
  nickname:
    stored?.nickname ??
    (session?.username === GUEST_USERNAME ? '둘러보는 여행자' : (session?.username ?? '')),
  name: stored?.name ?? '',
  avatarUrl: stored?.avatar ? photoStore.uriOf(stored.avatar) : null,
});
const setMyTrips = (items: Trip[]) => {
  trips.set(session?.userId ?? '', items);
  persist();
};

const setMyChecklist = (items: ChecklistItem[]) => {
  checklists.set(session?.userId ?? '', items);
  persist();
};

const withStats = (place: Place): Place => {
  const own = records.filter((record) => record.placeId === place.id);
  return {
    ...place,
    recordCount: own.length,
    lastVisitedAt:
      own
        .map((record) => record.visitedAt)
        .sort()
        .at(-1) ?? null,
  };
};

/** 사진 파일을 지우지 못해도 계정 삭제나 프로필 저장은 끝까지 진행합니다. */
const removeAvatar = (name: string) => {
  try {
    photoStore.remove(name);
  } catch {
    // 남은 파일은 다음 정리 때 지웁니다.
  }
};

const removePhotos = (photos: Photo[]) => {
  for (const photo of photos) {
    if (!photo.path.startsWith(PHOTO_PREFIX)) continue;
    try {
      photoStore.remove(photo.path.slice(PHOTO_PREFIX.length));
    } catch {
      // 파일을 지우지 못해도 데모 동작에는 영향이 없습니다.
    }
  }
};

const findPlace = (id: string) => {
  const place = places.find((item) => item.id === id);
  if (!place) throw new Error('장소를 찾을 수 없습니다.');
  return withStats(place);
};

const findRecord = (id: string) => {
  const record = records.find((item) => item.id === id);
  if (!record) throw new Error('기록을 찾을 수 없습니다.');
  return record;
};

const toRecord = async (id: string, input: RecordSaveInput): Promise<TripRecord> => {
  const place = findPlace(input.record.placeId);
  // 서버 모드와 같은 압축 경로가 실제 기기에서 동작하는지 함께 검증합니다.
  const compressed = await Promise.all(input.newPhotos.map((photo) => compressPhoto(photo)));
  const added: Photo[] = await Promise.all(
    compressed.map(async (photo) => {
      const name = await photoStore.save(photo.uri);
      return {
        id: nextId(),
        path: `${PHOTO_PREFIX}${name}`,
        url: photoStore.uriOf(name),
        width: photo.width,
        height: photo.height,
      };
    }),
  );
  return {
    ...input.record,
    id,
    placeName: place.name,
    placeKind: place.kind,
    photos: [...input.keptPhotos, ...added],
  };
};

export const demoBackend: Backend = {
  mode: 'demo',
  auth: {
    getCachedSession: () => session,
    getSession: async () => session,
    isReady: async () => true,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async signIn(username, password) {
      await wait();
      const account = accounts.get(username);
      if (!account || (await hashPassword(account.salt, password)) !== account.hash) {
        throw new Error('Invalid login credentials');
      }
      setSession({ userId: userIdOf(username), username });
    },
    async signUp({ username, password, nickname, name }) {
      await wait();
      if (username === GUEST_USERNAME || accounts.has(username)) {
        throw new Error('User already registered');
      }
      const salt = Crypto.randomUUID();
      const recoveryCode = createRecoveryCode();
      accounts.set(username, {
        salt,
        hash: await hashPassword(salt, password),
        recoveryHash: await hashRecoveryCode(recoveryCode),
      });
      profiles.set(userIdOf(username), { nickname, name, avatar: null });
      setSession({ userId: userIdOf(username), username });
      return { recoveryCode };
    },
    async recover({ username, code, password }) {
      await wait();
      const account = accounts.get(username);
      if (account?.lockedUntil && account.lockedUntil > Date.now()) {
        throw new Error('Recovery locked');
      }
      if (!account?.recoveryHash || (await hashRecoveryCode(code)) !== account.recoveryHash) {
        if (account) {
          const failures = (account.failures ?? 0) + 1;
          accounts.set(username, {
            ...account,
            failures: failures >= MAX_RECOVERY_FAILURES ? 0 : failures,
            lockedUntil:
              failures >= MAX_RECOVERY_FAILURES ? Date.now() + RECOVERY_LOCK_MS : undefined,
          });
          persist();
        }
        throw new Error('Invalid recovery code');
      }
      const salt = Crypto.randomUUID();
      const recoveryCode = createRecoveryCode();
      accounts.set(username, {
        salt,
        hash: await hashPassword(salt, password),
        recoveryHash: await hashRecoveryCode(recoveryCode),
      });
      setSession({ userId: userIdOf(username), username });
      return { recoveryCode };
    },
    async resetRecoveryCode(current) {
      await wait();
      const username = session?.username ?? '';
      const account = accounts.get(username);
      if (!account || (await hashPassword(account.salt, current)) !== account.hash) {
        throw new Error('Invalid login credentials');
      }
      const recoveryCode = createRecoveryCode();
      accounts.set(username, { ...account, recoveryHash: await hashRecoveryCode(recoveryCode) });
      persist();
      return { recoveryCode };
    },
    async browse() {
      await wait();
      setSession(GUEST_SESSION);
    },
    async signOut() {
      setSession(null);
    },
    async updatePassword(current, next) {
      await wait();
      const username = session?.username ?? '';
      const account = accounts.get(username);
      if (!account || (await hashPassword(account.salt, current)) !== account.hash) {
        throw new Error('Invalid login credentials');
      }
      const salt = Crypto.randomUUID();
      accounts.set(username, { ...account, salt, hash: await hashPassword(salt, next) });
      persist();
    },
    async deleteAccount() {
      // 이 계정의 장소와 기록만 지웁니다. 둘러보기 계정은 처음 예시 데이터로 되돌립니다.
      const photos = records.flatMap((record) => record.photos);
      if (activeUserId === GUEST_SESSION.userId)
        userData.set(activeUserId, freshData(activeUserId));
      else userData.delete(activeUserId);
      activeUserId = '';
      places = [];
      records = [];
      checklists.delete(session?.userId ?? '');
      trips.delete(session?.userId ?? '');
      checkins.delete(session?.userId ?? '');
      const avatar = profiles.get(session?.userId ?? '')?.avatar;
      if (avatar) removeAvatar(avatar);
      profiles.delete(session?.userId ?? '');
      if (session && session.username !== GUEST_USERNAME) accounts.delete(session.username);
      setSession(null);
      removePhotos(photos);
    },
  },
  profile: {
    async get() {
      await wait();
      return toProfile(profiles.get(session?.userId ?? ''));
    },
    async update({ nickname, name, avatar }) {
      await wait();
      const userId = session?.userId ?? '';
      const previous = profiles.get(userId);
      let file = previous?.avatar ?? null;
      if (avatar !== undefined) {
        // 상태를 저장한 뒤에 이전 사진을 지워, 저장 전에 앱이 꺼져도 사진이 사라지지 않게 합니다.
        file = avatar
          ? await photoStore.save((await compressPhoto(avatar, AVATAR_EDGE)).uri)
          : null;
      }
      profiles.set(userId, { nickname, name, avatar: file });
      persist();
      if (previous?.avatar && previous.avatar !== file) removeAvatar(previous.avatar);
      return toProfile(profiles.get(userId));
    },
  },
  places: {
    async list() {
      await wait();
      return places.map(withStats);
    },
    async get(id) {
      await wait();
      return findPlace(id);
    },
    async create(input, id) {
      await wait();
      const place: Place = {
        ...input,
        id: id ?? nextId(),
        recordCount: 0,
        lastVisitedAt: null,
        createdAt: new Date().toISOString(),
      };
      places = [place, ...places.filter((item) => item.id !== place.id)];
      persist();
      return place;
    },
    async update(id, input) {
      await wait();
      places = places.map((place) => (place.id === id ? { ...place, ...input } : place));
      records = records.map((record) =>
        record.placeId === id
          ? { ...record, placeName: input.name, placeKind: input.kind }
          : record,
      );
      persist();
      return findPlace(id);
    },
    async remove(id) {
      await wait();
      const photos = records
        .filter((record) => record.placeId === id)
        .flatMap((record) => record.photos);
      places = places.filter((place) => place.id !== id);
      records = records.filter((record) => record.placeId !== id);
      persist();
      removePhotos(photos);
    },
  },
  records: {
    async list(filter) {
      await wait();
      return records
        .filter((record) => !filter?.placeId || record.placeId === filter.placeId)
        .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
    },
    async get(id) {
      await wait();
      return findRecord(id);
    },
    async create(input, id) {
      await wait();
      const record = await toRecord(id ?? nextId(), input);
      records = [record, ...records.filter((item) => item.id !== record.id)];
      persist();
      return record;
    },
    async update(id, input) {
      await wait();
      const record = await toRecord(id, input);
      const kept = new Set(record.photos.map((photo) => photo.id));
      const dropped = findRecord(id).photos.filter((photo) => !kept.has(photo.id));
      records = records.map((item) => (item.id === id ? record : item));
      persist();
      removePhotos(dropped);
      return record;
    },
    async remove(id) {
      await wait();
      const { photos } = findRecord(id);
      records = records.filter((record) => record.id !== id);
      persist();
      removePhotos(photos);
    },
  },
  checklist: {
    async list() {
      await wait();
      return [...myChecklist()].sort((a, b) => a.position - b.position);
    },
    async upsert(items) {
      await wait();
      const ids = new Set(items.map((item) => item.id));
      setMyChecklist([...myChecklist().filter((item) => !ids.has(item.id)), ...items]);
    },
    async remove(ids) {
      await wait();
      setMyChecklist(myChecklist().filter((item) => !ids.includes(item.id)));
    },
  },
  trips: {
    async list() {
      await wait();
      return myTrips();
    },
    async save(trip) {
      await wait();
      setMyTrips([trip, ...myTrips().filter((item) => item.id !== trip.id)]);
      return trip;
    },
    async remove(id) {
      await wait();
      setMyTrips(myTrips().filter((item) => item.id !== id));
    },
  },
  checkins: {
    async list() {
      await wait();
      return myCheckins();
    },
    async create(checkIn) {
      await wait();
      const existing = myCheckins().find((item) => item.catalogId === checkIn.catalogId);
      if (existing) return existing;
      checkins.set(session?.userId ?? '', [...myCheckins(), checkIn]);
      persist();
      return checkIn;
    },
  },
  search: {
    async places(query) {
      await wait();
      const keyword = query.trim();
      return DEMO_SEARCH.filter(
        (item) => item.name.includes(keyword) || item.address.includes(keyword),
      );
    },
    async reverseGeocode(latitude, longitude) {
      await wait();
      return `지도에서 선택한 위치 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    },
  },
};
