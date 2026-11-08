import type { Backend, PlaceInput } from './types';

const mockValues = new Map<string, string>();

jest.mock('../lib/storage', () => ({
  storageAdapter: {
    getItem: (key: string) => mockValues.get(key) ?? null,
    setItem: (key: string, value: string) => mockValues.set(key, value),
    removeItem: (key: string) => mockValues.delete(key),
  },
}));

jest.mock('../lib/photo', () => ({
  compressPhoto: jest.fn(async () => ({ uri: 'file:///cache/a.jpg', width: 10, height: 10 })),
  photoStore: {
    save: jest.fn(async () => 'saved.jpg'),
    uriOf: (name: string) => `file:///container-${(global as never as { c: string }).c}/${name}`,
    remove: jest.fn(),
  },
}));

/** 앱을 다시 켠 것처럼 모듈을 새로 불러옵니다. */
const relaunch = () => {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- 모듈을 새로 불러와 재시작을 흉내 냅니다.
  return (require('./demo-backend') as { demoBackend: Backend }).demoBackend;
};

const input: PlaceInput = {
  name: '내 유적',
  kind: 'real',
  address: '',
  latitude: 1,
  longitude: 2,
  memo: '',
  tags: [],
  catalogId: null,
  wishlisted: false,
};

const record = (placeId: string) => ({
  placeId,
  visitedAt: '2026-11-01T00:00:00.000Z',
  title: '사진 기록',
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

beforeEach(() => {
  mockValues.clear();
  (global as never as { c: string }).c = 'one';
});

it('앱을 다시 켜도 로그인, 장소, 여정, 체크리스트가 남습니다', async () => {
  const api = relaunch();
  await api.auth.signIn('guest@newworld.demo', 'demo');
  const place = await api.places.create(input);
  const trip = { id: 't', title: '코스', startDate: null, endDate: null, stops: [], memo: '' };
  await api.trips.save(trip);
  const item = {
    id: 'c',
    title: '여권',
    category: '기타',
    checked: true,
    position: 0,
    listName: '기본',
  };
  await api.checklist.upsert([item]);

  const next = relaunch();
  expect(next.auth.getCachedSession()?.email).toBe('guest@newworld.demo');
  expect((await next.places.get(place.id)).name).toBe('내 유적');
  expect(await next.trips.list()).toEqual([trip]);
  expect(await next.checklist.list()).toEqual([item]);
});

it('다시 켜면 사진 주소를 현재 앱 폴더 기준으로 만듭니다', async () => {
  const api = relaunch();
  const place = await api.places.create(input);
  const saved = await api.records.create({
    record: record(place.id),
    keptPhotos: [],
    newPhotos: [{ uri: 'file:///a.jpg', width: 10, height: 10 }],
  });
  expect(saved.photos[0].url).toBe('file:///container-one/saved.jpg');

  (global as never as { c: string }).c = 'two';
  const next = relaunch();
  expect((await next.records.get(saved.id)).photos[0].url).toBe('file:///container-two/saved.jpg');
});

it('저장값이 깨졌으면 예시 데이터로 시작합니다', async () => {
  mockValues.set('newworld.demo.state', '{깨진 값');
  expect((await relaunch().places.list()).length).toBeGreaterThan(0);
});

it.each(['null', '3', '[]', '{"records":1,"checklists":2,"trips":"x","session":5}'])(
  '형식이 틀린 저장값(%s)이어도 예시 데이터로 시작합니다',
  async (value) => {
    mockValues.set('newworld.demo.state', value);
    const api = relaunch();
    expect(api.auth.getCachedSession()).toBeNull();
    expect((await api.places.list()).length).toBeGreaterThan(0);
    expect((await api.records.list()).length).toBeGreaterThan(0);
  },
);

it('배열 안의 잘못된 항목만 버리고 시작합니다', async () => {
  mockValues.set(
    'newworld.demo.state',
    JSON.stringify({
      places: [1, { id: 'p', name: '남은 장소' }],
      records: [
        { id: 'r1', photos: [] },
        { id: 'r2', visitedAt: '2026-01-01', photos: [1] },
        { id: 'r3', visitedAt: '2026-01-01', photos: [] },
      ],
      checklists: [1, ['a'], ['a', [1]], ['guest', [{ id: 'c' }]]],
      trips: [null, ['guest', 'x']],
    }),
  );
  const api = relaunch();
  expect((await api.places.list()).map((place) => place.id)).toEqual(['p']);
  expect((await api.records.list()).map((item) => item.id)).toEqual(['r3']);
  expect(await api.trips.list()).toEqual([]);
});

it('상태를 저장한 뒤에 사진 파일을 지웁니다', async () => {
  const api = relaunch();
  const place = await api.places.create(input);
  const saved = await api.records.create({
    record: record(place.id),
    keptPhotos: [],
    newPhotos: [{ uri: 'file:///a.jpg', width: 10, height: 10 }],
  });
  const { photoStore } = jest.requireMock('../lib/photo') as {
    photoStore: { remove: jest.Mock };
  };
  photoStore.remove.mockClear();
  // 삭제 코드가 예외를 삼키므로 그 시점의 저장값을 기록해 두고 밖에서 검증합니다.
  let storedAtRemoval = '';
  photoStore.remove.mockImplementation(() => {
    storedAtRemoval = mockValues.get('newworld.demo.state') as string;
  });
  await api.records.remove(saved.id);
  expect(photoStore.remove).toHaveBeenCalledTimes(1);
  const state = JSON.parse(storedAtRemoval) as { records: { id: string }[] };
  expect(state.records.map((item) => item.id)).not.toContain(saved.id);
});

it('계정 삭제는 예시 데이터로 되돌립니다', async () => {
  const api = relaunch();
  await api.auth.signIn('guest@newworld.demo', 'demo');
  await api.places.create(input);
  await api.auth.deleteAccount();
  const names = (await relaunch().places.list()).map((place) => place.name);
  expect(names).not.toContain('내 유적');
  expect(names).toContain('마추픽추');
});
