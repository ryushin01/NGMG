import { createOfflineBackend } from './offline-backend';
import type { Backend, Place, RecordInput, Session, TripRecord } from './types';

const netError = () => new TypeError('Network request failed');

const setup = () => {
  const server = {
    places: [] as Place[],
    records: [] as TripRecord[],
    checklist: [] as import('./types').ChecklistItem[],
    trips: [] as import('./types').Trip[],
    down: false,
    tokenBroken: false,
    rejectNext: false,
    calls: [] as string[],
  };
  const guard = (name: string) => {
    if (server.down) throw netError();
    if (server.rejectNext) {
      server.rejectNext = false;
      throw Object.assign(new Error('rejected'), { code: '23514' });
    }
    server.calls.push(name);
  };
  let authListener: (session: Session | null) => void = () => undefined;
  const base = {
    mode: 'demo',
    auth: {
      getCachedSession: () => null,
      getSession: async () => null,
      isReady: async () => !server.tokenBroken,
      subscribe(listener: (session: Session | null) => void) {
        authListener = listener;
        return () => undefined;
      },
      signOut: async () => undefined,
      deleteAccount: async () => undefined,
    },
    places: {
      list: async () => {
        guard('places.list');
        return server.places;
      },
      get: async (id: string) => {
        guard('places.get');
        return server.places.find((place) => place.id === id) as Place;
      },
      create: async (input: Omit<Place, 'id'>, id: string) => {
        guard('places.create');
        const place = { ...input, id, recordCount: 0, lastVisitedAt: null, createdAt: 'now' };
        server.places = [place as Place, ...server.places.filter((item) => item.id !== id)];
        return place;
      },
      update: jest.fn(),
      remove: async (id: string) => {
        guard('places.remove');
        server.places = server.places.filter((place) => place.id !== id);
      },
    },
    records: {
      list: async () => {
        guard('records.list');
        return server.records;
      },
      get: async (id: string) => {
        guard('records.get');
        return server.records.find((record) => record.id === id);
      },
      create: async (input: { record: RecordInput; newPhotos: { uri: string }[] }, id: string) => {
        guard('records.create');
        const record = {
          ...input.record,
          id,
          placeName: '',
          placeKind: 'real',
          photos: input.newPhotos.map((photo) => ({ id: photo.uri, url: photo.uri })),
        } as unknown as TripRecord;
        server.records = [record, ...server.records];
        return record;
      },
      update: jest.fn(),
      remove: jest.fn(),
    },
    trips: {
      list: async () => {
        guard('trips.list');
        return server.trips;
      },
      save: async (trip: import('./types').Trip) => {
        guard('trips.save');
        server.trips = [trip, ...server.trips.filter((item) => item.id !== trip.id)];
        return trip;
      },
      remove: async (id: string) => {
        guard('trips.remove');
        server.trips = server.trips.filter((item) => item.id !== id);
      },
    },
    checklist: {
      list: async () => {
        guard('checklist.list');
        return server.checklist;
      },
      upsert: async (items: import('./types').ChecklistItem[]) => {
        guard('checklist.upsert');
        const ids = items.map((item) => item.id);
        server.checklist = [...server.checklist.filter((item) => !ids.includes(item.id)), ...items];
      },
      remove: async (ids: string[]) => {
        guard('checklist.remove');
        server.checklist = server.checklist.filter((item) => !ids.includes(item.id));
      },
    },
    search: {},
  } as unknown as Backend;

  const store = new Map<string, string>();
  const removedPhotos: string[] = [];
  let sequence = 0;
  const deps = {
    storage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
    photos: {
      save: async (uri: string) => `saved-${uri}`,
      uriOf: (name: string) => `file:///outbox/${name}`,
      remove: (name: string) => void removedPhotos.push(name),
    },
    newId: () => `id-${(sequence += 1)}`,
  };
  const api = createOfflineBackend(base, deps);
  api.backend.auth.subscribe(() => undefined);
  const signInAs = (userId: string) => authListener({ userId, email: `${userId}@x` });
  return {
    ...api,
    server,
    store,
    removedPhotos,
    signInAs,
    authOut: () => authListener(null),
    deps,
    base,
  };
};

const placeInput = {
  name: '마추픽추',
  kind: 'real' as const,
  address: '',
  latitude: 34,
  longitude: 127,
  memo: '',
  tags: [],
  catalogId: null,
  wishlisted: false,
};

const recordInput = (placeId: string, title: string): RecordInput => ({
  placeId,
  visitedAt: '2026-11-01T00:00:00.000Z',
  title,
  memo: '',
  partySize: null,
  members: [],
  rating: null,
  weather: '',
  temperature: null,
  transport: '',
  lodging: '',
  cost: null,
  currency: 'KRW',
  highlights: '',
  gateway: '',
  encounters: '',
  souvenir: '',
});

describe('연결된 상태', () => {
  it('바로 서버에 저장하고 큐를 남기지 않습니다', async () => {
    const { backend, sync, server, signInAs } = setup();
    signInAs('a');
    const place = await backend.places.create(placeInput);
    expect(server.places).toHaveLength(1);
    expect(place.id).toBe(server.places[0].id);
    expect(sync.getState().ops).toEqual([]);
  });

  it('서버가 거절하면 오류를 던지고 큐에 남기지 않습니다', async () => {
    const { backend, sync, server, signInAs } = setup();
    signInAs('a');
    server.rejectNext = true;
    await expect(backend.places.create(placeInput)).rejects.toThrow('rejected');
    expect(sync.getState().ops).toEqual([]);
  });
});

describe('끊긴 상태', () => {
  it('장소와 그 장소의 기록을 만들고, 복구되면 순서대로 올립니다', async () => {
    const { backend, sync, server, signInAs, removedPhotos } = setup();
    signInAs('a');
    server.down = true;

    const place = await backend.places.create(placeInput);
    const record = await backend.records.create({
      record: recordInput(place.id, '오프라인 여행'),
      keptPhotos: [],
      newPhotos: [{ uri: 'tmp/a.jpg', width: 10, height: 10 }],
    });

    expect(sync.getState().ops).toHaveLength(2);
    expect(record.photos[0].url).toBe('file:///outbox/saved-tmp/a.jpg');
    expect(await backend.places.get(place.id)).toMatchObject({ recordCount: 1 });
    expect((await backend.records.list({ placeId: place.id })).map((r) => r.title)).toEqual([
      '오프라인 여행',
    ]);

    const synced = jest.fn();
    sync.onSynced(synced);
    server.down = false;
    await sync.flush();

    expect(server.calls.filter((call) => call.includes('create'))).toEqual([
      'places.create',
      'records.create',
    ]);
    expect(server.records[0].id).toBe(record.id);
    expect(sync.getState().ops).toEqual([]);
    expect(synced).toHaveBeenCalledTimes(1);
    expect(removedPhotos).toEqual(['saved-tmp/a.jpg']);
    expect((await backend.records.get(record.id)).title).toBe('오프라인 여행');
  });

  it('마지막으로 받은 목록을 보여 주고, 받은 적이 없으면 오류입니다', async () => {
    const { backend, server, signInAs } = setup();
    signInAs('a');
    server.down = true;
    await expect(backend.places.list()).rejects.toThrow('Network');
    server.down = false;
    await backend.places.create(placeInput);
    await backend.places.list();
    server.down = true;
    expect(await backend.places.list()).toHaveLength(1);
  });

  it('서버에 있는 항목을 지우면 화면에서 바로 사라집니다', async () => {
    const { backend, sync, server, signInAs } = setup();
    signInAs('a');
    const place = await backend.places.create(placeInput);
    await backend.places.list();
    server.down = true;
    await backend.places.remove(place.id);
    expect(await backend.places.list()).toEqual([]);
    server.down = false;
    await sync.flush();
    expect(server.places).toEqual([]);
  });

  it('올라가지 않은 사진을 유지한 채 수정하면 새 사진으로 다시 보냅니다', async () => {
    const { backend, sync, server, signInAs } = setup();
    signInAs('a');
    const place = await backend.places.create(placeInput);
    server.down = true;
    const record = await backend.records.create({
      record: recordInput(place.id, 'x'),
      keptPhotos: [],
      newPhotos: [{ uri: 'a', width: 1, height: 1 }],
    });
    await backend.records.update(record.id, {
      record: recordInput(place.id, 'y'),
      keptPhotos: record.photos,
      newPhotos: [],
    });
    const op = sync.getState().ops[1] as { input: { keptPhotos: unknown[]; newPhotos: unknown[] } };
    expect(op.input.keptPhotos).toEqual([]);
    expect(op.input.newPhotos).toEqual([{ name: 'saved-a', width: 1, height: 1 }]);
  });

  it('백그라운드 전송에서 서버가 거절한 항목은 실패로 남고 다음 항목은 계속 보냅니다', async () => {
    const { backend, sync, server, signInAs } = setup();
    signInAs('a');
    server.down = true;
    await backend.places.create(placeInput);
    await backend.places.create({ ...placeInput, name: '둘째' });
    server.down = false;
    server.rejectNext = true;
    await sync.flush();
    const [failed] = sync.getState().ops;
    expect(sync.getState().ops).toHaveLength(1);
    expect(failed.status).toBe('failed');
    expect(server.places.map((place) => place.name)).toEqual(['둘째']);
    await sync.retry(failed.id);
    expect(sync.getState().ops).toEqual([]);
  });

  it('포기한 항목은 큐와 사진에서 지웁니다', async () => {
    const { backend, sync, server, signInAs, removedPhotos } = setup();
    signInAs('a');
    const place = await backend.places.create(placeInput);
    server.down = true;
    await backend.records.create({
      record: recordInput(place.id, 'x'),
      keptPhotos: [],
      newPhotos: [{ uri: 'a', width: 1, height: 1 }],
    });
    sync.discard(sync.getState().ops[0].id);
    expect(sync.getState().ops).toEqual([]);
    expect(removedPhotos).toEqual(['saved-a']);
  });
});

describe('토큰을 갱신하지 못한 상태', () => {
  it('익명 요청을 보내지 않아 변경은 대기로 남고 저장본은 비지 않습니다', async () => {
    const { backend, sync, server, signInAs } = setup();
    signInAs('a');
    await backend.places.create(placeInput);
    await backend.places.list();
    const callsBefore = server.calls.length;
    server.tokenBroken = true;

    await backend.places.create({ ...placeInput, name: '둘째' });
    expect(sync.getState().ops.map((op) => op.status)).toEqual(['pending']);
    expect(await backend.places.list()).toHaveLength(2);
    expect(server.calls).toHaveLength(callsBefore);

    server.tokenBroken = false;
    await sync.flush();
    expect(sync.getState().ops).toEqual([]);
    expect(server.places).toHaveLength(2);
  });
});

describe('연결 상태 보고가 틀린 경우', () => {
  it('오프라인 보고 중에도 강제 전송은 서버에 닿으면 올리고 상태를 바로잡습니다', async () => {
    const { backend, sync, server, signInAs } = setup();
    signInAs('a');
    sync.setOnline(false);
    await backend.places.create(placeInput);
    expect(sync.getState().ops).toHaveLength(1);
    expect(server.places).toEqual([]);

    await sync.flush();
    expect(server.places).toEqual([]);

    await sync.flush({ force: true });
    expect(server.places).toHaveLength(1);
    expect(sync.getState().ops).toEqual([]);
    expect(sync.getState().online).toBe(true);
  });

  it('실제로 끊겨 있으면 강제 전송도 변경을 대기로 남깁니다', async () => {
    const { backend, sync, server, signInAs } = setup();
    signInAs('a');
    server.down = true;
    sync.setOnline(false);
    await backend.places.create(placeInput);
    await sync.flush({ force: true });
    expect(sync.getState().ops.map((op) => op.status)).toEqual(['pending']);
    expect(sync.getState().online).toBe(false);
  });
});

describe('계정 분리', () => {
  it('대기 변경과 체크리스트는 계정별로 따로 보관됩니다', async () => {
    const { backend, sync, server, signInAs, authOut } = setup();
    signInAs('a');
    server.down = true;
    const item = {
      id: 'c1',
      title: '구명조끼',
      category: '안전',
      checked: false,
      position: 0,
      listName: '기본',
    };
    await backend.checklist.upsert([item]);
    expect(await backend.checklist.list()).toEqual([item]);

    authOut();
    signInAs('b');
    expect(sync.getState().ops).toEqual([]);
    await expect(backend.checklist.list()).rejects.toThrow('Network');

    authOut();
    server.down = false;
    signInAs('a');
    await sync.flush();
    expect(server.checklist).toEqual([item]);
  });

  it('로그아웃하면 서버 사본은 지우고 올리지 못한 변경은 남깁니다', async () => {
    const { backend, store, server, signInAs } = setup();
    signInAs('a');
    await backend.places.create(placeInput);
    server.down = true;
    await backend.places.create({ ...placeInput, name: '둘째' });
    await backend.auth.signOut();
    expect(store.has('newworld.snapshot.a')).toBe(false);
    expect(JSON.parse(store.get('newworld.outbox.a') as string)).toHaveLength(1);
  });
});

describe('체크리스트', () => {
  it('체크 상태를 끊긴 채로 바꾸고 복구되면 서버에 반영합니다', async () => {
    const { backend, sync, server, signInAs } = setup();
    signInAs('a');
    const item = {
      id: 'c1',
      title: '릴',
      category: '장비',
      checked: false,
      position: 0,
      listName: '기본',
    };
    await backend.checklist.upsert([item]);
    server.down = true;
    await backend.checklist.upsert([{ ...item, checked: true }]);
    expect((await backend.checklist.list())[0].checked).toBe(true);
    server.down = false;
    await sync.flush();
    expect(server.checklist[0].checked).toBe(true);
  });
});

describe('여정', () => {
  const trip = {
    id: 't1',
    title: '코스',
    startDate: null,
    endDate: null,
    stops: ['petra'],
    memo: '',
  };

  it('끊긴 동안 저장한 여정을 보여 주고 연결되면 올립니다', async () => {
    const { backend, sync, server, signInAs } = setup();
    signInAs('a');
    await backend.trips.list();
    sync.setOnline(false);
    await backend.trips.save(trip);
    expect(await backend.trips.list()).toEqual([trip]);
    expect(server.trips).toEqual([]);
    sync.setOnline(true);
    await sync.flush();
    expect(server.trips).toEqual([trip]);
    expect(sync.getState().ops).toEqual([]);
  });

  it('끊긴 동안 지운 여정은 연결되면 서버에서도 지웁니다', async () => {
    const { backend, sync, server, signInAs } = setup();
    signInAs('a');
    await backend.trips.save(trip);
    await backend.trips.list();
    sync.setOnline(false);
    await backend.trips.remove(trip.id);
    expect(await backend.trips.list()).toEqual([]);
    sync.setOnline(true);
    await sync.flush();
    expect(server.trips).toEqual([]);
  });
});
