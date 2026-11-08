import type { TripRecord } from '@/shared/api';
import { collectMembers } from './history';

const record = (overrides: Partial<TripRecord>) =>
  ({ placeId: 'p', placeKind: 'real', members: [], ...overrides }) as TripRecord;

it('분류가 같은 기록의 동행을 자주 나온 순으로 모읍니다', () => {
  const records = [
    record({ members: ['민수'] }),
    record({ members: ['지훈', '민수'] }),
    record({ placeKind: 'fantasy', members: ['외부'] }),
  ];
  expect(collectMembers(records, 'real')).toEqual(['민수', '지훈']);
});
