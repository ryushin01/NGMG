import type { TripRecord } from '@/shared/api';
import { collectMembers, findLastFishing } from './history';

const record = (overrides: Partial<TripRecord>) =>
  ({
    placeId: 'p',
    placeKind: 'fishing',
    members: [],
    gear: '',
    rig: '',
    bait: '',
    ...overrides,
  }) as TripRecord;

it('분류가 같은 기록의 멤버를 자주 나온 순으로 모읍니다', () => {
  const records = [
    record({ members: ['민수'] }),
    record({ members: ['지훈', '민수'] }),
    record({ placeKind: 'restaurant', members: ['외부'] }),
  ];
  expect(collectMembers(records, 'fishing')).toEqual(['민수', '지훈']);
});

it('같은 장소의 기록을 우선하고 장비가 빈 기록은 건너뜁니다', () => {
  const empty = record({ placeId: 'a' });
  const other = record({ placeId: 'b', rig: '반유동' });
  const same = record({ placeId: 'a', gear: '1호대' });
  expect(findLastFishing([empty, other, same], 'a')).toBe(same);
  expect(findLastFishing([empty, other], 'a')).toBe(other);
  expect(findLastFishing([empty], 'a')).toBeUndefined();
});
