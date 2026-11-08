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

it('로그인과 로그아웃을 구독자에게 알립니다', async () => {
  const seen: (string | undefined)[] = [];
  const unsubscribe = api.auth.subscribe((session) => seen.push(session?.email));
  await api.auth.signIn('a@b.co', 'password');
  await api.auth.signOut();
  unsubscribe();
  expect(seen).toEqual(['a@b.co', undefined]);
});

it('이름과 주소로 검색합니다', async () => {
  expect((await api.search.places('쿠스')).map((item) => item.name)).toContain('쿠스코');
  expect(await api.search.places('없는장소')).toEqual([]);
});
