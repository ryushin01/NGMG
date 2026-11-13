import { isTransientError } from '../lib/errors';
import { isRecord, parseStoredJson } from '../lib/stored-json';
import type {
  Backend,
  ChecklistItem,
  LocalPhoto,
  Photo,
  Place,
  PlaceInput,
  RecordSaveInput,
  Session,
  CheckIn,
  Trip,
  TripRecord,
} from './types';

type QueuedPhoto = { name: string; width: number; height: number };
type QueuedRecord = Omit<RecordSaveInput, 'newPhotos'> & { newPhotos: QueuedPhoto[] };

type OpBody =
  | { type: 'place.create' | 'place.update'; placeId: string; input: PlaceInput }
  | { type: 'place.remove'; placeId: string }
  | { type: 'record.create' | 'record.update'; recordId: string; input: QueuedRecord }
  | { type: 'record.remove'; recordId: string }
  | { type: 'checklist.upsert'; items: ChecklistItem[] }
  | { type: 'checklist.remove'; ids: string[] }
  | { type: 'trip.save'; trip: Trip }
  | { type: 'trip.remove'; tripId: string }
  | { type: 'checkin.create'; checkIn: CheckIn };

export type OutboxOp = OpBody & {
  id: string;
  label: string;
  status: 'pending' | 'failed';
  error?: string;
};

type Snapshot = {
  places: Place[] | null;
  records: TripRecord[] | null;
  checklist: ChecklistItem[] | null;
  trips: Trip[] | null;
  checkins: CheckIn[] | null;
};
type View = {
  places: Place[];
  records: TripRecord[];
  checklist: ChecklistItem[];
  trips: Trip[];
  checkins: CheckIn[];
};

const EMPTY_SNAPSHOT: Snapshot = {
  places: null,
  records: null,
  checklist: null,
  trips: null,
  checkins: null,
};

const QUEUED_PREFIX = 'queued:';
const OFFLINE_ERROR = 'Network request failed';
const READY_TIMEOUT = 5000;

const upsertById = <T extends { id: string }>(list: T[], item: T) =>
  list.some((other) => other.id === item.id)
    ? list.map((other) => (other.id === item.id ? item : other))
    : [item, ...list];

const emptyPlaceStats = { recordCount: 0, lastVisitedAt: null };

/** 통화가 생기기 전에 기기에 저장된 기록은 원화로 봅니다. */
const withCurrency = <T extends { currency?: string }>(record: T) => ({
  ...record,
  currency: record.currency ?? 'KRW',
});

const isString = (value: unknown): value is string => typeof value === 'string';
const hasId = (value: unknown): value is Record<string, unknown> & { id: string } =>
  isRecord(value) && isString(value.id);
const listOf = (value: unknown, check: (item: unknown) => boolean) =>
  Array.isArray(value) && value.every(check);

/** 작업 종류마다 화면 계산(applyOps)과 다시 보내기가 읽는 칸이 있는지 확인합니다. */
const OP_BODY_CHECKS: Record<OpBody['type'], (op: Record<string, unknown>) => boolean> = {
  'place.create': (op) => isString(op.placeId) && isRecord(op.input),
  'place.update': (op) => isString(op.placeId) && isRecord(op.input),
  'place.remove': (op) => isString(op.placeId),
  'record.create': (op) => isString(op.recordId) && isQueuedRecord(op.input),
  'record.update': (op) => isString(op.recordId) && isQueuedRecord(op.input),
  'record.remove': (op) => isString(op.recordId),
  'checklist.upsert': (op) => listOf(op.items, hasId),
  'checklist.remove': (op) => listOf(op.ids, isString),
  'trip.save': (op) => hasId(op.trip),
  'trip.remove': (op) => isString(op.tripId),
  'checkin.create': (op) => isRecord(op.checkIn) && isString(op.checkIn.catalogId),
};

/** 화면 계산(toRecord·정렬)과 사진 정리가 읽는 칸: 기록의 장소·방문일, 새 사진의 파일 이름, 남길 사진의 id·주소 */
function isQueuedRecord(input: unknown) {
  return (
    isRecord(input) &&
    isRecord(input.record) &&
    isString(input.record.placeId) &&
    isString(input.record.visitedAt) &&
    listOf(input.newPhotos, (photo) => isRecord(photo) && isString(photo.name)) &&
    listOf(input.keptPhotos, (photo) => hasId(photo) && isString(photo.url))
  );
}

const isOutboxOp = (op: unknown): op is OutboxOp => {
  if (!isRecord(op) || !isString(op.id) || !isString(op.type)) return false;
  if (op.status !== 'pending' && op.status !== 'failed') return false;
  const check = OP_BODY_CHECKS[op.type as OpBody['type']];
  return Object.hasOwn(OP_BODY_CHECKS, op.type) && check(op);
};

/** 저장된 보낼함에서 읽을 수 있는 작업만 남깁니다. 모양이 다른 작업 하나 때문에 로그인이 막히지 않게 합니다. */
const readOutbox = (raw: string | null): OutboxOp[] => {
  const value = parseStoredJson(raw);
  return Array.isArray(value) ? value.filter(isOutboxOp) : [];
};

/** 칸마다 원소의 모양을 확인합니다. 하나라도 어긋나면 그 칸은 버리고 서버에서 다시 받습니다. */
const SNAPSHOT_ITEM_CHECKS: Record<keyof Snapshot, (item: unknown) => boolean> = {
  places: hasId,
  records: (item) => hasId(item) && isString(item.visitedAt) && isString(item.placeId),
  checklist: hasId,
  trips: hasId,
  checkins: (item) => hasId(item) && isString(item.catalogId),
};

const readSnapshot = (raw: string | null): Snapshot => {
  const value = parseStoredJson(raw);
  if (!isRecord(value)) return EMPTY_SNAPSHOT;
  const list = <T>(key: keyof Snapshot) =>
    listOf(value[key], SNAPSHOT_ITEM_CHECKS[key]) ? (value[key] as T[]) : null;
  return {
    places: list<Place>('places'),
    records: list<TripRecord>('records'),
    checklist: list<ChecklistItem>('checklist'),
    trips: list<Trip>('trips'),
    checkins: list<CheckIn>('checkins'),
  };
};

const withOpCurrency = (op: OutboxOp): OutboxOp =>
  op.type === 'record.create' || op.type === 'record.update'
    ? { ...op, input: { ...op.input, record: withCurrency(op.input.record) } }
    : op;

/**
 * 서버에서 마지막으로 받은 값 위에 아직 올리지 못한 변경을 순서대로 덮어씁니다.
 * 서버 응답에 이미 반영된 변경이 다시 적용되어도 결과가 같아야 합니다.
 */
export const applyOps = (
  snapshot: Snapshot,
  ops: OutboxOp[],
  uriOf: (name: string) => string,
): View => {
  let places = snapshot.places ?? [];
  let records = snapshot.records ?? [];
  let checklist = snapshot.checklist ?? [];
  let trips = snapshot.trips ?? [];
  let checkins = snapshot.checkins ?? [];

  const toRecord = (id: string, input: QueuedRecord): TripRecord => {
    const place = places.find((item) => item.id === input.record.placeId);
    const queued: Photo[] = input.newPhotos.map((photo) => ({
      id: `${QUEUED_PREFIX}${photo.name}`,
      path: `${QUEUED_PREFIX}${photo.name}`,
      url: uriOf(photo.name),
      width: photo.width,
      height: photo.height,
    }));
    return {
      ...input.record,
      id,
      placeName: place?.name ?? '',
      placeKind: place?.kind ?? 'real',
      photos: [...input.keptPhotos, ...queued],
    };
  };

  for (const op of ops) {
    switch (op.type) {
      case 'place.create': {
        const existing = places.find((item) => item.id === op.placeId);
        places = upsertById(places, {
          ...emptyPlaceStats,
          createdAt: new Date().toISOString(),
          ...existing,
          ...op.input,
          id: op.placeId,
        });
        break;
      }
      case 'place.update':
        places = places.map((item) => (item.id === op.placeId ? { ...item, ...op.input } : item));
        records = records.map((item) =>
          item.placeId === op.placeId
            ? { ...item, placeName: op.input.name, placeKind: op.input.kind }
            : item,
        );
        break;
      case 'place.remove':
        places = places.filter((item) => item.id !== op.placeId);
        records = records.filter((item) => item.placeId !== op.placeId);
        break;
      case 'record.create':
      case 'record.update':
        records = upsertById(records, toRecord(op.recordId, op.input));
        break;
      case 'record.remove':
        records = records.filter((item) => item.id !== op.recordId);
        break;
      case 'checklist.upsert':
        for (const item of op.items) checklist = upsertById(checklist, item);
        break;
      case 'checklist.remove':
        checklist = checklist.filter((item) => !op.ids.includes(item.id));
        break;
      case 'trip.save':
        trips = upsertById(trips, op.trip);
        break;
      case 'trip.remove':
        trips = trips.filter((item) => item.id !== op.tripId);
        break;
      case 'checkin.create':
        if (!checkins.some((item) => item.catalogId === op.checkIn.catalogId)) {
          checkins = [...checkins, op.checkIn];
        }
        break;
    }
  }

  const sortedRecords = [...records].sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
  const recountFromRecords = (place: Place) => {
    const own = sortedRecords.filter((record) => record.placeId === place.id);
    return { ...place, recordCount: own.length, lastVisitedAt: own[0]?.visitedAt ?? null };
  };
  // 기록 목록을 받은 적이 없으면 다시 세면 모두 0이 되므로, 서버 값에 새로 만든 기록만 더합니다.
  const addCreatedRecords = (place: Place) => {
    const created = ops.filter(
      (op) => op.type === 'record.create' && op.input.record.placeId === place.id,
    );
    if (created.length === 0) return place;
    const latest = created
      .map((op) => (op.type === 'record.create' ? op.input.record.visitedAt : ''))
      .reduce((a, b) => (a > b ? a : b), place.lastVisitedAt ?? '');
    return {
      ...place,
      recordCount: place.recordCount + created.length,
      lastVisitedAt: latest || null,
    };
  };
  const withStats =
    ops.length === 0
      ? places
      : places.map(snapshot.records === null ? addCreatedRecords : recountFromRecords);
  return {
    places: withStats,
    records: sortedRecords,
    checklist: [...checklist].sort((a, b) => a.position - b.position),
    trips,
    checkins,
  };
};

const opPhotos = (op: OutboxOp) =>
  op.type === 'record.create' || op.type === 'record.update'
    ? op.input.newPhotos.map((photo) => photo.name)
    : [];

export type SyncState = { online: boolean; ops: OutboxOp[] };

type Deps = {
  storage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  };
  photos: {
    save(uri: string): Promise<string>;
    uriOf(name: string): string;
    remove(name: string): void;
  };
  newId: () => string;
};

/**
 * 서버 백엔드를 감싸 연결이 끊겨도 읽고 쓸 수 있게 합니다.
 * 쓰기는 먼저 큐에 넣고 순서대로 보내므로, 오프라인에 만든 장소에 기록을 붙여도 순서가 지켜집니다.
 * 같은 항목을 여러 기기에서 고치면 나중에 도착한 쪽이 남습니다.
 */
export const createOfflineBackend = (base: Backend, deps: Deps) => {
  let userId: string | null = null;
  let online = true;
  let ops: OutboxOp[] = [];
  let snapshot: Snapshot = { ...EMPTY_SNAPSHOT };
  let state: SyncState = { online, ops };
  let running: Promise<void> | null = null;
  const results = new Map<string, { value?: unknown; error?: unknown }>();
  const stateListeners = new Set<() => void>();
  const syncedListeners = new Set<() => void>();

  const outboxKey = () => `newworld.outbox.${userId}`;
  const snapshotKey = () => `newworld.snapshot.${userId}`;

  const publish = () => {
    state = { online, ops };
    stateListeners.forEach((listener) => listener());
  };
  const saveOps = () => {
    if (userId) deps.storage.setItem(outboxKey(), JSON.stringify(ops));
    publish();
  };
  const saveSnapshot = () => {
    if (userId) deps.storage.setItem(snapshotKey(), JSON.stringify(snapshot));
  };
  const view = () => applyOps(snapshot, ops, deps.photos.uriOf);

  const setUser = (session: Session | null) => {
    const next = session?.userId ?? null;
    if (next === userId) return;
    userId = next;
    const read = (key: string) => (userId ? deps.storage.getItem(key) : null);
    ops = readOutbox(read(outboxKey())).map(withOpCurrency);
    const saved = readSnapshot(read(snapshotKey()));
    snapshot = { ...saved, records: saved.records && saved.records.map(withCurrency) };
    publish();
    if (userId) void flush();
  };

  const removeUnusedPhotos = (names: string[]) => {
    const used = new Set(ops.flatMap(opPhotos));
    for (const name of names) {
      if (used.has(name)) continue;
      try {
        deps.photos.remove(name);
      } catch {
        // 파일을 지우지 못해도 동기화 결과에는 영향이 없습니다.
      }
    }
  };

  const toSaveInput = (input: QueuedRecord): RecordSaveInput => ({
    ...input,
    newPhotos: input.newPhotos.map((photo): LocalPhoto => ({
      uri: deps.photos.uriOf(photo.name),
      width: photo.width,
      height: photo.height,
    })),
  });

  const execute = (op: OutboxOp): Promise<unknown> => {
    switch (op.type) {
      case 'place.create':
        return base.places.create(op.input, op.placeId);
      case 'place.update':
        return base.places.update(op.placeId, op.input);
      case 'place.remove':
        return base.places.remove(op.placeId);
      case 'record.create':
        return base.records.create(toSaveInput(op.input), op.recordId);
      case 'record.update':
        return base.records.update(op.recordId, toSaveInput(op.input));
      case 'record.remove':
        return base.records.remove(op.recordId);
      case 'checklist.upsert':
        return base.checklist.upsert(op.items);
      case 'checklist.remove':
        return base.checklist.remove(op.ids);
      case 'trip.save':
        return base.trips.save(op.trip);
      case 'trip.remove':
        return base.trips.remove(op.tripId);
      case 'checkin.create':
        return base.checkins.create(op.checkIn);
    }
  };

  /** 보낸 변경을 마지막 서버 값에 합쳐, 다음 조회 전에 끊겨도 내용이 사라지지 않게 합니다. */
  const mergeSent = (op: OutboxOp, value: unknown) => {
    switch (op.type) {
      case 'place.create':
      case 'place.update':
        if (snapshot.places) snapshot.places = upsertById(snapshot.places, value as Place);
        break;
      case 'record.create':
      case 'record.update':
        if (snapshot.records) snapshot.records = upsertById(snapshot.records, value as TripRecord);
        break;
      default: {
        const applied = applyOps(snapshot, [op], deps.photos.uriOf);
        // 기록 목록이 있으면 applyOps가 다시 센 값(기록 삭제 반영)을 쓰고,
        // 없으면 다시 센 값이 틀리므로 남은 장소는 서버가 준 값을 그대로 둡니다.
        const kept = new Set(applied.places.map((place) => place.id));
        snapshot = {
          places:
            snapshot.places &&
            (snapshot.records
              ? applied.places
              : snapshot.places.filter((place) => kept.has(place.id))),
          records: snapshot.records && applied.records,
          checklist: applied.checklist,
          trips: snapshot.trips && applied.trips,
          checkins: snapshot.checkins && applied.checkins,
        };
      }
    }
    saveSnapshot();
  };

  const canReachServer = async (force = false) => {
    if (!online && !force) return false;
    try {
      // 토큰 갱신은 서버에 닿지 않으면 오래 재시도하므로 화면을 기다리게 하지 않습니다.
      return await Promise.race([
        base.auth.isReady(),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), READY_TIMEOUT)),
      ]);
    } catch {
      return false;
    }
  };

  const runFlush = async (force: boolean) => {
    let sent = 0;
    while ((online || force) && userId) {
      const next = ops.find((op) => op.status === 'pending');
      if (!next) break;
      if (!(await canReachServer(force))) break;
      try {
        const value = await execute(next);
        // 서버에 닿았으므로 연결 상태 보고가 틀렸던 것입니다. 다음 이벤트를 기다리지 않고 바로잡습니다.
        online = true;
        ops = ops.filter((op) => op.id !== next.id);
        mergeSent(next, value);
        results.set(next.id, { value });
        removeUnusedPhotos(opPhotos(next));
        sent += 1;
        saveOps();
      } catch (error) {
        if (isTransientError(error)) break;
        const message = error instanceof Error ? error.message : String(error);
        ops = ops.map((op) =>
          op.id === next.id ? { ...op, status: 'failed' as const, error: message } : op,
        );
        results.set(next.id, { error });
        saveOps();
      }
    }
    if (sent > 0) syncedListeners.forEach((listener) => listener());
  };

  /**
   * force는 기기의 연결 상태 보고를 믿지 않고 실제로 보내 봅니다.
   * 보고가 잘못되어 오프라인으로 남으면 연결 변화 이벤트가 올 때까지 동기화가 멈추기 때문입니다.
   * 실패해도 변경은 대기로 남으므로 손해가 없습니다.
   */
  const flush = async ({ force = false }: { force?: boolean } = {}) => {
    while (running) await running;
    running = runFlush(force).finally(() => {
      running = null;
    });
    return running;
  };

  /**
   * 연결되어 있으면 바로 보내 결과를 돌려주고, 끊겨 있으면 큐에 두고 화면용 값을 돌려줍니다.
   * 서버가 거절한 저장은 입력 화면에서 고칠 수 있도록 큐에서 빼고 오류를 던집니다.
   */
  const write = async <T>(body: OpBody, label: string, local: () => T): Promise<T> => {
    const id = deps.newId();
    ops = [...ops, { ...body, id, label, status: 'pending' } as OutboxOp];
    saveOps();
    await flush();
    const result = results.get(id);
    results.delete(id);
    if (result && 'error' in result) {
      const failed = ops.find((op) => op.id === id);
      ops = ops.filter((op) => op.id !== id);
      saveOps();
      if (failed) removeUnusedPhotos(opPhotos(failed));
      throw result.error;
    }
    return result ? (result.value as T) : local();
  };

  /** 서버에서 새 값을 받되, 끊겨 있으면 마지막 값을 그대로 씁니다. */
  const refresh = async (key: keyof Snapshot, fetcher: () => Promise<unknown>) => {
    if (await canReachServer()) {
      try {
        const fresh = await fetcher();
        snapshot = { ...snapshot, [key]: fresh };
        saveSnapshot();
        return;
      } catch (error) {
        if (!isTransientError(error)) throw error;
        if (snapshot[key] === null && ops.length === 0) throw error;
        return;
      }
    }
    if (snapshot[key] === null && ops.length === 0) throw new TypeError(OFFLINE_ERROR);
  };

  const toQueuedRecord = async (input: RecordSaveInput): Promise<QueuedRecord> => {
    const saved = await Promise.all(
      input.newPhotos.map(async (photo): Promise<QueuedPhoto> => ({
        name: await deps.photos.save(photo.uri),
        width: photo.width,
        height: photo.height,
      })),
    );
    // 아직 올라가지 않은 사진을 다시 고른 경우: 새 사진으로 다시 보냅니다.
    const requeued = input.keptPhotos
      .filter((photo) => photo.id.startsWith(QUEUED_PREFIX))
      .map((photo) => ({
        name: photo.id.slice(QUEUED_PREFIX.length),
        width: photo.width,
        height: photo.height,
      }));
    return {
      record: input.record,
      keptPhotos: input.keptPhotos.filter((photo) => !photo.id.startsWith(QUEUED_PREFIX)),
      newPhotos: [...requeued, ...saved],
    };
  };

  const notFound = (subject: string) => new Error(`${subject}을(를) 찾을 수 없습니다.`);

  const backend: Backend = {
    mode: base.mode,
    auth: {
      ...base.auth,
      getCachedSession() {
        const session = base.auth.getCachedSession();
        if (session) setUser(session);
        return session;
      },
      async getSession() {
        const session = await base.auth.getSession();
        setUser(session);
        return session;
      },
      subscribe: (listener) =>
        base.auth.subscribe((session) => {
          setUser(session);
          listener(session);
        }),
      async signOut() {
        await base.auth.signOut();
        // 올리지 못한 변경은 다시 로그인할 때 이어서 보내도록 남기고, 서버 사본만 지웁니다.
        if (userId) deps.storage.removeItem(snapshotKey());
        setUser(null);
      },
      async deleteAccount() {
        await base.auth.deleteAccount();
        const names = ops.flatMap(opPhotos);
        if (userId) {
          deps.storage.removeItem(outboxKey());
          deps.storage.removeItem(snapshotKey());
        }
        ops = [];
        removeUnusedPhotos(names);
        userId = null;
        snapshot = { ...EMPTY_SNAPSHOT };
        publish();
      },
    },
    places: {
      async list() {
        await refresh('places', () => base.places.list());
        return view().places;
      },
      async get(id) {
        const local = () => view().places.find((place) => place.id === id);
        if (ops.length > 0 && local()) return local() as Place;
        if (await canReachServer()) {
          try {
            const fresh = await base.places.get(id);
            // 목록을 받은 적이 없으면 한 건만 든 목록을 만들지 않습니다(전체 목록으로 오인).
            if (snapshot.places) snapshot.places = upsertById(snapshot.places, fresh);
            saveSnapshot();
            return fresh;
          } catch (error) {
            if (!isTransientError(error)) throw error;
          }
        }
        const found = local();
        if (!found) throw notFound('장소');
        return found;
      },
      create(input) {
        const placeId = deps.newId();
        return write(
          { type: 'place.create', placeId, input },
          `장소 추가: ${input.name}`,
          () => view().places.find((place) => place.id === placeId) as Place,
        );
      },
      update(id, input) {
        return write(
          { type: 'place.update', placeId: id, input },
          `장소 수정: ${input.name}`,
          () => view().places.find((place) => place.id === id) as Place,
        );
      },
      async remove(id) {
        const name = view().places.find((place) => place.id === id)?.name ?? '';
        await write({ type: 'place.remove', placeId: id }, `장소 삭제: ${name}`, () => undefined);
      },
    },
    records: {
      async list(filter) {
        await refresh('records', () => base.records.list());
        const all = view().records;
        return filter?.placeId ? all.filter((record) => record.placeId === filter.placeId) : all;
      },
      async get(id) {
        const local = () => view().records.find((record) => record.id === id);
        if (ops.length > 0 && local()) return local() as TripRecord;
        if (await canReachServer()) {
          try {
            const fresh = await base.records.get(id);
            if (snapshot.records) snapshot.records = upsertById(snapshot.records, fresh);
            saveSnapshot();
            return fresh;
          } catch (error) {
            if (!isTransientError(error)) throw error;
          }
        }
        const found = local();
        if (!found) throw notFound('기록');
        return found;
      },
      async create(input) {
        const recordId = deps.newId();
        return write(
          { type: 'record.create', recordId, input: await toQueuedRecord(input) },
          `기록 추가: ${input.record.title || '제목 없음'}`,
          () => view().records.find((record) => record.id === recordId) as TripRecord,
        );
      },
      async update(id, input) {
        return write(
          { type: 'record.update', recordId: id, input: await toQueuedRecord(input) },
          `기록 수정: ${input.record.title || '제목 없음'}`,
          () => view().records.find((record) => record.id === id) as TripRecord,
        );
      },
      async remove(id) {
        const title = view().records.find((record) => record.id === id)?.title;
        await write(
          { type: 'record.remove', recordId: id },
          `기록 삭제: ${title || '제목 없음'}`,
          () => undefined,
        );
      },
    },
    checklist: {
      async list() {
        await refresh('checklist', () => base.checklist.list());
        return view().checklist;
      },
      async upsert(items) {
        const label =
          items.length === 1
            ? `체크리스트: ${items[0].title}`
            : `체크리스트 ${items.length}개 항목`;
        await write({ type: 'checklist.upsert', items }, label, () => undefined);
      },
      async remove(ids) {
        await write(
          { type: 'checklist.remove', ids },
          `체크리스트 ${ids.length}개 삭제`,
          () => undefined,
        );
      },
    },
    trips: {
      async list() {
        await refresh('trips', () => base.trips.list());
        return view().trips;
      },
      save(trip) {
        return write({ type: 'trip.save', trip }, `여정 저장: ${trip.title}`, () => trip);
      },
      async remove(id) {
        const title = view().trips.find((trip) => trip.id === id)?.title ?? '';
        await write({ type: 'trip.remove', tripId: id }, `여정 삭제: ${title}`, () => undefined);
      },
    },
    checkins: {
      async list() {
        await refresh('checkins', () => base.checkins.list());
        return view().checkins;
      },
      create(checkIn) {
        const existing = view().checkins.find((item) => item.catalogId === checkIn.catalogId);
        if (existing) return Promise.resolve(existing);
        return write({ type: 'checkin.create', checkIn }, '현장 인증', () => checkIn);
      },
    },
    // 프로필은 사진을 올려야 해서 큐에 쌓지 않고 바로 보냅니다.
    profile: base.profile,
    search: base.search,
  };

  const sync = {
    getState: () => state,
    /** 서버에서 전체 목록을 한 번이라도 받아 두었는지. 내보내기가 빠진 자료 없이 만들 수 있는지 확인합니다. */
    hasSnapshot: (keys: (keyof Snapshot)[]) => keys.every((key) => snapshot[key] !== null),
    subscribe(listener: () => void) {
      stateListeners.add(listener);
      return () => {
        stateListeners.delete(listener);
      };
    },
    /** 큐를 비운 뒤 한 건 이상 올렸으면 호출됩니다. */
    onSynced(listener: () => void) {
      syncedListeners.add(listener);
      return () => {
        syncedListeners.delete(listener);
      };
    },
    setOnline(next: boolean) {
      if (next === online) return;
      online = next;
      publish();
      if (online) void flush();
    },
    flush,
    retry(id: string) {
      ops = ops.map((op) =>
        op.id === id ? { ...op, status: 'pending' as const, error: undefined } : op,
      );
      saveOps();
      return flush({ force: true });
    },
    discard(id: string) {
      const target = ops.find((op) => op.id === id);
      ops = ops.filter((op) => op.id !== id);
      saveOps();
      if (target) removeUnusedPhotos(opPhotos(target));
    },
  };

  return { backend, sync };
};
