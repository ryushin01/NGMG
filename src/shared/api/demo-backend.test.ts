import { demoBackend as api } from './demo-backend';

jest.mock('../lib/photo', () => ({
  compressPhoto: jest.fn(async () => ({ uri: 'file:///c.jpg' })),
  photoStore: {
    save: jest.fn(async () => 'a.jpg'),
    uriOf: (name: string) => `file:///${name}`,
    remove: jest.fn(),
  },
}));

const baseRecord = (placeId: string) => ({
  placeId,
  visitedAt: '2026-11-01T00:00:00.000Z',
  title: '테스트',
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

it('장소를 만들고 기록과 사진을 저장한 뒤 함께 삭제합니다', async () => {
  const place = await api.places.create({
    name: '새 유적',
    kind: 'real',
    address: '',
    latitude: 34,
    longitude: 127,
    memo: '',
    tags: ['신전'],
    catalogId: null,
    wishlisted: false,
  });
  const record = await api.records.create({
    record: baseRecord(place.id),
    keptPhotos: [],
    newPhotos: [
      { uri: 'file:///1.jpg', width: 10, height: 10 },
      { uri: 'file:///2.jpg', width: 10, height: 10 },
    ],
  });
  expect(record.photos).toHaveLength(2);
  expect(record.placeName).toBe('새 유적');
  expect((await api.places.get(place.id)).recordCount).toBe(1);

  const updated = await api.records.update(record.id, {
    record: baseRecord(place.id),
    keptPhotos: [record.photos[0]],
    newPhotos: [],
  });
  expect(updated.photos).toHaveLength(1);

  await api.places.remove(place.id);
  await expect(api.records.get(record.id)).rejects.toThrow();
});

const signUpInput = {
  username: 'ryushin0',
  password: 'password1',
  nickname: '유신',
  name: '홍길동',
};

it('아이디로 가입하면 바로 로그인하고, 로그인과 로그아웃을 구독자에게 알립니다', async () => {
  const seen: (string | undefined)[] = [];
  const unsubscribe = api.auth.subscribe((session) => seen.push(session?.username));
  await api.auth.signUp(signUpInput);
  await api.auth.signOut();
  await api.auth.signIn('ryushin0', 'password1');
  await api.auth.signOut();
  unsubscribe();
  expect(seen).toEqual(['ryushin0', undefined, 'ryushin0', undefined]);
});

it('비밀번호가 틀리거나 없는 아이디면 로그인하지 않고, 같은 아이디로 다시 가입할 수 없습니다', async () => {
  await expect(api.auth.signIn('ryushin0', 'wrong-pass')).rejects.toThrow(
    'Invalid login credentials',
  );
  await expect(api.auth.signIn('nobody', 'password1')).rejects.toThrow('Invalid login credentials');
  await expect(api.auth.signUp(signUpInput)).rejects.toThrow('already registered');
  await expect(api.auth.signUp({ ...signUpInput, username: 'guest' })).rejects.toThrow(
    'already registered',
  );
  expect(api.auth.getCachedSession()).toBeNull();
});

it('가입할 때 넣은 닉네임과 이름으로 프로필을 만들고 사진을 바꾸거나 지웁니다', async () => {
  await api.auth.signIn('ryushin0', 'password1');
  expect(await api.profile.get()).toEqual({ nickname: '유신', name: '홍길동', avatarUrl: null });
  const withPhoto = await api.profile.update({
    nickname: '유신',
    name: '홍길동',
    avatar: { uri: 'file:///pick.jpg', width: 800, height: 800 },
  });
  expect(withPhoto.avatarUrl).toBe('file:///a.jpg');
  const kept = await api.profile.update({ nickname: '바람', name: '' });
  expect(kept).toEqual({ nickname: '바람', name: '', avatarUrl: 'file:///a.jpg' });
  expect(
    (await api.profile.update({ nickname: '바람', name: '', avatar: null })).avatarUrl,
  ).toBeNull();
});

it('지금 비밀번호가 맞을 때만 비밀번호를 바꿉니다', async () => {
  await expect(api.auth.updatePassword('wrong-pass', 'password2')).rejects.toThrow();
  await api.auth.updatePassword('password1', 'password2');
  await api.auth.signOut();
  await expect(api.auth.signIn('ryushin0', 'password1')).rejects.toThrow();
  await api.auth.signIn('ryushin0', 'password2');
  expect(api.auth.getCachedSession()?.username).toBe('ryushin0');
});

it('둘러보기는 비밀번호 없이 들어가고 닉네임을 정해 둡니다', async () => {
  await api.auth.browse();
  expect(api.auth.getCachedSession()?.username).toBe('guest');
  expect((await api.profile.get()).nickname).toBe('둘러보는 여행자');
});

it('이름과 주소로 검색합니다', async () => {
  expect((await api.search.places('쿠스')).map((item) => item.name)).toContain('쿠스코');
  expect(await api.search.places('없는장소')).toEqual([]);
});
