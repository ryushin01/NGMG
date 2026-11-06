import { compressPhoto } from '../lib/photo';
import { DEMO_PLACES, DEMO_RECORDS, DEMO_SEARCH } from './demo-data';
import type {
  Backend,
  ChecklistItem,
  Photo,
  Place,
  RecordSaveInput,
  Session,
  TripRecord,
} from './types';

/**
 * Supabase 환경 변수가 없을 때 쓰는 가상 데이터 백엔드입니다.
 * 앱을 끄면 초기화됩니다. 화면 확인, 스크린샷, E2E 테스트에 사용합니다.
 */
let session: Session | null = null;
const listeners = new Set<(session: Session | null) => void>();
const setSession = (next: Session | null) => {
  session = next;
  listeners.forEach((listener) => listener(next));
};

let places: Place[] = [...DEMO_PLACES];
let records: TripRecord[] = [...DEMO_RECORDS];
let sequence = 1000;
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
const checklists = new Map<string, ChecklistItem[]>();
const myChecklist = () => checklists.get(session?.userId ?? '') ?? [];
const setMyChecklist = (items: ChecklistItem[]) => checklists.set(session?.userId ?? '', items);

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
  const added: Photo[] = compressed.map((photo) => ({
    id: nextId(),
    path: photo.uri,
    url: photo.uri,
    width: photo.width,
    height: photo.height,
  }));
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
      places = [];
      records = [];
      checklists.delete(session?.userId ?? '');
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
      return findPlace(id);
    },
    async remove(id) {
      await wait();
      places = places.filter((place) => place.id !== id);
      records = records.filter((record) => record.placeId !== id);
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
      return record;
    },
    async update(id, input) {
      await wait();
      const record = await toRecord(id, input);
      records = records.map((item) => (item.id === id ? record : item));
      return record;
    },
    async remove(id) {
      await wait();
      records = records.filter((record) => record.id !== id);
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
