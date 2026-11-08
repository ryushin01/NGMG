import { compressPhoto, photoStore } from '../lib/photo';
import { storageAdapter } from '../lib/storage';
import { DEMO_PLACES, DEMO_RECORDS, DEMO_SEARCH } from './demo-data';
import type {
  Backend,
  ChecklistItem,
  Photo,
  Place,
  RecordSaveInput,
  Session,
  Trip,
  TripRecord,
} from './types';

/**
 * Supabase 환경 변수가 없을 때 쓰는 가상 데이터 백엔드입니다.
 * 서버 없이 앱을 체험할 수 있도록 변경 내용을 이 기기에 저장합니다.
 */
const STATE_KEY = 'newworld.demo.state';
const PHOTO_PREFIX = 'demo-photo:';

type DemoState = {
  session: Session | null;
  places: Place[];
  records: TripRecord[];
  checklists: [string, ChecklistItem[]][];
  trips: [string, Trip[]][];
  sequence: number;
};

/** iOS는 앱 업데이트 때 컨테이너 경로가 바뀌므로 저장한 파일 이름으로 주소를 다시 만듭니다. */
const withPhotoUrls = (record: TripRecord): TripRecord => ({
  ...record,
  photos: record.photos.map((photo) =>
    photo.path.startsWith(PHOTO_PREFIX)
      ? { ...photo, url: photoStore.uriOf(photo.path.slice(PHOTO_PREFIX.length)) }
      : photo,
  ),
});

const loadState = (): Partial<DemoState> => {
  try {
    return JSON.parse(storageAdapter.getItem(STATE_KEY) ?? '{}') as Partial<DemoState>;
  } catch {
    return {};
  }
};

const saved = loadState();

let session: Session | null = saved.session ?? null;
const listeners = new Set<(session: Session | null) => void>();
const persist = () => {
  const state: DemoState = {
    session,
    places,
    records,
    checklists: [...checklists],
    trips: [...trips],
    sequence,
  };
  storageAdapter.setItem(STATE_KEY, JSON.stringify(state));
};

const setSession = (next: Session | null) => {
  session = next;
  persist();
  listeners.forEach((listener) => listener(next));
};

let places: Place[] = saved.places ?? [...DEMO_PLACES];
let records: TripRecord[] = (saved.records ?? [...DEMO_RECORDS]).map(withPhotoUrls);
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
const myTrips = () => trips.get(session?.userId ?? '') ?? [];
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
  const compressed = await Promise.all(input.newPhotos.map(compressPhoto));
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
    async signIn(email) {
      await wait();
      setSession({ userId: `demo-${email}`, email });
    },
    async signUp(email) {
      await wait();
      setSession({ userId: `demo-${email}`, email });
      return { needsConfirmation: false };
    },
    async signOut() {
      setSession(null);
    },
    async sendPasswordReset() {
      await wait();
    },
    applyRecoveryLink: async () => false,
    async updatePassword() {
      await wait();
    },
    async deleteAccount() {
      // 데모는 계정이 없으므로 처음 예시 데이터로 되돌립니다.
      records.forEach((record) => removePhotos(record.photos));
      places = [...DEMO_PLACES];
      records = [...DEMO_RECORDS];
      checklists.delete(session?.userId ?? '');
      trips.delete(session?.userId ?? '');
      setSession(null);
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
      records.filter((record) => record.placeId === id).forEach((r) => removePhotos(r.photos));
      places = places.filter((place) => place.id !== id);
      records = records.filter((record) => record.placeId !== id);
      persist();
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
      removePhotos(findRecord(id).photos.filter((photo) => !kept.has(photo.id)));
      records = records.map((item) => (item.id === id ? record : item));
      persist();
      return record;
    },
    async remove(id) {
      await wait();
      removePhotos(findRecord(id).photos);
      records = records.filter((record) => record.id !== id);
      persist();
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
