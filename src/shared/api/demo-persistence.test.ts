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

it('앱을 다시 켜도 로그인, 장소, 여정, 체크리스트, 현장 인증이 남습니다', async () => {
  const api = relaunch();
  await api.auth.browse();
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
  const checkIn = {
    id: 'k',
    catalogId: 'avalon',
    checkedAt: '2026-11-10T09:00:00.000Z',
    latitude: 51.1442,
    longitude: -2.6986,
    distanceKm: 0,
    method: 'demo' as const,
  };
  await api.checkins.create(checkIn);

  const next = relaunch();
  expect(next.auth.getCachedSession()?.username).toBe('guest');
  expect((await next.places.get(place.id)).name).toBe('내 유적');
  expect(await next.trips.list()).toEqual([trip]);
  expect(await next.checklist.list()).toEqual([item]);
  expect(await next.checkins.list()).toEqual([checkIn]);
});

it('다시 켜면 사진 주소를 현재 앱 폴더 기준으로 만듭니다', async () => {
  const api = relaunch();
  await api.auth.browse();
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
  const api = relaunch();
  await api.auth.browse();
  expect((await api.places.list()).length).toBeGreaterThan(0);
});

it.each(['null', '3', '[]', '{"records":1,"checklists":2,"trips":"x","session":5}'])(
  '형식이 틀린 저장값(%s)이어도 예시 데이터로 시작합니다',
  async (value) => {
    mockValues.set('newworld.demo.state', value);
    const api = relaunch();
    expect(api.auth.getCachedSession()).toBeNull();
    await api.auth.browse();
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
      checkins: [1, ['guest', 'x'], ['guest', [{ id: 'k' }]]],
    }),
  );
  // 계정 구분 없이 저장하던 이전 형식은 둘러보기 계정의 데이터로 옮깁니다.
  const api = relaunch();
  await api.auth.browse();
  expect((await api.places.list()).map((place) => place.id)).toEqual(['p']);
  expect((await api.records.list()).map((item) => item.id)).toEqual(['r3']);
  expect(await api.trips.list()).toEqual([]);
  expect(await api.checkins.list()).toEqual([]);
});

it('상태를 저장한 뒤에 사진 파일을 지웁니다', async () => {
  const api = relaunch();
  await api.auth.browse();
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
  const state = JSON.parse(storedAtRemoval) as {
    userData: [string, { records: { id: string }[] }][];
  };
  const stored = state.userData.flatMap(([, data]) => data.records.map((item) => item.id));
  expect(stored).not.toContain(saved.id);
});

it('계정 삭제는 예시 데이터로 되돌립니다', async () => {
  const api = relaunch();
  await api.auth.browse();
  await api.places.create(input);
  await api.auth.deleteAccount();
  const next = relaunch();
  await next.auth.browse();
  const names = (await next.places.list()).map((place) => place.name);
  expect(names).not.toContain('내 유적');
  expect(names).toContain('마추픽추');
});

it('이메일로 로그인하던 이전 버전의 세션을 아이디로 바꿔 이어 씁니다', async () => {
  mockValues.set(
    'newworld.demo.state',
    JSON.stringify({
      session: { userId: 'demo-guest@newworld.demo', email: 'guest@newworld.demo' },
    }),
  );
  expect(relaunch().auth.getCachedSession()).toEqual({
    userId: 'demo-guest@newworld.demo',
    username: 'guest',
  });
});

it('가입한 계정과 프로필이 앱을 다시 켜도 남습니다', async () => {
  const api = relaunch();
  await api.auth.signUp({
    username: 'ryushin0',
    password: 'password1',
    nickname: '유신',
    name: '',
  });
  await api.auth.signOut();
  const next = relaunch();
  await next.auth.signIn('ryushin0', 'password1');
  expect((await next.profile.get()).nickname).toBe('유신');
});

it('가입한 계정은 빈 상태로 시작하고, 계정마다 장소와 기록이 따로 남으며, 한 계정을 지워도 다른 계정은 그대로입니다', async () => {
  const api = relaunch();
  await api.auth.signUp({ username: 'alpha', password: 'password1', nickname: '알파', name: '' });
  expect(await api.places.list()).toEqual([]);
  await api.places.create({ ...input, name: '알파의 장소' });
  await api.auth.signOut();
  await api.auth.signUp({ username: 'bravo', password: 'password1', nickname: '브라보', name: '' });
  expect(await api.places.list()).toEqual([]);
  await api.places.create({ ...input, name: '브라보의 장소' });
  await api.auth.deleteAccount();

  const next = relaunch();
  await next.auth.signIn('alpha', 'password1');
  expect((await next.places.list()).map((place) => place.name)).toEqual(['알파의 장소']);
  await next.auth.signOut();
  await next.auth.browse();
  expect((await next.places.list()).map((place) => place.name)).toContain('마추픽추');
  await expect(next.auth.signIn('bravo', 'password1')).rejects.toThrow();
});

it('이전 형식의 데이터는 로그인한 계정이 아니라 둘러보기 계정으로 옮깁니다', async () => {
  const api = relaunch();
  await api.auth.signUp({ username: 'charlie', password: 'password1', nickname: '찰리', name: '' });
  const state = JSON.parse(mockValues.get('newworld.demo.state') as string) as Record<
    string,
    unknown
  >;
  delete state.userData;
  mockValues.set(
    'newworld.demo.state',
    JSON.stringify({ ...state, places: [{ id: 'old', name: '예전 장소' }], records: [] }),
  );
  const next = relaunch();
  expect(next.auth.getCachedSession()?.username).toBe('charlie');
  expect(await next.places.list()).toEqual([]);
  await next.auth.signOut();
  await next.auth.browse();
  expect((await next.places.list()).map((place) => place.id)).toEqual(['old']);
});
